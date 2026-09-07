"use client";

import { FormEvent, useState } from "react";
import { Task } from "@/types/task";
import { Input, Textarea } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { ApiClientError } from "@/lib/apiClient";
import { SafeUser } from "@/types/user";
import { ProjectSummary } from "@/types/project";
import { TASK_PRIORITIES, TaskPriorityType } from "@/constants/taskPriority";
import { toDateInputValue, getDueDateStatus } from "@/utils/date";

interface EditTaskFormProps {
  task: Task;
  onSubmit: (
    updates: {
      title?: string;
      description?: string;
      startDate?: string;
      dueDate?: string | null;
      priority?: TaskPriorityType;
      projectId?: string;
    },
    assignTo: string | null
  ) => Promise<void>;
  onCancel: () => void;
  /** Only admins may reassign a task from here; other roles never see the field. */
  isAdmin: boolean;
  users: SafeUser[];
  /** Every project the current user may move this task into. */
  projects: ProjectSummary[];
}

export function EditTaskForm({ task, onSubmit, onCancel, isAdmin, users, projects }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [startDate, setStartDate] = useState(toDateInputValue(task.startDate));
  // Due date is optional — "" represents "no due date" and is sent as null.
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
  const [priority, setPriority] = useState<TaskPriorityType>(task.priority);
  // task.project can be missing on data from before the Project feature
  // existed, until the one-time migration backfills it (see backend
  // scripts/migrateTasksToProjects.ts) — fall back to "" so this never
  // throws, forcing the user to pick a real project to clear it.
  const [projectId, setProjectId] = useState(task.project?._id ?? "");
  const [assignTo, setAssignTo] = useState(task.assignedTo?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alerts the user their chosen due date has already passed. Informational
  // only — it doesn't block saving (a task can legitimately carry a due
  // date already in the past).
  const isDueDateInPast = getDueDateStatus(dueDate) === "overdue";

  // The task's current project might belong to someone else's list (e.g. an
  // admin editing another user's task) — always include it as an option so
  // the select never silently jumps to a different project on open. A task
  // with no project yet (pre-migration data) contributes no extra option;
  // the user must pick one to save.
  const taskProject = task.project;
  const projectOptions =
    taskProject && !projects.some((p) => p._id === taskProject._id) ? [taskProject, ...projects] : projects;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (dueDate && dueDate < startDate) {
      setError("Due date cannot be before start date");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim(),
          startDate,
          dueDate: dueDate || null,
          priority,
          projectId,
        },
        isAdmin ? assignTo || null : null
      );
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={150} />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={2000}
        rows={4}
      />

      <div className="form-field">
        <label htmlFor="project">Project</label>
        <select id="project" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
          {!projectId && <option value="">Select project</option>}
          {projectOptions.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Start Date"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
      />

      <div className="form-field">
        <label htmlFor="due-date">Due Date (optional)</label>
        <div className="field-with-action">
          <input
            id="due-date"
            type="date"
            className="input"
            value={dueDate}
            min={startDate || undefined}
            onChange={(e) => setDueDate(e.target.value)}
            aria-describedby="due-date-hint"
          />
          {dueDate && (
            <button
              type="button"
              className="link-btn"
              onClick={() => setDueDate("")}
              aria-label="Remove due date"
            >
              Clear
            </button>
          )}
        </div>
        <p id="due-date-hint" className="field-hint">
          {dueDate ? "" : "This task currently has no deadline."}
        </p>
        {isDueDateInPast && (
          <p className="field-alert" role="alert">
            <span aria-hidden="true">⚠</span> Warning: the selected due date is in the past.
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriorityType)}
        >
          {TASK_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.icon} {p.label}
            </option>
          ))}
        </select>
      </div>

      {isAdmin && (
        <div className="form-field">
          <label htmlFor="assign-to">Assign To</label>
          <select id="assign-to" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
            <option value="">Select user</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="field-error form-error">{error}</p>}
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
