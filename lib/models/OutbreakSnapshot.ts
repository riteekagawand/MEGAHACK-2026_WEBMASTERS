import mongoose, { Document, Schema } from "mongoose";

type RiskLevel = "low" | "medium" | "high";

interface OutbreakPoint {
  disease: string;
  state: string;
  district: string;
  lat: number;
  lng: number;
  riskScore: number;
  riskLevel: RiskLevel;
  cases?: number;
  deaths?: number;
  lastUpdated: string;
  source: string;
}

export interface IOutbreakSnapshot extends Document {
  outbreaks: OutbreakPoint[];
  source: string;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OutbreakSnapshotSchema = new Schema<IOutbreakSnapshot>(
  {
    outbreaks: { type: [Schema.Types.Mixed], required: true, default: [] },
    source: { type: String, required: true, default: "Gemini AI (NVBDCP/WHO data)" },
    fetchedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

OutbreakSnapshotSchema.index({ fetchedAt: -1 });

export default (mongoose.models.OutbreakSnapshot as mongoose.Model<IOutbreakSnapshot>) ||
  mongoose.model<IOutbreakSnapshot>("OutbreakSnapshot", OutbreakSnapshotSchema);

