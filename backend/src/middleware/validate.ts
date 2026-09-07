import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

/**
 * Validates req.body/req.params/req.query against a Zod schema shaped like
 * { body?, params?, query? }. On success, the parsed (and defaulted) values
 * are written back onto the request object.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      if (parsed.body) req.body = parsed.body;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of err.issues) {
          const key = issue.path.slice(1).join(".") || issue.path.join(".");
          errors[key] = issue.message;
        }
        next(ApiError.badRequest("Validation failed", errors));
        return;
      }
      next(err);
    }
  };
}
