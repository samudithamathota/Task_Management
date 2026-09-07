import { apiRequest } from "@/lib/apiClient";
import { SafeUser } from "@/types/user";

export interface AuthPayload {
  user: SafeUser;
  token: string;
}

export function register(name: string, email: string, password: string): Promise<AuthPayload> {
  return apiRequest<AuthPayload>("/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
}

export function login(email: string, password: string): Promise<AuthPayload> {
  return apiRequest<AuthPayload>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function getMe(): Promise<{ user: SafeUser }> {
  return apiRequest<{ user: SafeUser }>("/auth/me");
}
