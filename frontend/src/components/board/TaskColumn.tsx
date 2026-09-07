"use client";

import { useDroppable } from "@dnd-kit/core";
import { Task } from "@/types/task";
import { TaskStatusType } from "@/constants/taskStatus";
import { TaskCard } from "./TaskCard";

interface TaskColumnProps {
  status: TaskStatusType;
  label: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskColumn({ status, label, tasks, onEdit, onDelete }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} className={`task-column ${isOver ? "task-column-over" : ""}`}>
      <div className="task-column-header">
        <h3>{label}</h3>
        <span className="task-count">{tasks.length}</span>
      </div>

      <div className="task-column-body">
        {tasks.length === 0 && <p className="task-column-empty">No tasks here yet.</p>}
        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
