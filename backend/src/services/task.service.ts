import { Types } from "mongoose";
import { Task, ITask } from "../models/Task";
import { User } from "../models/User";
import { Project, IProject } from "../models/Project";
import { TaskStatus, TASK_STATUSES } from "../constants/taskStatus";
import { TaskPriority, TASK_PRIORITIES } from "../constants/taskPriority";
import { UserRole } from "../constants/roles";
import { ApiError } from "../utils/ApiError";
import { AuthenticatedUser } from "../types/express";

const SAFE_USER_FIELDS = "name email role";
const PROJECT_FIELDS = "name";
const TASK_POPULATE = [
  { path: "createdBy", select: SAFE_USER_FIELDS },
  { path: "assignedTo", select: SAFE_USER_FIELDS },
  { path: "project", select: PROJECT_FIELDS },
];

function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === UserRole.ADMIN;
}

/**
 * A normal user may only see tasks that they created or tasks assigned to
 * them. Administrators bypass this restriction entirely.
 *
 * Exported because project.service.ts reuses this exact rule to decide
 * which projects a user can see (any project containing a task visible to
 * them, not just ones they own) — duplicating this predicate there would
 * risk the two definitions of "visible task" drifting apart.
 */
export function buildVisibilityFilter(user: AuthenticatedUser) {
  if (isAdmin(user)) return {};

  const userObjectId = new Types.ObjectId(user.id);

  return {
    $or: [{ createdBy: userObjectId }, { assignedTo: userObjectId }],
  };
}

function buildStatisticsFilter(user: AuthenticatedUser) {
  if (isAdmin(user)) return {};

  return { assignedTo: new Types.ObjectId(user.id) };
}

async function findTaskOrThrow(id: string): Promise<ITask> {
  const task = await Task.findById(id);
  if (!task) {
    throw ApiError.notFound("Task not found");
  }
  return task;
}

function isOwner(task: ITask, user: AuthenticatedUser): boolean {
  return task.createdBy.toString() === user.id;
}

function isAssignee(task: ITask, user: AuthenticatedUser): boolean {
  return task.assignedTo?.toString() === user.id;
}

/** Escapes regex metacharacters so user-typed search text is matched literally. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds a case-insensitive "contains" match against title/description.
 * The search text is always escaped and only ever placed inside a RegExp
 * value (never merged into the filter object itself), so user input can't
 * inject Mongo query operators — it can only ever mean "search for this text".
 */
function buildSearchFilter(search: string) {
  const pattern = new RegExp(escapeRegex(search), "i");
  return { $or: [{ title: pattern }, { description: pattern }] };
}

/** dueDate is optional/nullable — `undefined`/`null` both resolve to "no due date". */
function parseDueDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

function assertDueDateNotBeforeStart(startDate: Date, dueDate: Date | null): void {
  if (dueDate && dueDate < startDate) {
    throw ApiError.badRequest("Due date cannot be before start date");
  }
}

async function findAssignableUserOrThrow(userId: string) {
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw ApiError.badRequest("The specified user does not exist");
  }
  if (targetUser.role !== UserRole.USER) {
    throw ApiError.badRequest("Tasks can only be assigned to users with the USER role");
  }
  return targetUser;
}

/**
 * A task can only be filed into a project its creator owns, or any project
 * at all if the caller is an admin — there's no shared/member project
 * concept, so this is the only gate on "which project can this task join".
 */
async function findOwnedProjectOrThrow(user: AuthenticatedUser, projectId: string): Promise<IProject> {
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.badRequest("The specified project does not exist");
  }
  if (!isAdmin(user) && project.createdBy.toString() !== user.id) {
    throw ApiError.forbidden("You can only add tasks to a project you own");
  }
  return project;
}

export async function createTask(
  user: AuthenticatedUser,
  title: string,
  description: string,
  startDate: string,
  dueDate: string | null | undefined,
  projectId: string,
  priority?: TaskPriority,
  assignedTo?: string
) {
  const start = new Date(startDate);
  const due = parseDueDate(dueDate);
  let assigneeId = new Types.ObjectId(user.id);

  assertDueDateNotBeforeStart(start, due);
  const project = await findOwnedProjectOrThrow(user, projectId);

  if (isAdmin(user)) {
    if (!assignedTo) {
      throw ApiError.badRequest("An assignee is required when an administrator creates a task");
    }

    const targetUser = await findAssignableUserOrThrow(assignedTo);
    assigneeId = targetUser._id;
  }

  // createdBy/status are always set by the server. Normal users are assigned
  // their own tasks immediately; admins must choose an assignee on creation.
  const task = await Task.create({
    title,
    description,
    status: TaskStatus.TODO,
    priority: priority ?? TaskPriority.MEDIUM,
    startDate: start,
    dueDate: due,
    createdBy: user.id,
    assignedTo: assigneeId,
    project: project._id,
  });

  return task.populate(TASK_POPULATE);
}

export async function getTasks(user: AuthenticatedUser, search?: string, projectId?: string) {
  // Every condition is ANDed together rather than spread into one object,
  // since more than one of these may carry its own top-level `$or` —
  // spreading would let one silently clobber another.
  const conditions: Record<string, unknown>[] = [buildVisibilityFilter(user)];

  // Empty/whitespace-only search is treated as "no search" — same result
  // set as before this feature existed, for both roles.
  const trimmedSearch = search?.trim();
  if (trimmedSearch) conditions.push(buildSearchFilter(trimmedSearch));

  if (projectId) conditions.push({ project: projectId });

  const filter = conditions.length > 1 ? { $and: conditions } : conditions[0];

  return Task.find(filter)
    .sort({ createdAt: -1 })
    .populate("createdBy", SAFE_USER_FIELDS)
    .populate("assignedTo", SAFE_USER_FIELDS)
    .populate("project", PROJECT_FIELDS);
}

export interface TaskStatistics {
  totalTasks: number;
  byStatus: Record<TaskStatus, number>;
  overdueTasks: number;
}

export interface AdminTaskStatistics extends TaskStatistics {
  totalUsers: number;
  unassignedTasks: number;
  byPriority: Record<TaskPriority, number>;
}

interface CountRow<T extends string> {
  _id: T;
  count: number;
}

/** Shape of the single `$facet` aggregation result before zero-filling. */
interface RawTaskStatsFacet {
  total: { count: number }[];
  byStatus: CountRow<TaskStatus>[];
  byPriority: CountRow<TaskPriority>[];
  unassigned: { count: number }[];
  overdue: { count: number }[];
}

/** Fills in 0 for every known key so a status/priority with no matches still appears. */
function toCountMap<T extends string>(keys: readonly T[], rows: CountRow<T>[]): Record<T, number> {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;
  for (const row of rows) {
    counts[row._id] = row.count;
  }
  return counts;
}

/**
 * A dueDate is a calendar day stored as UTC midnight for that day (see the
 * Task model). Comparing against the start of *today* — rather than the
 * exact current instant — is what keeps a task due today out of the
 * overdue bucket for the whole day, not just until midnight UTC hits.
 */
function getStartOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Computes task counts for the dashboard in a single aggregation round-trip
 * (via $facet) rather than loading matching tasks into memory. Admins get
 * system-wide counts, while normal users only get counts for tasks assigned
 * to them.
 */
export async function getTaskStatistics(
  user: AuthenticatedUser
): Promise<TaskStatistics | AdminTaskStatistics> {
  const filter = buildStatisticsFilter(user);
  const startOfTodayUtc = getStartOfTodayUtc();

  const [result] = await Task.aggregate<RawTaskStatsFacet>([
    { $match: filter },
    {
      $facet: {
        total: [{ $count: "count" }],
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        byPriority: [{ $group: { _id: "$priority", count: { $sum: 1 } } }],
        unassigned: [{ $match: { assignedTo: null } }, { $count: "count" }],
        // A finished task isn't "overdue" even if its due date has passed.
        overdue: [
          { $match: { dueDate: { $ne: null, $lt: startOfTodayUtc }, status: { $ne: TaskStatus.DONE } } },
          { $count: "count" },
        ],
      },
    },
  ]);

  const totalTasks = result.total[0]?.count ?? 0;
  const byStatus = toCountMap(TASK_STATUSES, result.byStatus);
  const overdueTasks = result.overdue[0]?.count ?? 0;

  if (!isAdmin(user)) {
    return { totalTasks, byStatus, overdueTasks };
  }

  return {
    totalTasks,
    byStatus,
    overdueTasks,
    totalUsers: await User.countDocuments(),
    unassignedTasks: result.unassigned[0]?.count ?? 0,
    byPriority: toCountMap(TASK_PRIORITIES, result.byPriority),
  };
}

export async function getTaskById(user: AuthenticatedUser, id: string) {
  const task = await findTaskOrThrow(id);

  if (!isAdmin(user) && !isOwner(task, user) && !isAssignee(task, user) && task.assignedTo !== null) {
    throw ApiError.forbidden("You do not have access to this task");
  }

  return task.populate(TASK_POPULATE);
}

export async function updateTask(
  user: AuthenticatedUser,
  id: string,
  updates: {
    title?: string;
    description?: string;
    startDate?: string;
    dueDate?: string | null;
    priority?: TaskPriority;
    projectId?: string;
  }
) {
  const task = await findTaskOrThrow(id);

  if (!isAdmin(user) && !isOwner(task, user)) {
    throw ApiError.forbidden("Only the task creator or an administrator can edit this task");
  }

  if (updates.title !== undefined) task.title = updates.title;
  if (updates.description !== undefined) task.description = updates.description;
  if (updates.startDate !== undefined) task.startDate = new Date(updates.startDate);
  // `dueDate` is nullable: an explicit `null` clears it, a string sets it,
  // and `undefined` (key absent) leaves the stored value untouched.
  if (updates.dueDate !== undefined) task.dueDate = parseDueDate(updates.dueDate);
  if (updates.priority !== undefined) task.priority = updates.priority;
  // Moving a task requires owning (or being admin over) both the task
  // itself (checked above) and the destination project.
  if (updates.projectId !== undefined) {
    const project = await findOwnedProjectOrThrow(user, updates.projectId);
    task.project = project._id;
  }

  // Validate against the merged, persisted state so a partial update (e.g.
  // only startDate moving past the existing dueDate) is still caught.
  assertDueDateNotBeforeStart(task.startDate, task.dueDate);

  await task.save();

  return task.populate(TASK_POPULATE);
}

export async function deleteTask(user: AuthenticatedUser, id: string): Promise<void> {
  const task = await findTaskOrThrow(id);

  if (!isAdmin(user) && !isOwner(task, user)) {
    throw ApiError.forbidden("Only the task creator or an administrator can delete this task");
  }

  await task.deleteOne();
}

export async function updateTaskStatus(user: AuthenticatedUser, id: string, status: TaskStatus) {
  const task = await findTaskOrThrow(id);

  const canManage = isAdmin(user) || isOwner(task, user) || isAssignee(task, user);
  if (!canManage) {
    throw ApiError.forbidden("You are not authorized to change the status of this task");
  }

  task.status = status;
  await task.save();

  return task.populate(TASK_POPULATE);
}

export async function assignTask(
  user: AuthenticatedUser,
  id: string,
  targetUserId: string | null | undefined
) {
  const task = await findTaskOrThrow(id);

  if (!isAdmin(user)) {
    throw ApiError.forbidden("Only an administrator can assign tasks");
  }

  if (!targetUserId) {
    throw ApiError.badRequest("An assignee is required");
  }

  const targetUser = await findAssignableUserOrThrow(targetUserId);
  task.assignedTo = targetUser._id;

  await task.save();

  return task.populate(TASK_POPULATE);
}
