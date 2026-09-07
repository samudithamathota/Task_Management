"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Task } from "@/types/task";
import { TaskStatusType } from "@/constants/taskStatus";
import { TaskPriorityType } from "@/constants/taskPriority";
import * as taskService from "@/services/task.service";
import { ApiClientError } from "@/lib/apiClient";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * @param projectId When provided, scopes every fetch (initial load and every
 * search) to just that project's tasks — used by a project's own board page.
 * Omit it for the aggregate "all my tasks across every project" board.
 */
export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  // isLoading covers the very first fetch (full-page loading state);
  // isSearching covers every subsequent fetch triggered by `search`
  // changing, so typing doesn't blank out the whole board each time.
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const isFirstLoad = useRef(true);

  const fetchAndSetTasks = useCallback(
    async (searchTerm: string) => {
      setError(null);
      try {
        const { tasks: fetchedTasks } = await taskService.fetchTasks(searchTerm, projectId);
        setTasks(fetchedTasks);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Failed to load tasks");
      }
    },
    [projectId]
  );

  // Runs the initial load immediately (no debounce — nothing was typed yet);
  // every later run is a `search` change, which is debounced so a fetch
  // isn't fired on every keystroke.
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      setIsLoading(true);
      fetchAndSetTasks(search).finally(() => setIsLoading(false));
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      fetchAndSetTasks(search).finally(() => setIsSearching(false));
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [search, fetchAndSetTasks]);

  const loadTasks = useCallback(() => fetchAndSetTasks(search), [fetchAndSetTasks, search]);

  const addTask = useCallback(
    async (
      title: string,
      description: string,
      startDate: string,
      dueDate: string | null,
      priority: TaskPriorityType,
      taskProjectId: string,
      assignedTo?: string | null
    ) => {
      const { task } = await taskService.createTask(
        title,
        description,
        startDate,
        dueDate,
        priority,
        taskProjectId,
        assignedTo
      );
      setTasks((prev) => [task, ...prev]);
      return task;
    },
    []
  );

  const editTask = useCallback(
    async (
      id: string,
      updates: {
        title?: string;
        description?: string;
        startDate?: string;
        dueDate?: string | null;
        priority?: TaskPriorityType;
        projectId?: string;
      }
    ) => {
      const { task } = await taskService.updateTask(id, updates);
      setTasks((prev) => prev.map((t) => (t._id === id ? task : t)));
    },
    []
  );

  const removeTask = useCallback(async (id: string) => {
    await taskService.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  }, []);

  const reassignTask = useCallback(async (id: string, userId: string | null) => {
    const { task } = await taskService.assignTask(id, userId);
    setTasks((prev) => prev.map((t) => (t._id === id ? task : t)));
  }, []);

  /**
   * Optimistically moves a task to a new status so the drag-and-drop feels
   * instant, then confirms with the backend. On failure, the previous
   * status is restored and the caller is responsible for surfacing the error.
   */
  const changeStatus = useCallback(async (id: string, status: TaskStatusType) => {
    let previousStatus: TaskStatusType | undefined;

    setTasks((prev) =>
      prev.map((t) => {
        if (t._id === id) {
          previousStatus = t.status;
          return { ...t, status };
        }
        return t;
      })
    );

    try {
      const { task } = await taskService.updateTaskStatus(id, status);
      setTasks((prev) => prev.map((t) => (t._id === id ? task : t)));
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t._id === id && previousStatus ? { ...t, status: previousStatus } : t))
      );
      throw err;
    }
  }, []);

  return {
    tasks,
    isLoading,
    isSearching,
    error,
    search,
    setSearch,
    reload: loadTasks,
    addTask,
    editTask,
    removeTask,
    reassignTask,
    changeStatus,
  };
}
