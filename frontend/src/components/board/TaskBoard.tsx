"use client";

import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Task } from "@/types/task";
import { SafeUser } from "@/types/user";
import { ProjectSummary } from "@/types/project";
import { TASK_COLUMNS, TaskStatusType } from "@/constants/taskStatus";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/context/AuthContext";
import { fetchUsers } from "@/services/user.service";
import { TaskColumn } from "./TaskColumn";
import { TaskSearch } from "./TaskSearch";
import { Loading, ErrorMessage, EmptyState } from "@/components/common/StateViews";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { CreateTaskForm } from "@/components/tasks/CreateTaskForm";
import { EditTaskForm } from "@/components/tasks/EditTaskForm";
import { ApiClientError } from "@/lib/apiClient";

interface TaskBoardProps {
  /** Scopes the board to one project's tasks; omit for the "all my tasks" board. */
  projectId?: string;
  title?: string;
  /** Every project the current user may file/move a task into — fetched once by the caller. */
  projects: ProjectSummary[];
  /** Pre-selects this project when creating a task from here (usually === projectId). */
  defaultProjectId?: string;
}

export function TaskBoard({ projectId, title = "Task Board", projects, defaultProjectId }: TaskBoardProps) {
  const {
    tasks,
    isLoading,
    isSearching,
    error,
    search,
    setSearch,
    addTask,
    editTask,
    removeTask,
    reassignTask,
    changeStatus,
  } = useTasks(projectId);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [users, setUsers] = useState<SafeUser[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // The user list backs the "Assign To" select and is only readable by
  // admins server-side (GET /users is admin-only) — skip it otherwise.
  useEffect(() => {
    if (!isAdmin) {
      setUsers([]);
      return;
    }
    fetchUsers()
      .then(({ users: fetched }) => setUsers(fetched.filter((u) => u.role === "USER")))
      .catch(() => setUsers([]));
  }, [isAdmin]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatusType;
    const task = tasks.find((t) => t._id === taskId);

    if (!task || task.status === newStatus) return;

    try {
      await changeStatus(taskId, newStatus);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Failed to update task status");
    }
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await removeTask(task._id);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Failed to delete task");
    }
  };

  if (isLoading) return <Loading label="Loading tasks..." />;
  if (error) return <ErrorMessage message={error} />;

  const hasActiveSearch = search.trim().length > 0;
  const hasNoResults = hasActiveSearch && !isSearching && tasks.length === 0;

  return (
    <div className="board-wrapper">
      <div className="board-toolbar">
        <h1>{title}</h1>
        <Button onClick={() => setIsCreateOpen(true)}>+ Create Task</Button>
      </div>

      <TaskSearch value={search} onChange={setSearch} isSearching={isSearching} />

      {actionError && <ErrorMessage message={actionError} />}

      {hasNoResults ? (
        <EmptyState message={`No tasks match "${search.trim()}".`} />
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="board-columns">
            {TASK_COLUMNS.map((col) => (
              <TaskColumn
                key={col.status}
                status={col.status}
                label={col.label}
                tasks={tasks.filter((t) => t.status === col.status)}
                onEdit={setEditingTask}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </DndContext>
      )}

      {isCreateOpen && (
        <Modal title="Create Task" onClose={() => setIsCreateOpen(false)}>
          <CreateTaskForm
            isAdmin={isAdmin}
            users={users}
            projects={projects}
            defaultProjectId={defaultProjectId ?? projectId}
            onSubmit={async (title, description, startDate, dueDate, priority, taskProjectId, assignTo) => {
              await addTask(title, description, startDate, dueDate, priority, taskProjectId, assignTo);
              setIsCreateOpen(false);
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </Modal>
      )}

      {editingTask && (
        <Modal title="Edit Task" onClose={() => setEditingTask(null)}>
          <EditTaskForm
            task={editingTask}
            isAdmin={isAdmin}
            users={users}
            projects={projects}
            onSubmit={async (updates, assignTo) => {
              await editTask(editingTask._id, updates);
              const currentAssignee = editingTask.assignedTo?.id ?? null;
              if (isAdmin && assignTo !== currentAssignee) {
                await reassignTask(editingTask._id, assignTo);
              }
              setEditingTask(null);
            }}
            onCancel={() => setEditingTask(null)}
          />
        </Modal>
      )}
    </div>
  );
}
