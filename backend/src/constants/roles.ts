/**
 * Centralized user role enum. Never compare against raw string literals
 * elsewhere in the codebase — always import this enum.
 */
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export const USER_ROLES = Object.values(UserRole);
