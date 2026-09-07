import { ApiResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = "task_app_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * A normalized error thrown by the API client. Components can rely on
 * `.message` always being safe to display to the user.
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly errors?: Record<string, string>;

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiClientError(0, "Unable to reach the server. Please check your connection.");
  }

  let json: ApiResponse<T> | undefined;
  try {
    json = await response.json();
  } catch {
    // Non-JSON response (e.g. a gateway error page)
  }

  if (!response.ok || !json || !json.success) {
    const message = json && "message" in json ? json.message : `Request failed with status ${response.status}`;
    const errors = json && "errors" in json ? json.errors : undefined;
    throw new ApiClientError(response.status, message, errors);
  }

  return (json.data as T) ?? (undefined as T);
}
