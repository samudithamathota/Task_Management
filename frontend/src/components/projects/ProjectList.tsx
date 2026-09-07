"use client";

import { useState } from "react";
import Link from "next/link";
import { ProjectListEntry } from "@/types/project";
import { useAuth } from "@/context/AuthContext";
import { ApiClientError } from "@/lib/apiClient";

interface ProjectListProps {
  entries: ProjectListEntry[];
  onEdit: (entry: ProjectListEntry) => void;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectList({ entries, onEdit, onDelete }: ProjectListProps) {
  const { user } = useAuth();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  const isAdmin = user.role === "ADMIN";

  const handleDelete = async (entry: ProjectListEntry) => {
    if (!window.confirm(`Delete project "${entry.project.name}"? This cannot be undone.`)) return;

    setPendingId(entry.project._id);
    setError(null);
    try {
      await onDelete(entry.project._id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to delete project");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      {error && <p className="field-error form-error">{error}</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            {isAdmin && <th>Owner</th>}
            <th>Tasks</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const { project, taskCount } = entry;
            const canManage = isAdmin || project.createdBy.id === user.id;

            return (
              <tr key={project._id}>
                <td>
                  <Link href={`/projects/${project._id}`}>{project.name}</Link>
                </td>
                <td>{project.description || "—"}</td>
                {isAdmin && <td>{project.createdBy.name}</td>}
                <td>{taskCount}</td>
                <td>
                  {canManage && (
                    <>
                    <div className="action-buttons">
                      <button
                        className="link-btn"
                        disabled={pendingId === project._id}
                        onClick={() => onEdit(entry)}
                      >
                        Edit
                      </button>
                      </div>
                      <div className="action-buttons">
                      <button
                        className="link-btn link-danger"
                        disabled={pendingId === project._id}
                        onClick={() => handleDelete(entry)}
                      >
                        Delete
                      </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
