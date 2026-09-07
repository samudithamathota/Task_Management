"use client";

interface TaskSearchProps {
  value: string;
  onChange: (value: string) => void;
  isSearching: boolean;
}

/**
 * Purely presentational — the search text and the debounced fetch it
 * triggers both live in useTasks; this component just renders the controls.
 */
export function TaskSearch({ value, onChange, isSearching }: TaskSearchProps) {
  return (
    <div className="board-search">
      <label htmlFor="task-search" className="sr-only">
        Search tasks by title or description
      </label>
      <input
        id="task-search"
        type="search"
        className="input"
        placeholder="Search by title or description..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={isSearching ? "task-search-status" : undefined}
      />
      {value && (
        <button
          type="button"
          className="link-btn"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          Clear
        </button>
      )}
      {isSearching && (
        <span id="task-search-status" className="search-status" role="status">
          Searching…
        </span>
      )}
    </div>
  );
}
