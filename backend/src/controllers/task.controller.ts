import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import * as taskService from "../services/task.service";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { title, description, startDate, dueDate, priority, assignedTo, projectId } = req.body;
  const task = await taskService.createTask(
    user,
    title,
    description,
    startDate,
    dueDate,
    projectId,
    priority,
    assignedTo
  );
  sendSuccess(res, 201, "Task created successfully", { task });
});

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  // `validate` checks the shape/length of these query params but (like
  // Express's own req.query) can't rewrite them back onto the request, so
  // we still narrow them defensively here — this is also what stops
  // `?search[$ne]=` or a repeated `?search=&search=` from ever reaching the
  // query as anything but a plain string.
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
  const tasks = await taskService.getTasks(user, search, projectId);
  sendSuccess(res, 200, "Tasks retrieved successfully", { tasks });
});

export const getTaskStatistics = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const statistics = await taskService.getTaskStatistics(user);
  sendSuccess(res, 200, "Task statistics retrieved successfully", { statistics });
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const task = await taskService.getTaskById(user, req.params.id);
  sendSuccess(res, 200, "Task retrieved successfully", { task });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const task = await taskService.updateTask(user, req.params.id, req.body);
  sendSuccess(res, 200, "Task updated successfully", { task });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  await taskService.deleteTask(user, req.params.id);
  sendSuccess(res, 200, "Task deleted successfully");
});

export const updateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const task = await taskService.updateTaskStatus(user, req.params.id, req.body.status);
  sendSuccess(res, 200, "Task status updated successfully", { task });
});

export const assignTask = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const task = await taskService.assignTask(user, req.params.id, req.body.userId ?? null);
  sendSuccess(res, 200, "Task assignment updated successfully", { task });
});
