import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "../constants/roles";

export interface JwtPayload {
  id: string;
  role: UserRole;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail fast at startup time rather than silently signing with "undefined".
    throw new Error("JWT_SECRET is not set in the environment");
  }
  return secret;
}

export function signToken(payload: JwtPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"];
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}
