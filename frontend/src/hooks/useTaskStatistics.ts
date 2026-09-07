"use client";

import { useCallback, useEffect, useState } from "react";
import * as taskService from "@/services/task.service";
import { ApiClientError } from "@/lib/apiClient";
import { TaskStatistics, AdminTaskStatistics } from "@/types/statistics";

/** Fetches once on mount — no polling, no dependency that would refire the request. */
export function useTaskStatistics() {
  const [statistics, setStatistics] = useState<TaskStatistics | AdminTaskStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { statistics: fetched } = await taskService.fetchTaskStatistics();
      setStatistics(fetched);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { statistics, isLoading, error, reload: load };
}
