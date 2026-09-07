import { Project, IProject } from "../models/Project";
import { Task } from "../models/Task";
import { UserRole } from "../constants/roles";
import { ApiError } from "../utils/ApiError";
import { AuthenticatedUser } from "../types/express";
import { buildVisibilityFilter as buildTaskVisibilityFilter } from "./task.service";

const SAFE_USER_FIELDS = "name email role";

function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === UserRole.ADMIN;
}

function isOwner(project: IProject, user: AuthenticatedUser): boolean {
  return project.createdBy.toString() === user.id;
}

/**
 * A normal user sees a project if they own it, OR if it contains at least
 * one task visible to them (created by them or assigned to them — the same
 * rule getTasks already uses). That second half is what lets a user see a
 * project an admin created for them, once a task in it is assigned to them
 * — without it, an assigned task's own project name would be visible on
 * the task card but the project itself would never appear in their list.
 * An administrator sees every project system-wide.
 */
async function buildVisibilityFilter(user: AuthenticatedUser) {
  if (isAdmin(user)) return {};

  const projectIdsFromVisibleTasks = await Task.distinct("project", buildTaskVisibilityFilter(user));

  return {
    $or: [{ createdBy: user.id }, { _id: { $in: projectIdsFromVisibleTasks } }],
  };
}

async function findProjectOrThrow(id: string): Promise<IProject> {
  const project = await Project.findById(id);
  if (!project) {
    throw ApiError.notFound("Project not found");
  }
  return project;
}

/** Same rule as buildVisibilityFilter, applied to one already-fetched project. */
async function canViewProject(user: AuthenticatedUser, project: IProject): Promise<boolean> {
  if (isAdmin(user) || isOwner(project, user)) return true;

  const hasVisibleTask = await Task.exists({
    project: project._id,
    ...buildTaskVisibilityFilter(user),
  });
  return Boolean(hasVisibleTask);
}

export async function createProject(user: AuthenticatedUser, name: string, description: string) {
  const project = await Project.create({
    name,
    description,
    createdBy: user.id,
  });

  return project.populate({ path: "createdBy", select: SAFE_USER_FIELDS });
}

export async function getProjects(user: AuthenticatedUser) {
  const filter = await buildVisibilityFilter(user);

  const projects = await Project.find(filter)
    .sort({ createdAt: -1 })
    .populate("createdBy", SAFE_USER_FIELDS);

  // Scoped by the same task-visibility rule as the projects themselves —
  // otherwise a user could see a count that includes tasks GET /tasks would
  // never actually show them (e.g. a project owner's other tasks they
  // aren't assigned to). For an admin this is the true, system-wide count.
  const taskVisibilityFilter = buildTaskVisibilityFilter(user);
  const counts = await Task.aggregate<{ _id: unknown; count: number }>([
    {
      $match: {
        $and: [{ project: { $in: projects.map((p) => p._id) } }, taskVisibilityFilter],
      },
    },
    { $group: { _id: "$project", count: { $sum: 1 } } },
  ]);
  const countByProjectId = new Map(counts.map((row) => [String(row._id), row.count]));

  return projects.map((project) => ({
    project,
    taskCount: countByProjectId.get(String(project._id)) ?? 0,
  }));
}

export async function getProjectById(user: AuthenticatedUser, id: string) {
  const project = await findProjectOrThrow(id);

  if (!(await canViewProject(user, project))) {
    throw ApiError.forbidden("You do not have access to this project");
  }

  return project.populate({ path: "createdBy", select: SAFE_USER_FIELDS });
}

export async function updateProject(
  user: AuthenticatedUser,
  id: string,
  updates: { name?: string; description?: string }
) {
  const project = await findProjectOrThrow(id);

  // Editing/deleting stays owner-or-admin only — the broader "can view"
  // rule above only ever expands who can *see* a project, never who can
  // manage it.
  if (!isAdmin(user) && !isOwner(project, user)) {
    throw ApiError.forbidden("Only the project owner or an administrator can edit this project");
  }

  if (updates.name !== undefined) project.name = updates.name;
  if (updates.description !== undefined) project.description = updates.description;

  await project.save();

  return project.populate({ path: "createdBy", select: SAFE_USER_FIELDS });
}

export async function deleteProject(user: AuthenticatedUser, id: string): Promise<void> {
  const project = await findProjectOrThrow(id);

  if (!isAdmin(user) && !isOwner(project, user)) {
    throw ApiError.forbidden("Only the project owner or an administrator can delete this project");
  }

  // Mirrors deleteUser's rule for a user who still owns tasks: block rather
  // than silently cascading or orphaning tasks.
  const taskCount = await Task.countDocuments({ project: project._id });
  if (taskCount > 0) {
    throw ApiError.badRequest("Delete or move this project's tasks before deleting the project");
  }

  await project.deleteOne();
}
