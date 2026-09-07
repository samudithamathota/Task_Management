import { z } from "zod";
import { objectIdSchema } from "./task.schema";
import { passwordSchema } from "./auth.schema";

export const updateUserSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      name: z.string().trim().min(1, "Name is required").max(100).optional(),
      email: z.string().trim().email("Email must be valid").optional(),
      // Optional — an admin only sets this to reset the user's password;
      // omitting it leaves the current password untouched.
      password: passwordSchema.optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const userIdParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});
