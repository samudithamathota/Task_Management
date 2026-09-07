import { apiRequest } from "@/lib/apiClient";
import { Task } from "@/types/task";
import { TaskStatusType } from "@/constants/taskStatus";
import { TaskPriorityType } from "@/constants/taskPriority";
import { TaskStatistics, AdminTaskStatistics } from "@/types/statistics";

export function fetchTasks(search?: string, projectId?: string): Promise<{ tasks: Task[] }> {
  const params = new URLSearchParams();
  const trimmedSearch = search?.trim();
  if (trimmedSearch) params.set("search", trimmedSearch);
  if (projectId) params.set("projectId", projectId);

  const query = params.toString();
  return apiRequest<{ tasks: Task[] }>(`/tasks${query ? `?${query}` : ""}`);
}

/** The API shapes the response by the caller's role — see isAdminStatistics. */
export function fetchTaskStatistics(): Promise<{ statistics: TaskStatistics | AdminTaskStatistics }> {
  return apiRequest<{ statistics: TaskStatistics | AdminTaskStatistics }>("/tasks/statistics");
}

export function createTask(
  title: string,
  description: string,
  startDate: string,
  dueDate: string | null,
  priority: TaskPriorityType,
  projectId: string,
  assignedTo?: string | null
): Promise<{ task: Task }> {
  return apiRequest<{ task: Task }>("/tasks", {
    method: "POST",
    body: { title, description, startDate, dueDate, priority, projectId, ...(assignedTo ? { assignedTo } : {}) },
  });
}

export function updateTask(
  id: string,
  updates: {
    title?: string;
    description?: string;
    startDate?: string;
    dueDate?: string | null;
    priority?: TaskPriorityType;
    projectId?: string;
  }
): Promise<{ task: Task }> {
  return apiRequest<{ task: Task }>(`/tasks/${id}`, {
    method: "PATCH",
    body: updates,
  });
}

export function deleteTask(id: string): Promise<void> {
  return apiRequest<void>(`/tasks/${id}`, { method: "DELETE" });
}

export function updateTaskStatus(id: string, status: TaskStatusType): Promise<{ task: Task }> {
  return apiRequest<{ task: Task }>(`/tasks/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export function assignTask(id: string, userId: string | null): Promise<{ task: Task }> {
  return apiRequest<{ task: Task }>(`/tasks/${id}/assign`, {
    method: "PATCH",
    body: { userId },
  });
}
