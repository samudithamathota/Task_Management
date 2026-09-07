import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import * as projectService from "../services/project.service";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { name, description } = req.body;
  const project = await projectService.createProject(user, name, description);
  sendSuccess(res, 201, "Project created successfully", { project });
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const projects = await projectService.getProjects(user);
  sendSuccess(res, 200, "Projects retrieved successfully", { projects });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const project = await projectService.getProjectById(user, req.params.id);
  sendSuccess(res, 200, "Project retrieved successfully", { project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const project = await projectService.updateProject(user, req.params.id, req.body);
  sendSuccess(res, 200, "Project updated successfully", { project });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  await projectService.deleteProject(user, req.params.id);
  sendSuccess(res, 200, "Project deleted successfully");
});
