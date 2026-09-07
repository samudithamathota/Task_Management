import { Response } from "express";

/**
 * Sends the application's standard success envelope.
 */
export function sendSuccess(res: Response, statusCode: number, message: string, data?: unknown) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
  });
}
