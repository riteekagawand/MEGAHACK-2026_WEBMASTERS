import mongoose, { Schema, Document } from "mongoose";

export interface IPatient extends Document {
  userId: string;
  role: "clinician" | "patient";
  hasCompletedInfo: boolean;
  personalInfo: {
    name?: string;
    age?: number;
    gender?: string;
    location?: string;
    phone?: string;
    email?: string;
    height?: number; // in cm
    weight?: number; // in kg
    bloodGroup?: string;
    occupation?: string;
  };
  medicalHistory: {
    conditions: string[]; // checkbox conditions like diabetes, hypertension, asthma
    medications: string[];
    allergies: string[];
    surgeries: string[];
    familyHistory: string[];
  };
  // Leaderboard fields
  coins?: number;
  level?: number;
  streak?: number;
  completedTasks?: number;
  avatar?: string;
  lastTaskCompletionDate?: Date;
  totalEarned?: number;
  bestStreak?: number;
  rankThisWeek?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["clinician", "patient"],
      required: true,
    },
    hasCompletedInfo: {
      type: Boolean,
      default: false,
    },
    personalInfo: {
      name: String,
      age: Number,
      gender: {
        type: String,
        enum: ["male", "female", "other"],
      },
      location: String,
      phone: String,
      email: String,
      height: Number, // in cm
      weight: Number, // in kg
      bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      },
      occupation: String,
    },
    medicalHistory: {
      conditions: [String], // diabetes, hypertension, asthma, etc.
      medications: [String],
      allergies: [String],
      surgeries: [String],
      familyHistory: [String],
    },
    // Leaderboard fields
    coins: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    streak: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    avatar: {
      type: String,
      default: "Users",
    },
    lastTaskCompletionDate: {
      type: Date,
      default: null,
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
    },
    rankThisWeek: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to calculate level based on total coins earned
PatientSchema.virtual("calculatedLevel").get(function () {
  return Math.floor((this.totalEarned || 0) / 500) + 1;
});

// Pre-save middleware to update level
PatientSchema.pre("save", function () {
  this.level = Math.floor((this.totalEarned || 0) / 500) + 1;
  if ((this.streak || 0) > (this.bestStreak || 0)) {
    this.bestStreak = this.streak;
  }
});

export default mongoose.models.Patient ||
  mongoose.model<IPatient>("Patient", PatientSchema);
