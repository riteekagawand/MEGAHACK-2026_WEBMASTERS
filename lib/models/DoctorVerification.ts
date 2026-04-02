import mongoose, { Schema, Document } from "mongoose";

export interface IDoctorVerification extends Document {
  userId: string;
  email: string;
  name: string;
  
  // Professional Details
  medicalLicenseNumber: string;
  licenseIssuingAuthority: string;
  licenseExpiryDate: Date;
  specialization: string;
  yearsOfExperience: number;
  institutionGraduated: string;
  graduationYear: number;
  
  // NMC (National Medical Commission) Details
  nmcRegistrationNumber?: string;
  nmcCouncilName?: string;
  nmcQualification?: string;
  nmcRegistrationDate?: Date;
  nmcStatus?: 'active' | 'inactive' | 'suspended' | 'not_found';
  nmcVerifiedAt?: Date;
  
  // Document Uploads (stored as base64 or file paths)
  documents: {
    medicalLicense: string;      // Base64 or URL
    medicalDegree: string;        // MBBS/MD certificate
    governmentId: string;         // Aadhar/Passport/Driving License
    registrationCertificate: string; // Medical council registration
  };
  
  // AI Verification Results
  aiVerification: {
    status: 'pending' | 'verified' | 'rejected' | 'manual_review_required';
    confidenceScore: number;      // 0-100
    documentAnalysis: {
      medicalLicense: {
        verified: boolean;
        confidence: number;
        issues: string[];
      };
      medicalDegree: {
        verified: boolean;
        confidence: number;
        issues: string[];
      };
      governmentId: {
        verified: boolean;
        confidence: number;
        issues: string[];
      };
      registrationCertificate: {
        verified: boolean;
        confidence: number;
        issues: string[];
      };
    };
    overallAssessment: string;
    riskFactors: string[];
    verifiedAt?: Date;
  };
  
  // Verification Status
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  rejectionReason?: string;
  reviewNotes?: string;
  
  // Metadata
  submittedAt: Date;
  lastVerifiedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorVerificationSchema = new Schema<IDoctorVerification>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    
    // Professional Details
    medicalLicenseNumber: {
      type: String,
      required: true,
    },
    licenseIssuingAuthority: {
      type: String,
      required: true,
    },
    licenseExpiryDate: {
      type: Date,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
      max: 60,
    },
    institutionGraduated: {
      type: String,
      required: true,
    },
    graduationYear: {
      type: Number,
      required: true,
      min: 1950,
      max: new Date().getFullYear(),
    },
    
    // NMC Details (optional but recommended)
    nmcRegistrationNumber: String,
    nmcCouncilName: String,
    nmcQualification: String,
    nmcRegistrationDate: Date,
    nmcStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'not_found'],
      default: 'not_found',
    },
    nmcVerifiedAt: Date,
    
    // Document Uploads
    documents: {
      medicalLicense: { type: String, required: true },
      medicalDegree: { type: String, required: true },
      governmentId: { type: String, required: true },
      registrationCertificate: { type: String, required: true },
    },
    
    // AI Verification Results
    aiVerification: {
      status: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'manual_review_required'],
        default: 'pending',
      },
      confidenceScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      documentAnalysis: {
        medicalLicense: {
          verified: { type: Boolean, default: false },
          confidence: { type: Number, min: 0, max: 100 },
          issues: [String],
        },
        medicalDegree: {
          verified: { type: Boolean, default: false },
          confidence: { type: Number, min: 0, max: 100 },
          issues: [String],
        },
        governmentId: {
          verified: { type: Boolean, default: false },
          confidence: { type: Number, min: 0, max: 100 },
          issues: [String],
        },
        registrationCertificate: {
          verified: { type: Boolean, default: false },
          confidence: { type: Number, min: 0, max: 100 },
          issues: [String],
        },
      },
      overallAssessment: String,
      riskFactors: [String],
      verifiedAt: Date,
    },
    
    // Verification Status
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'expired'],
      default: 'pending',
    },
    rejectionReason: String,
    reviewNotes: String,
    
    // Timestamps
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    lastVerifiedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
DoctorVerificationSchema.index({ verificationStatus: 1, createdAt: -1 });
DoctorVerificationSchema.index({ 'aiVerification.status': 1 });

const DoctorVerification = 
  mongoose.models.DoctorVerification || 
  mongoose.model<IDoctorVerification>('DoctorVerification', DoctorVerificationSchema);

export default DoctorVerification;
