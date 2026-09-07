import { apiRequest } from "@/lib/apiClient";
import { SafeUser } from "@/types/user";

export function fetchUsers(): Promise<{ users: SafeUser[] }> {
  return apiRequest<{ users: SafeUser[] }>("/users");
}

export function updateUser(
  id: string,
  updates: { name?: string; email?: string; password?: string }
): Promise<{ user: SafeUser }> {
  return apiRequest<{ user: SafeUser }>(`/users/${id}`, {
    method: "PATCH",
    body: updates,
  });
}

export function deleteUser(id: string): Promise<void> {
  return apiRequest<void>(`/users/${id}`, { method: "DELETE" });
}
