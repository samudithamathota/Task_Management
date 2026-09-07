"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/task";
import { useAuth } from "@/context/AuthContext";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { DueDateBadge } from "@/components/common/DueDateBadge";
import { formatDisplayDate } from "@/utils/date";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { user } = useAuth();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 10 : undefined }
    : undefined;

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const isOwner = task.createdBy.id === user.id;
  const canEdit = isAdmin || isOwner;

  return (
    <div ref={setNodeRef} style={style} className={`task-card ${isDragging ? "dragging" : ""}`}>
      <div className="task-card-drag-handle" {...listeners} {...attributes}>
        <div className="task-card-header">
          <p className="task-card-title">{task.title}</p>
          <PriorityBadge priority={task.priority} />
        </div>
        {task.description && <p className="task-card-desc">{task.description}</p>}
      </div>

      <div className="task-card-meta">
        <span>Project: {task.project?.name ?? "No project"}</span>
        <span>Created by {task.createdBy.name}</span>
        <span>{task.assignedTo ? `Assigned to ${task.assignedTo.name}` : "Unassigned"}</span>
        <span>Start: {formatDisplayDate(task.startDate)}</span>
        <DueDateBadge dueDate={task.dueDate} />
      </div>

      <div className="task-card-actions">
        {canEdit && (
          <button className="link-btn" onClick={() => onEdit(task)}>
            Edit
          </button>
        )}
        {canEdit && (
          <button className="link-btn link-danger" onClick={() => onDelete(task)}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
