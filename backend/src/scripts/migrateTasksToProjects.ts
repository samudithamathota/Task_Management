import dotenv from "dotenv";
dotenv.config();

import { connectDatabase, disconnectDatabase } from "../config/database";
import { Task } from "../models/Task";
import { Project } from "../models/Project";

const LEGACY_PROJECT_NAME = "Legacy Tasks";

/**
 * One-time backfill for the "every task must belong to a project" rule.
 * Tasks created before the Project feature existed have no `project`
 * field at all. For each user who owns such tasks, this creates (or
 * reuses) a single "Legacy Tasks" project for them and files those tasks
 * into it, so the now-required field is satisfied for every existing task.
 *
 * Run this BEFORE deploying the schema/validation change that makes
 * Task.project required — otherwise saving an old, un-migrated task would
 * fail validation.
 *
 * Usage: npm run migrate:tasks-to-projects
 */
async function migrate() {
  await connectDatabase();

  // Bypasses Mongoose casting/defaults entirely, so it sees the true
  // pre-migration shape of old documents (no `project` key at all), unlike
  // a find() which would silently apply schema defaults on read.
  const owners = await Task.aggregate<{ _id: string }>([
    { $match: { project: { $exists: false } } },
    { $group: { _id: "$createdBy" } },
  ]);

  if (owners.length === 0) {
    console.log("No unmigrated tasks found — nothing to do.");
    await disconnectDatabase();
    return;
  }

  for (const { _id: userId } of owners) {
    let project = await Project.findOne({ createdBy: userId, name: LEGACY_PROJECT_NAME });
    if (!project) {
      project = await Project.create({
        name: LEGACY_PROJECT_NAME,
        description: "Tasks created before projects existed.",
        createdBy: userId,
      });
      console.log(`Created "${LEGACY_PROJECT_NAME}" project for user ${userId}.`);
    }

    const { modifiedCount } = await Task.updateMany(
      { createdBy: userId, project: { $exists: false } },
      { $set: { project: project._id } }
    );
    console.log(`Filed ${modifiedCount} task(s) for user ${userId} into "${LEGACY_PROJECT_NAME}".`);
  }

  console.log("Migration complete.");
  await disconnectDatabase();
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
