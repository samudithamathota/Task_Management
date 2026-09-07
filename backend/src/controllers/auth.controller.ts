import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as authService from "../services/auth.service";
import { ApiError } from "../utils/ApiError";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.registerUser(req.body);
  sendSuccess(res, 201, "Registration successful", { user, token });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.loginUser(req.body);
  sendSuccess(res, 200, "Login successful", { user, token });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.getCurrentUser(req.user.id);
  sendSuccess(res, 200, "Current user retrieved", { user });
});
