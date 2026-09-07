/**
 * Centralized task status enum. Never compare against raw string literals
 * elsewhere in the codebase — always import this enum.
 */
export enum TaskStatus {
  TODO = "TODO",
  DOING = "DOING",
  DONE = "DONE",
}

export const TASK_STATUSES = Object.values(TaskStatus);
