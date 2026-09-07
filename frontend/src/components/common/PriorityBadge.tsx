import { TaskPriorityType, TASK_PRIORITIES } from "@/constants/taskPriority";

interface PriorityBadgeProps {
  priority: TaskPriorityType;
}

/**
 * Renders a task's priority as icon + text label + color, so it stays
 * distinguishable without relying on color alone (color-blind users,
 * grayscale printouts, screen readers via aria-label).
 */
export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const info = TASK_PRIORITIES.find((p) => p.value === priority);
  const label = info?.label ?? priority;

  return (
    <span className={`priority-badge priority-${priority.toLowerCase()}`} aria-label={`Priority: ${label}`}>
      <span aria-hidden="true">{info?.icon}</span> {label}
    </span>
  );
}
