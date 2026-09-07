import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { User } from "../models/User";
import { UserRole } from "../constants/roles";

const SALT_ROUNDS = 10;

/**
 * Creates (or verifies the existence of) a single administrator account.
 * This is the ONLY supported way to create an ADMIN user — the public
 * registration endpoint always forces the USER role.
 *
 * Usage: npm run seed:admin
 */
async function seedAdmin() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error("ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment");
  }

  await connectDatabase();

  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Admin seed skipped: a user with email "${email}" already exists.`);
    await disconnectDatabase();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: UserRole.ADMIN,
  });

  console.log(`Administrator account created successfully for "${email}".`);

  await disconnectDatabase();
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Admin seed failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
