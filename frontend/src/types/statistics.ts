import { TaskStatusType } from "@/constants/taskStatus";
import { TaskPriorityType } from "@/constants/taskPriority";

export interface TaskStatistics {
  totalTasks: number;
  byStatus: Record<TaskStatusType, number>;
  overdueTasks: number;
}

/** What the API additionally returns when the caller is an ADMIN. */
export interface AdminTaskStatistics extends TaskStatistics {
  totalUsers: number;
  unassignedTasks: number;
  byPriority: Record<TaskPriorityType, number>;
}

/** Narrows to the admin shape based on a field only the admin response carries. */
export function isAdminStatistics(
  statistics: TaskStatistics | AdminTaskStatistics
): statistics is AdminTaskStatistics {
  return "totalUsers" in statistics;
}
