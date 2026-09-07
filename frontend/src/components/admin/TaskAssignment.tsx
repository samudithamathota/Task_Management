"use client";

import { useState } from "react";
import { Task } from "@/types/task";
import { SafeUser } from "@/types/user";
import { TASK_COLUMNS } from "@/constants/taskStatus";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { DueDateBadge } from "@/components/common/DueDateBadge";
import { formatDisplayDate } from "@/utils/date";
import { ApiClientError } from "@/lib/apiClient";

interface TaskAssignmentProps {
  tasks: Task[];
  users: SafeUser[];
  onReassign: (taskId: string, userId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskAssignment({ tasks, users, onReassign, onDelete }: TaskAssignmentProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  if (tasks.length === 0) {
    return <p className="task-column-empty">No tasks found.</p>;
  }

  const handleAssignChange = async (taskId: string, value: string) => {
    setPendingId(taskId);
    setRowError((prev) => ({ ...prev, [taskId]: "" }));
    try {
      if (!value) throw new ApiClientError(400, "Select a user before assigning the task");
      await onReassign(taskId, value);
    } catch (err) {
      setRowError((prev) => ({
        ...prev,
        [taskId]: err instanceof ApiClientError ? err.message : "Failed to update assignment",
      }));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Project</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Start Date</th>
          <th>Due Date</th>
          <th>Created By</th>
          <th>Assigned To</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task._id}>
            <td>{task.title}</td>
            <td>{task.project?.name ?? "—"}</td>
            <td>
              <span className="status-badge">
                {TASK_COLUMNS.find((c) => c.status === task.status)?.label ?? task.status}
              </span>
            </td>
            <td>
              <PriorityBadge priority={task.priority} />
            </td>
            <td>{formatDisplayDate(task.startDate)}</td>
            <td>
              <DueDateBadge dueDate={task.dueDate} />
            </td>
            <td>{task.createdBy.name}</td>
            <td>
              <select
                value={task.assignedTo?.id ?? ""}
                disabled={pendingId === task._id}
                onChange={(e) => handleAssignChange(task._id, e.target.value)}
              >
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {rowError[task._id] && <p className="field-error">{rowError[task._id]}</p>}
            </td>
            <td>
              <button className="link-btn link-danger" onClick={() => onDelete(task._id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
