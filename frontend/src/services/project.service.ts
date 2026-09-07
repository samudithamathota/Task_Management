import { apiRequest } from "@/lib/apiClient";
import { Project, ProjectListEntry } from "@/types/project";

/** Admin gets every project system-wide; a normal user gets only their own. */
export function fetchProjects(): Promise<{ projects: ProjectListEntry[] }> {
  return apiRequest<{ projects: ProjectListEntry[] }>("/projects");
}

export function fetchProject(id: string): Promise<{ project: Project }> {
  return apiRequest<{ project: Project }>(`/projects/${id}`);
}

export function createProject(name: string, description: string): Promise<{ project: Project }> {
  return apiRequest<{ project: Project }>("/projects", {
    method: "POST",
    body: { name, description },
  });
}

export function updateProject(
  id: string,
  updates: { name?: string; description?: string }
): Promise<{ project: Project }> {
  return apiRequest<{ project: Project }>(`/projects/${id}`, {
    method: "PATCH",
    body: updates,
  });
}

export function deleteProject(id: string): Promise<void> {
  return apiRequest<void>(`/projects/${id}`, { method: "DELETE" });
}
