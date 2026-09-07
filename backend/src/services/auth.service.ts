import bcrypt from "bcryptjs";
import { User, IUser } from "../models/User";
import { UserRole } from "../constants/roles";
import { ApiError } from "../utils/ApiError";
import { signToken } from "../utils/jwt";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";

// Exported so any other place that must hash a password (e.g. an admin
// setting one on a user) uses the exact same cost factor.
export const SALT_ROUNDS = 10;

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

function toSafeUser(user: IUser): SafeUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function registerUser(input: RegisterInput): Promise<{ user: SafeUser; token: string }> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Role is always forced to USER here — administrators can only be
  // created via the seed script, never through this public endpoint.
  const user = await User.create({
    name: input.name,
    email: input.email,
    password: hashedPassword,
    role: UserRole.USER,
  });

  const token = signToken({ id: user._id.toString(), role: user.role });

  return { user: toSafeUser(user), token };
}

export async function loginUser(input: LoginInput): Promise<{ user: SafeUser; token: string }> {
  const user = await User.findOne({ email: input.email }).select("+password");

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(input.password, user.password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = signToken({ id: user._id.toString(), role: user.role });

  return { user: toSafeUser(user), token };
}

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return toSafeUser(user);
}
