import { Schema, model, Document, Types } from "mongoose";

export interface IProject extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Support the common query pattern: "my projects".
projectSchema.index({ createdBy: 1 });

export const Project = model<IProject>("Project", projectSchema);
