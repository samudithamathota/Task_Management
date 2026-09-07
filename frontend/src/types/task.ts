import { TaskStatusType } from "@/constants/taskStatus";
import { TaskPriorityType } from "@/constants/taskPriority";
import { SafeUser } from "./user";
import { ProjectSummary } from "./project";

export interface Task {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  /** Optional deadline. `null` when the task has no due date. */
  dueDate: string | null;
  status: TaskStatusType;
  priority: TaskPriorityType;
  createdBy: SafeUser;
  assignedTo: SafeUser | null;
  // Every *new* task belongs to exactly one project, but data created
  // before the Project feature existed may still be un-migrated (see
  // backend scripts/migrateTasksToProjects.ts) — treat this as possibly
  // missing everywhere it's read.
  project: ProjectSummary | null;
  createdAt: string;
  updatedAt: string;
}
