import { NextFunction, Request, Response } from "express";
import { UserRole } from "../constants/roles";
import { ApiError } from "../utils/ApiError";

/**
 * Restricts a route to one or more roles. Must run after `authenticate`.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden("You do not have permission to perform this action"));
      return;
    }

    next();
  };
}
