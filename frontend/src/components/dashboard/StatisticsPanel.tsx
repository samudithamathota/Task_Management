"use client";

import { useTaskStatistics } from "@/hooks/useTaskStatistics";
import { StatCard } from "@/components/common/StatCard";
import { Loading, ErrorMessage } from "@/components/common/StateViews";
import { TASK_COLUMNS } from "@/constants/taskStatus";
import { TASK_PRIORITIES } from "@/constants/taskPriority";
import { isAdminStatistics } from "@/types/statistics";

/**
 * Renders whatever shape GET /tasks/statistics returned for the current
 * user — the API itself decides USER vs ADMIN scope and fields, so this
 * component never branches on role directly, only on the response shape.
 */
export function StatisticsPanel() {
  const { statistics, isLoading, error } = useTaskStatistics();

  if (isLoading) return <Loading label="Loading statistics..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!statistics) return null;

  const isAdmin = isAdminStatistics(statistics);

  return (
    <div className="statistics-panel">
      {isAdmin && (
        <section className="stats-section">
          <h2 className="stats-section-title">By Users</h2>
          <div className="stats-grid">
            <StatCard label="Total Users" value={statistics.totalUsers} />
          </div>
        </section>
      )}

      <section className="stats-section">
        <h2 className="stats-section-title">By Status</h2>
        <div className="stats-grid">
          <StatCard label="Total Tasks" value={statistics.totalTasks} />
          {TASK_COLUMNS.map((col) => (
            <StatCard key={col.status} label={col.label} value={statistics.byStatus[col.status] ?? 0} />
          ))}
          {isAdmin && <StatCard label="Unassigned" value={statistics.unassignedTasks} />}
        </div>
      </section>

      <section className="stats-section">
        <h2 className="stats-section-title">Overdue</h2>
        <div className="stats-grid">
          <StatCard label="Overdue" value={statistics.overdueTasks} />
        </div>
      </section>

      {isAdmin && (
        <section className="stats-section">
          <h2 className="stats-section-title">By Priority</h2>
          <div className="stats-grid">
            {TASK_PRIORITIES.map((p) => (
              <StatCard key={p.value} label={`${p.label} Priority`} value={statistics.byPriority[p.value] ?? 0} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
