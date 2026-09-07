import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import * as userService from "../services/user.service";

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.listUsers();
  sendSuccess(res, 200, "Users retrieved successfully", { users });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.params.id, req.body);
  sendSuccess(res, 200, "User updated successfully", { user });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await userService.deleteUser(req.user, req.params.id);
  sendSuccess(res, 200, "User deleted successfully");
});
