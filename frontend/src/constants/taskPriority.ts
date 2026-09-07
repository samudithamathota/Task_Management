export const TaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type TaskPriorityType = (typeof TaskPriority)[keyof typeof TaskPriority];

/**
 * Icon is a redundant, non-color cue so priority is distinguishable even
 * without relying on the badge's background color (e.g. color-blind users,
 * grayscale printouts).
 */
export const TASK_PRIORITIES: { value: TaskPriorityType; label: string; icon: string }[] = [
  { value: TaskPriority.LOW, label: "Low", icon: "↓" },
  { value: TaskPriority.MEDIUM, label: "Medium", icon: "→" },
  { value: TaskPriority.HIGH, label: "High", icon: "↑" },
  { value: TaskPriority.URGENT, label: "Urgent", icon: "⚠" },
];

export const DEFAULT_TASK_PRIORITY: TaskPriorityType = TaskPriority.MEDIUM;
