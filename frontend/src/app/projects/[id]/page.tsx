"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Header } from "@/components/common/Header";
import { Loading, ErrorMessage } from "@/components/common/StateViews";
import { TaskBoard } from "@/components/board/TaskBoard";
import { fetchProject } from "@/services/project.service";
import { useProjects } from "@/hooks/useProjects";
import { Project } from "@/types/project";
import { ApiClientError } from "@/lib/apiClient";

interface ProjectPageProps {
  params: { id: string };
}

function ProjectContent({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Backs the "Project" select on create/edit (e.g. moving this task
  // elsewhere) — every project the current user may file a task into.
  const { projects } = useProjects();

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchProject(id)
      .then(({ project: fetched }) => setProject(fetched))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load project"))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <Loading label="Loading project..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!project) return null;

  return (
    <>
      <p>
        <Link href="/projects">&larr; All projects</Link>
      </p>
      {project.description && <p className="field-hint">{project.description}</p>}

      <TaskBoard
        projectId={project._id}
        title={project.name}
        projects={projects.map((entry) => entry.project)}
      />
    </>
  );
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return (
    <ProtectedRoute>
      <Header />
      <main className="page-container">
        <ProjectContent id={params.id} />
      </main>
    </ProtectedRoute>
  );
}
