import { Schema, model, Document, Types } from "mongoose";
import { TaskStatus } from "../constants/taskStatus";
import { TaskPriority } from "../constants/taskPriority";

export interface ITask extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: Date;
  /** Optional deadline. Nullable — a task may have no due date at all. */
  dueDate: Date | null;
  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId | null;
  /** Every task belongs to exactly one project — see the Project model. */
  project: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },
  },
  { timestamps: true }
);

// Support the common query patterns: filtering by status, assignee, and project.
taskSchema.index({ status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ project: 1 });

export const Task = model<ITask>("Task", taskSchema);
