import mongoose from "mongoose";

const coinTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taskId: {
      type: String,
      required: true,
    },
    taskTitle: {
      type: String,
      required: true,
    },
    taskCategory: {
      type: String,
      enum: ["fitness", "nutrition", "wellness", "medical"],
      required: true,
    },
    coinsEarned: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    streakAtCompletion: {
      type: Number,
      default: 1,
    },
    bonusCoins: {
      type: Number,
      default: 0,
    },
    totalCoinsAwarded: {
      type: Number,
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
coinTransactionSchema.index({ userId: 1, completedAt: -1 });
coinTransactionSchema.index({ completedAt: -1 });

export const CoinTransaction =
  mongoose.models.CoinTransaction ||
  mongoose.model("CoinTransaction", coinTransactionSchema);
