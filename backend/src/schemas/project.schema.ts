import { z } from "zod";
import { objectIdSchema } from "./task.schema";

export const createProjectSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1, "Name is required").max(150),
      description: z.string().trim().max(2000).optional().default(""),
    })
    .strict(),
});

export const updateProjectSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      name: z.string().trim().min(1, "Name is required").max(150).optional(),
      description: z.string().trim().max(2000).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const projectIdParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});
