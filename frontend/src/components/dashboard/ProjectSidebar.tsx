"use client";

import Link from "next/link";
import { ProjectListEntry } from "@/types/project";

interface ProjectSidebarProps {
  entries: ProjectListEntry[];
  isLoading: boolean;
  /** `null` means "All Tasks" (no project filter). */
  selectedProjectId: string | null;
  onSelect: (projectId: string | null) => void;
}

/**
 * A normal user's entries here are only their own projects; an admin's are
 * every project system-wide — the difference is already baked into what
 * GET /projects returned, not decided here.
 */
export function ProjectSidebar({ entries, isLoading, selectedProjectId, onSelect }: ProjectSidebarProps) {
  return (
    <nav className="project-sidebar" aria-label="Projects">
      <h2 className="project-sidebar-title">Projects</h2>

      <ul className="project-sidebar-list">
        <li>
          <button
            type="button"
            className={`project-sidebar-item ${selectedProjectId === null ? "active" : ""}`}
            onClick={() => onSelect(null)}
          >
            All Tasks
          </button>
        </li>

        {isLoading && <li className="project-sidebar-empty">Loading…</li>}
        {!isLoading && entries.length === 0 && <li className="project-sidebar-empty">No projects yet.</li>}

        {entries.map(({ project, taskCount }) => (
          <li key={project._id}>
            <button
              type="button"
              className={`project-sidebar-item ${selectedProjectId === project._id ? "active" : ""}`}
              onClick={() => onSelect(project._id)}
            >
              <span className="project-sidebar-item-name">{project.name}</span>
              <span className="project-sidebar-count">{taskCount}</span>
            </button>
          </li>
        ))}
      </ul>

      <Link href="/projects" className="project-sidebar-manage">
        + Manage projects
      </Link>
    </nav>
  );
}
