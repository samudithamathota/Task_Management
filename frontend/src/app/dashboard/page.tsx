"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Header } from "@/components/common/Header";
import { StatisticsPanel } from "@/components/dashboard/StatisticsPanel";
import { ProjectSidebar } from "@/components/dashboard/ProjectSidebar";
import { TaskBoard } from "@/components/board/TaskBoard";
import { useProjects } from "@/hooks/useProjects";

function DashboardContent() {
  const { projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = projects.find((entry) => entry.project._id === selectedProjectId)?.project;
  const projectSummaries = projects.map((entry) => entry.project);

  return (
    <>
      <div className="dashboard-layout">
        <ProjectSidebar
          entries={projects}
          isLoading={projectsLoading}
          selectedProjectId={selectedProjectId}
          onSelect={setSelectedProjectId}
        />

        <div className="dashboard-main">
          <TaskBoard
            projectId={selectedProjectId ?? undefined}
            title={selectedProject ? selectedProject.name : "All Tasks"}
            projects={projectSummaries}
            defaultProjectId={selectedProjectId ?? undefined}
          />
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Header />
      <main className="page-container">
        <DashboardContent />
      </main>
    </ProtectedRoute>
  );
}
