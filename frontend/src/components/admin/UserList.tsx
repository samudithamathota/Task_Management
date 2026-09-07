import { FormEvent, useState } from "react";
import { SafeUser } from "@/types/user";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ApiClientError } from "@/lib/apiClient";

interface UserListProps {
  users: SafeUser[];
  onUpdate: (id: string, updates: { name: string; email: string; password?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const MIN_PASSWORD_LENGTH = 8;

export function UserList({ users, onUpdate, onDelete }: UserListProps) {
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Left blank = keep the user's current password; only sent when set.
  const [password, setPassword] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (users.length === 0) {
    return <p className="task-column-empty">No users found.</p>;
  }

  const startEdit = (user: SafeUser) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;

    if (password && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    setPendingId(editingUser.id);
    setError(null);
    try {
      await onUpdate(editingUser.id, {
        name: name.trim(),
        email: email.trim(),
        ...(password ? { password } : {}),
      });
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to update user");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (user: SafeUser) => {
    if (!window.confirm(`Delete user "${user.name}"?`)) return;

    setPendingId(user.id);
    setError(null);
    try {
      await onDelete(user.id);
      if (editingUser?.id === user.id) setEditingUser(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to delete user");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      {editingUser && (
        <form className="admin-user-form" onSubmit={handleSubmit}>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="New Password (optional)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            aria-describedby="edit-user-password-hint"
          />
          <p id="edit-user-password-hint" className="field-hint">
            Leave blank to keep the current password.
          </p>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={pendingId === editingUser.id}>
              Save User
            </Button>
          </div>
        </form>
      )}

      {error && <p className="field-error form-error">{error}</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <span className="role-badge">{u.role}</span>
              </td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                <div className="action-buttons">
                <button className="link-btn" disabled={pendingId === u.id} onClick={() => startEdit(u)}>
                  Edit
                </button>
                </div>
                <div className="action-buttons">
                <button className="link-btn link-danger" disabled={pendingId === u.id} onClick={() => handleDelete(u)}>
                  Delete
                </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
