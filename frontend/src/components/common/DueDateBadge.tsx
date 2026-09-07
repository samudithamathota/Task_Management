import { getDueDateStatus, formatDisplayDate, DueDateStatus } from "@/utils/date";

interface DueDateBadgeProps {
  dueDate: string | null;
}

const STATUS_TEXT: Record<DueDateStatus, { label: string; icon: string }> = {
  none: { label: "No due date", icon: "—" },
  overdue: { label: "Overdue", icon: "⚠" },
  "due-today": { label: "Due today", icon: "●" },
  upcoming: { label: "Upcoming", icon: "→" },
};

/**
 * Renders a task's due date status as icon + text + color, so overdue vs.
 * upcoming stays distinguishable without relying on color alone.
 */
export function DueDateBadge({ dueDate }: DueDateBadgeProps) {
  const status = getDueDateStatus(dueDate);
  const { label, icon } = STATUS_TEXT[status];
  const dateText = dueDate ? formatDisplayDate(dueDate) : null;
  const text = dateText ? `${label} (${dateText})` : label;

  return (
    <span className={`due-date-badge due-date-${status}`} aria-label={text}>
      <span aria-hidden="true">{icon}</span> {text}
    </span>
  );
}
