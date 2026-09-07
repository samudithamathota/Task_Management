import { z } from "zod";

// Shared so any other schema needing a password field (e.g. an admin
// setting one on a user) enforces the exact same rule, not a copy of it.
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128);

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
      email: z.string().trim().email("A valid email is required").toLowerCase(),
      password: passwordSchema,
    })
    .strict(),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().trim().email("A valid email is required").toLowerCase(),
      password: z.string().min(1, "Password is required"),
    })
    .strict(),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
