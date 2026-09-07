/**
 * Centralized task priority enum. Never compare against raw string literals
 * elsewhere in the codebase — always import this enum.
 */
export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export const TASK_PRIORITIES = Object.values(TaskPriority);
