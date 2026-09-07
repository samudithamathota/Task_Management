"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Input, Textarea } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { ApiClientError } from "@/lib/apiClient";
import { SafeUser } from "@/types/user";
import { ProjectSummary } from "@/types/project";
import { TASK_PRIORITIES, DEFAULT_TASK_PRIORITY, TaskPriorityType } from "@/constants/taskPriority";
import { getDueDateStatus } from "@/utils/date";

interface CreateTaskFormProps {
  onSubmit: (
    title: string,
    description: string,
    startDate: string,
    dueDate: string | null,
    priority: TaskPriorityType,
    projectId: string,
    assignTo: string | null
  ) => Promise<void>;
  onCancel: () => void;
  /** Only admins may assign a task on creation; other roles never see the field. */
  isAdmin: boolean;
  users: SafeUser[];
  /** Every project the current user may file a task into. */
  projects: ProjectSummary[];
  /** Pre-selects this project (e.g. when creating from inside that project's own board). */
  defaultProjectId?: string;
}

export function CreateTaskForm({
  onSubmit,
  onCancel,
  isAdmin,
  users,
  projects,
  defaultProjectId,
}: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  // Due date is optional — kept as "" while unset, converted to null on submit.
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriorityType>(DEFAULT_TASK_PRIORITY);
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [assignTo, setAssignTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alerts the user their chosen due date has already passed. Informational
  // only — it doesn't block submission (a task can legitimately be logged
  // with a due date already in the past).
  const isDueDateInPast = getDueDateStatus(dueDate) === "overdue";

  if (projects.length === 0) {
    return (
      <p className="field-hint">
        You need a project before you can create a task.{" "}
        <Link href="/projects">Create one first</Link>.
      </p>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectId) {
      setError("Select a project for this task");
      return;
    }

    if (isAdmin && !assignTo) {
      setError("Assign a user before creating the task");
      return;
    }

    if (dueDate && dueDate < startDate) {
      setError("Due date cannot be before start date");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(
        title.trim(),
        description.trim(),
        startDate,
        dueDate || null,
        priority,
        projectId,
        isAdmin ? assignTo : null
      );
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to create task");
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
          <option value="">Select project</option>
          {projects.map((p) => (
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
      <Input
        label="Due Date (optional)"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        min={startDate || undefined}
        aria-describedby="due-date-hint"
      />
      <p id="due-date-hint" className="field-hint">
        Leave blank if this task has no deadline.
      </p>
      {isDueDateInPast && (
        <p className="field-alert" role="alert">
          <span aria-hidden="true">⚠</span> Warning: the selected due date is in the past.
        </p>
      )}

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
          <select id="assign-to" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} required>
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
          Create
        </Button>
      </div>
    </form>
  );
}
