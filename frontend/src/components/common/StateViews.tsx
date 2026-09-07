export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="state-box" role="status">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="state-box state-error" role="alert">
      {message}
    </div>
  );
}

export function EmptyState({ message = "No tasks found." }: { message?: string }) {
  return <div className="state-box state-empty">{message}</div>;
}
