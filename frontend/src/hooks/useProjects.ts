"use client";

import { useCallback, useEffect, useState } from "react";
import { ProjectListEntry } from "@/types/project";
import * as projectService from "@/services/project.service";
import { ApiClientError } from "@/lib/apiClient";

export function useProjects() {
  const [projects, setProjects] = useState<ProjectListEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { projects: fetched } = await projectService.fetchProjects();
      setProjects(fetched);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const addProject = useCallback(async (name: string, description: string) => {
    const { project } = await projectService.createProject(name, description);
    setProjects((prev) => [{ project, taskCount: 0 }, ...prev]);
    return project;
  }, []);

  const editProject = useCallback(
    async (id: string, updates: { name?: string; description?: string }) => {
      const { project } = await projectService.updateProject(id, updates);
      setProjects((prev) => prev.map((entry) => (entry.project._id === id ? { ...entry, project } : entry)));
    },
    []
  );

  const removeProject = useCallback(async (id: string) => {
    await projectService.deleteProject(id);
    setProjects((prev) => prev.filter((entry) => entry.project._id !== id));
  }, []);

  return {
    projects,
    isLoading,
    error,
    reload: loadProjects,
    addProject,
    editProject,
    removeProject,
  };
}
