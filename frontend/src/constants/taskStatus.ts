export const TaskStatus = {
  TODO: "TODO",
  DOING: "DOING",
  DONE: "DONE",
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TASK_COLUMNS: { status: TaskStatusType; label: string }[] = [
  { status: TaskStatus.TODO, label: "To Do" },
  { status: TaskStatus.DOING, label: "Doing" },
  { status: TaskStatus.DONE, label: "Done" },
];
