import mongoose, { Schema, Document } from "mongoose";

export interface ILabReport extends Document {
  userId: string;
  reportType: string;
  testDate: string;
  imageUrl?: string;
  keyFindings: Array<{
    parameter: string;
    value: string;
    normalRange: string;
    status: "Normal" | "High" | "Low" | "Critical";
    significance: string;
  }>;
  overallAssessment: {
    status: "Normal" | "Attention Needed" | "Urgent Care Required";
    summary: string;
    riskLevel: "Low" | "Medium" | "High";
  };
  recommendations: {
    immediate: string[];
    lifestyle: string[];
    followUp: string[];
    dietary: string[];
  };
  redFlags: string[];
  confidence: number;
  additionalInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabReportSchema = new Schema<ILabReport>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    reportType: {
      type: String,
      required: true,
    },
    testDate: {
      type: String,
      default: "Unknown",
    },
    imageUrl: {
      type: String,
    },
    keyFindings: [
      {
        parameter: String,
        value: String,
        normalRange: String,
        status: {
          type: String,
          enum: ["Normal", "High", "Low", "Critical"],
        },
        significance: String,
      },
    ],
    overallAssessment: {
      status: {
        type: String,
        enum: ["Normal", "Attention Needed", "Urgent Care Required"],
      },
      summary: String,
      riskLevel: {
        type: String,
        enum: ["Low", "Medium", "High"],
      },
    },
    recommendations: {
      immediate: [String],
      lifestyle: [String],
      followUp: [String],
      dietary: [String],
    },
    redFlags: [String],
    confidence: {
      type: Number,
      default: 80,
    },
    additionalInfo: String,
  },
  {
    timestamps: true,
  }
);

// Index for getting latest reports
LabReportSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.LabReport || mongoose.model<ILabReport>("LabReport", LabReportSchema);
