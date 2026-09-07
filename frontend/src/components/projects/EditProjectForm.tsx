"use client";

import { FormEvent, useState } from "react";
import { Project } from "@/types/project";
import { Input, Textarea } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { ApiClientError } from "@/lib/apiClient";

interface EditProjectFormProps {
  project: Project;
  onSubmit: (updates: { name?: string; description?: string }) => Promise<void>;
  onCancel: () => void;
}

export function EditProjectForm({ project, onSubmit, onCancel }: EditProjectFormProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={150} />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={2000}
        rows={4}
      />

      {error && <p className="field-error form-error">{error}</p>}
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
