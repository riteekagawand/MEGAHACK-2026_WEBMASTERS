import mongoose, { Schema, Document } from 'mongoose';

export interface IDiagnosisSession extends Document {
  sessionId: string;
  userId: string;
  patientId?: string;
  input: {
    symptoms: string;
    language: string;
    age?: number;
    gender?: string;
    location?: string;
    medicalHistory?: string[];
  };
  agentProcessing: {
    translator: {
      status: 'pending' | 'processing' | 'completed' | 'error';
      startTime?: Date;
      endTime?: Date;
      result?: {
        translatedSymptoms: string;
        emergencyKeywords: string[];
        culturalContext: string;
      };
      error?: string;
    };
    symptomAnalyzer: {
      status: 'pending' | 'processing' | 'completed' | 'error';
      startTime?: Date;
      endTime?: Date;
      result?: {
        structuredSymptoms: Array<{
          symptom: string;
          severity: number;
          duration: string;
          bodySystem: string;
        }>;
        redFlags: string[];
        urgencyScore: number;
      };
      error?: string;
    };
    researcher: {
      status: 'pending' | 'processing' | 'completed' | 'error';
      startTime?: Date;
      endTime?: Date;
      result?: {
        relevantStudies: Array<{
          title: string;
          summary: string;
          evidenceLevel: number;
          source: string;
        }>;
        regionalPatterns: string;
        currentOutbreaks: string[];
      };
      error?: string;
    };
    riskAssessment: {
      status: 'pending' | 'processing' | 'completed' | 'error';
      startTime?: Date;
      endTime?: Date;
      result?: {
        riskFactors: Array<{
          factor: string;
          impact: 'low' | 'medium' | 'high';
          description: string;
        }>;
        overallRisk: 'low' | 'medium' | 'high' | 'critical';
        recommendations: string[];
      };
      error?: string;
    };
    aggregator: {
      status: 'pending' | 'processing' | 'completed' | 'error';
      startTime?: Date;
      endTime?: Date;
      result?: {
        primaryDiagnosis: {
          condition: string;
          confidence: string;
          icd10Code?: string;
        };
        differentialDiagnosis: Array<{
          condition: string;
          confidence: string;
        }>;
        urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
        recommendedTests?: string[];
        clinicalNotes: string;
      };
      error?: string;
    };
  };
  finalDiagnosis?: {
    primaryDiagnosis: {
      condition: string;
      confidence: string;
      icd10Code?: string;
    };
    differentialDiagnosis: Array<{
      condition: string;
      confidence: string;
    }>;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendedTests?: string[];
    clinicalNotes: string;
    agentInsights: {
      translator?: string;
      symptomAnalyzer?: string;
      researcher?: string;
      riskAssessment?: string;
    };
    processingMetadata?: {
      processingTime: string;
      agentsUsed: string[];
      timestamp: string;
      apiStatus: 'active' | 'fallback' | 'error';
    };
  };
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

const DiagnosisSessionSchema = new Schema<IDiagnosisSession>({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  patientId: {
    type: String,
    index: true
  },
  input: {
    symptoms: { type: String, required: true },
    language: { type: String, required: true },
    age: Number,
    gender: String,
    location: String,
    medicalHistory: [String]
  },
  agentProcessing: {
    translator: {
      status: { type: String, enum: ['pending', 'processing', 'completed', 'error'], default: 'pending' },
      startTime: Date,
      endTime: Date,
      result: {
        translatedSymptoms: String,
        emergencyKeywords: [String],
        culturalContext: String
      },
      error: String
    },
    symptomAnalyzer: {
      status: { type: String, enum: ['pending', 'processing', 'completed', 'error'], default: 'pending' },
      startTime: Date,
      endTime: Date,
      result: {
        structuredSymptoms: [{
          symptom: String,
          severity: Number,
          duration: String,
          bodySystem: String
        }],
        redFlags: [String],
        urgencyScore: Number
      },
      error: String
    },
    researcher: {
      status: { type: String, enum: ['pending', 'processing', 'completed', 'error'], default: 'pending' },
      startTime: Date,
      endTime: Date,
      result: {
        relevantStudies: [{
          title: String,
          summary: String,
          evidenceLevel: Number,
          source: String
        }],
        regionalPatterns: String,
        currentOutbreaks: [String]
      },
      error: String
    },
    riskAssessment: {
      status: { type: String, enum: ['pending', 'processing', 'completed', 'error'], default: 'pending' },
      startTime: Date,
      endTime: Date,
      result: {
        riskFactors: [{
          factor: String,
          impact: { type: String, enum: ['low', 'medium', 'high'] },
          description: String
        }],
        overallRisk: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
        recommendations: [String]
      },
      error: String
    },
    aggregator: {
      status: { type: String, enum: ['pending', 'processing', 'completed', 'error'], default: 'pending' },
      startTime: Date,
      endTime: Date,
      result: {
        primaryDiagnosis: {
          condition: String,
          confidence: String,
          icd10Code: String
        },
        differentialDiagnosis: [{
          condition: String,
          confidence: String
        }],
        urgencyLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
        recommendedTests: [String],
        clinicalNotes: String
      },
      error: String
    }
  },
  finalDiagnosis: {
    primaryDiagnosis: {
      condition: String,
      confidence: String,
      icd10Code: String
    },
    differentialDiagnosis: [{
      condition: String,
      confidence: String
    }],
    urgencyLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    recommendedTests: [String],
    clinicalNotes: String,
    agentInsights: {
      translator: String,
      symptomAnalyzer: String,
      researcher: String,
      riskAssessment: String
    },
    processingMetadata: {
      processingTime: String,
      agentsUsed: [String],
      timestamp: String,
      apiStatus: { type: String, enum: ['active', 'fallback', 'error'] }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'error'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export default mongoose.models.DiagnosisSession || mongoose.model<IDiagnosisSession>('DiagnosisSession', DiagnosisSessionSchema);