"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Header } from "@/components/common/Header";
import { Loading, ErrorMessage, EmptyState } from "@/components/common/StateViews";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { ProjectList } from "@/components/projects/ProjectList";
import { CreateProjectForm } from "@/components/projects/CreateProjectForm";
import { EditProjectForm } from "@/components/projects/EditProjectForm";
import { useProjects } from "@/hooks/useProjects";
import { ProjectListEntry } from "@/types/project";

function ProjectsContent() {
  const { projects, isLoading, error, addProject, editProject, removeProject } = useProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProjectListEntry | null>(null);

  return (
    <div className="board-wrapper">
      <div className="board-toolbar">
        <h1>Projects</h1>
        <Button onClick={() => setIsCreateOpen(true)}>+ New Project</Button>
      </div>

      {isLoading && <Loading label="Loading projects..." />}
      {!isLoading && error && <ErrorMessage message={error} />}
      {!isLoading && !error && projects.length === 0 && (
        <EmptyState message="No projects yet. Create one to start adding tasks." />
      )}
      {!isLoading && !error && projects.length > 0 && (
        <ProjectList entries={projects} onEdit={setEditingEntry} onDelete={removeProject} />
      )}

      {isCreateOpen && (
        <Modal title="New Project" onClose={() => setIsCreateOpen(false)}>
          <CreateProjectForm
            onSubmit={async (name, description) => {
              await addProject(name, description);
              setIsCreateOpen(false);
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </Modal>
      )}

      {editingEntry && (
        <Modal title="Edit Project" onClose={() => setEditingEntry(null)}>
          <EditProjectForm
            project={editingEntry.project}
            onSubmit={async (updates) => {
              await editProject(editingEntry.project._id, updates);
              setEditingEntry(null);
            }}
            onCancel={() => setEditingEntry(null)}
          />
        </Modal>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <Header />
      <main className="page-container">
        <ProjectsContent />
      </main>
    </ProtectedRoute>
  );
}
