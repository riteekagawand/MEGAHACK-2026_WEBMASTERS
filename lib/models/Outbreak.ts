// lib/models/Outbreak.ts
import mongoose, { Schema, Document } from "mongoose";

export type RiskLevel = "low" | "medium" | "high";

export interface IOutbreak extends Document {
  disease: string;
  state: string;
  district: string;
  lat: number;
  lng: number;
  riskScore: number;      // 0–100
  riskLevel: RiskLevel;   // derived from score
  lastUpdated: Date;
}

const OutbreakSchema = new Schema<IOutbreak>(
  {
    disease: { type: String, required: true, index: true },
    state: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
      index: true,
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

OutbreakSchema.index({ state: 1, district: 1, disease: 1 });

export default mongoose.models.Outbreak ||
  mongoose.model<IOutbreak>("Outbreak", OutbreakSchema);