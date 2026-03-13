import mongoose, { Schema, Document } from 'mongoose';

export interface IDiagnosisHistory extends Document {
  patientName: string;
  patientAge: string;
  patientGender: string;
  medicalHistory: string;
  symptoms: string;
  diagnosisResults: {
    analytica: any;
    researchBot: any;
    epiWatch: any;
    patternSeeker: any;
    riskAnalyzer: any;
    coordinator: any;
  };
  finalDiagnosis: {
    condition: string;
    confidence: number;
    urgencyLevel: string;
  };
  createdAt: Date;
  updatedAt: Date;
  clinicianId?: string;
}

const DiagnosisHistorySchema: Schema = new Schema({
  patientName: {
    type: String,
    required: true,
    index: true
  },
  patientAge: {
    type: String,
    required: true
  },
  patientGender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  medicalHistory: {
    type: String,
    default: ''
  },
  symptoms: {
    type: String,
    required: true
  },
  diagnosisResults: {
    analytica: {
      type: Schema.Types.Mixed,
      default: null
    },
    researchBot: {
      type: Schema.Types.Mixed,
      default: null
    },
    epiWatch: {
      type: Schema.Types.Mixed,
      default: null
    },
    patternSeeker: {
      type: Schema.Types.Mixed,
      default: null
    },
    riskAnalyzer: {
      type: Schema.Types.Mixed,
      default: null
    },
    coordinator: {
      type: Schema.Types.Mixed,
      default: null
    }
  },
  finalDiagnosis: {
    condition: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    urgencyLevel: {
      type: String,
      required: true,
      enum: ['Low', 'Moderate', 'High', 'Critical']
    }
  },
  clinicianId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
DiagnosisHistorySchema.index({ patientName: 1, createdAt: -1 });
DiagnosisHistorySchema.index({ createdAt: -1 });
DiagnosisHistorySchema.index({ clinicianId: 1, createdAt: -1 });

export default mongoose.models.DiagnosisHistory || mongoose.model<IDiagnosisHistory>('DiagnosisHistory', DiagnosisHistorySchema);
