import { SafeUser } from "./user";

export interface Project {
  _id: string;
  name: string;
  description: string;
  createdBy: SafeUser;
  createdAt: string;
  updatedAt: string;
}

/** The shape a task's populated `project` field carries — id + name only. */
export interface ProjectSummary {
  _id: string;
  name: string;
}

export interface ProjectListEntry {
  project: Project;
  taskCount: number;
}
