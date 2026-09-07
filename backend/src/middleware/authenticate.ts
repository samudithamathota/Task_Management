import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyToken } from "../utils/jwt";
import { User } from "../models/User";

/**
 * Verifies the Bearer JWT, confirms the user still exists, and attaches a
 * minimal, trusted { id, role } object to req.user. Downstream code must
 * always use req.user rather than any role/id supplied in the request body.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Authentication token is missing");
    }

    const token = header.split(" ")[1];

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw ApiError.unauthorized("Invalid or expired token");
    }

    const user = await User.findById(payload.id);
    if (!user) {
      throw ApiError.unauthorized("User associated with this token no longer exists");
    }

    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}
