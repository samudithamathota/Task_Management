import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

/**
 * Single place responsible for turning any thrown error into the app's
 * consistent JSON error shape. Never leaks stack traces in production.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  let statusCode = 500;
  let message = "Internal server error";
  let errors: Record<string, string> | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err && typeof err === "object" && "name" in err) {
    // Handle a few common Mongoose error shapes without leaking internals.
    const mongooseErr = err as { name: string; code?: number; message: string };

    if (mongooseErr.name === "ValidationError") {
      statusCode = 400;
      message = "Validation failed";
    } else if (mongooseErr.code === 11000) {
      statusCode = 409;
      message = "A record with these details already exists";
    } else if (mongooseErr.name === "CastError") {
      statusCode = 400;
      message = "Invalid identifier supplied";
    }
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}
