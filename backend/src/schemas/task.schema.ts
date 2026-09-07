import { z } from "zod";
import { TaskStatus } from "../constants/taskStatus";
import { TaskPriority } from "../constants/taskPriority";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = z.string().regex(objectIdRegex, "Invalid ID format");

function isValidDateString(value: string): boolean {
  return !isNaN(Date.parse(value));
}

/** A required, non-nullable date string field with a field-specific error message. */
function dateField(label: string) {
  return z.string().refine(isValidDateString, { message: `${label} must be a valid date` });
}

/**
 * dueDate is optional AND nullable, so three shapes reach the service:
 * omitted (key absent — leave untouched on update / no due date on create),
 * `null` (explicitly clear it), or a valid date string (set it).
 */
const dueDateField = z.union([dateField("Due date"), z.null()]).optional();

export const createTaskSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(1, "Title is required").max(150),
      description: z.string().trim().max(2000).optional().default(""),
      startDate: dateField("Start date"),
      dueDate: dueDateField,
      priority: z.nativeEnum(TaskPriority, {
        errorMap: () => ({ message: "Priority must be one of LOW, MEDIUM, HIGH, URGENT" }),
      }).optional(),
      assignedTo: objectIdSchema.optional(),
      projectId: objectIdSchema,
    })
    .strict()
    .refine((data) => !data.dueDate || new Date(data.dueDate) >= new Date(data.startDate), {
      message: "Due date cannot be before start date",
      path: ["dueDate"],
    }),
});

export const updateTaskSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  // createdBy/assignedTo/status are intentionally excluded — they are
  // managed through dedicated endpoints/business logic, never a raw PATCH.
  // priority, dueDate and projectId, like title/description, are plain
  // editable attributes and need no dedicated endpoint — moving a task to a
  // different project is just another field update, authorized in the
  // service against the target project's ownership.
  body: z
    .object({
      title: z.string().trim().min(1).max(150).optional(),
      description: z.string().trim().max(2000).optional(),
      startDate: dateField("Start date").optional(),
      dueDate: dueDateField,
      priority: z.nativeEnum(TaskPriority, {
        errorMap: () => ({ message: "Priority must be one of LOW, MEDIUM, HIGH, URGENT" }),
      }).optional(),
      projectId: objectIdSchema.optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    })
    .refine(
      (data) => {
        // Nothing to cross-check when dueDate is absent or explicitly
        // cleared, or when this request doesn't also carry a new startDate
        // to compare against — the service re-validates against the
        // persisted, merged state in that case.
        if (!data.dueDate || !data.startDate) return true;
        return new Date(data.dueDate) >= new Date(data.startDate);
      },
      {
        message: "Due date cannot be before start date",
        path: ["dueDate"],
      }
    ),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      status: z.nativeEnum(TaskStatus, {
        errorMap: () => ({ message: "Status must be one of TODO, DOING, DONE" }),
      }),
    })
    .strict(),
});

export const assignTaskSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      userId: z.union([objectIdSchema, z.null()]).optional(),
    })
    .strict(),
});

export const taskIdParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const getTasksSchema = z.object({
  query: z.object({
    search: z.string().trim().max(200, "Search query is too long").optional(),
    projectId: objectIdSchema.optional(),
  }),
});
