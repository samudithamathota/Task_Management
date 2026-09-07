import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { SafeUser, SALT_ROUNDS } from "./auth.service";
import { UserRole } from "../constants/roles";
import { Task } from "../models/Task";
import { AuthenticatedUser } from "../types/express";
import { ApiError } from "../utils/ApiError";

function toSafeUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}): SafeUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function listUsers(): Promise<SafeUser[]> {
  const users = await User.find().sort({ createdAt: -1 });

  return users.map(toSafeUser);
}

export async function updateUser(
  id: string,
  updates: { name?: string; email?: string; password?: string }
): Promise<SafeUser> {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  if (user.role !== UserRole.USER) {
    throw ApiError.forbidden("Only users with the USER role can be edited here");
  }

  if (updates.email !== undefined) {
    const existing = await User.findOne({ email: updates.email, _id: { $ne: user._id } });
    if (existing) {
      throw ApiError.conflict("An account with this email already exists");
    }
    user.email = updates.email;
  }
  if (updates.name !== undefined) user.name = updates.name;
  // Hashed exactly like a password set at registration — never stored or
  // logged in plain text, and never echoed back in the SafeUser response.
  if (updates.password !== undefined) {
    user.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
  }

  await user.save();
  return toSafeUser(user);
}

export async function deleteUser(currentUser: AuthenticatedUser, id: string): Promise<void> {
  if (currentUser.id === id) {
    throw ApiError.forbidden("You cannot delete your own account");
  }

  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  if (user.role !== UserRole.USER) {
    throw ApiError.forbidden("Only users with the USER role can be deleted here");
  }

  const taskCount = await Task.countDocuments({ $or: [{ createdBy: user._id }, { assignedTo: user._id }] });
  if (taskCount > 0) {
    throw ApiError.badRequest("Delete or reassign this user's tasks before deleting the user");
  }

  await user.deleteOne();
}
