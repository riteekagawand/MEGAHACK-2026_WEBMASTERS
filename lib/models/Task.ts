import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["fitness", "nutrition", "wellness", "medical"],
      required: true,
    },
    coins: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    icon: {
      type: String,
      default: "Activity",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

const userTaskCompletionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    streak: {
      type: Number,
      default: 1,
    },
    coinsEarned: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate completions on the same day
userTaskCompletionSchema.index(
  {
    userId: 1,
    taskId: 1,
    completedAt: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      completedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  }
);

export const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
export const UserTaskCompletion =
  mongoose.models.UserTaskCompletion ||
  mongoose.model("UserTaskCompletion", userTaskCompletionSchema);
