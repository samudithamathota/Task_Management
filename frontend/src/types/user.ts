export type UserRole = "USER" | "ADMIN";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}
