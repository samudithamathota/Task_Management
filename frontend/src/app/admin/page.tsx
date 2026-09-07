"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Header } from "@/components/common/Header";
import { Loading, ErrorMessage, EmptyState } from "@/components/common/StateViews";
import { UserList } from "@/components/admin/UserList";
import { TaskAssignment } from "@/components/admin/TaskAssignment";
import { StatisticsPanel } from "@/components/dashboard/StatisticsPanel";
import { useTasks } from "@/hooks/useTasks";
import { deleteUser, fetchUsers, updateUser } from "@/services/user.service";
import { SafeUser } from "@/types/user";
import { ApiClientError } from "@/lib/apiClient";

type AdminTab = "summary" | "tasks" | "users";

function AdminContent() {
  const { tasks, isLoading: tasksLoading, error: tasksError, reassignTask, removeTask } = useTasks();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>("tasks");

  useEffect(() => {
    fetchUsers()
      .then(({ users: fetched }) => setUsers(fetched.filter((u) => u.role === "USER")))
      .catch((err) => setUsersError(err instanceof ApiClientError ? err.message : "Failed to load users"))
      .finally(() => setUsersLoading(false));
  }, []);

  const isLoading = tasksLoading || usersLoading;

  const handleUpdateUser = async (id: string, updates: { name: string; email: string; password?: string }) => {
    const { user } = await updateUser(id, updates);
    setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
  };

  const handleDeleteUser = async (id: string) => {
    await deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="board-wrapper">
      <div className="board-toolbar">
        <h1>Admin Dashboard</h1>
        <div className="tab-switch">
          <button className={tab === "summary" ? "tab active" : "tab"} onClick={() => setTab("summary")}>
            Project Summary
          </button>
          <button className={tab === "tasks" ? "tab active" : "tab"} onClick={() => setTab("tasks")}>
            Tasks
          </button>
          <button className={tab === "users" ? "tab active" : "tab"} onClick={() => setTab("users")}>
            Users
          </button>
        </div>
      </div>

      {isLoading && <Loading label="Loading admin data..." />}

      {!isLoading && tab === "summary" && <StatisticsPanel />}

      {!isLoading && tab === "tasks" && (
        <>
          {tasksError && <ErrorMessage message={tasksError} />}
          {!tasksError && tasks.length === 0 && <EmptyState message="No tasks found." />}
          {!tasksError && tasks.length > 0 && (
            <TaskAssignment
              tasks={tasks}
              users={users}
              onReassign={reassignTask}
              onDelete={removeTask}
            />
          )}
        </>
      )}

      {!isLoading && tab === "users" && (
        <>
          {usersError && <ErrorMessage message={usersError} />}
          {!usersError && <UserList users={users} onUpdate={handleUpdateUser} onDelete={handleDeleteUser} />}
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly>
      <Header />
      <main className="page-container">
        <AdminContent />
      </main>
    </ProtectedRoute>
  );
}
