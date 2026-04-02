import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import DoctorVerification from "@/lib/models/DoctorVerification";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const formData = await request.formData();
    
    // Validate required fields
    const medicalLicenseNumber = formData.get("medicalLicenseNumber") as string;
    const licenseIssuingAuthority = formData.get("licenseIssuingAuthority") as string;
    const licenseExpiryDate = formData.get("licenseExpiryDate") as string;
    const specialization = formData.get("specialization") as string;
    const yearsOfExperience = formData.get("yearsOfExperience") as string;
    const institutionGraduated = formData.get("institutionGraduated") as string;
    const graduationYear = formData.get("graduationYear") as string;

    // Validate all required fields
    if (!medicalLicenseNumber || !licenseIssuingAuthority || !licenseExpiryDate || 
        !specialization || !yearsOfExperience || !institutionGraduated || !graduationYear) {
      return NextResponse.json(
        { error: "All professional details are required" },
        { status: 400 }
      );
    }

    // Get uploaded files
    const medicalLicenseFile = formData.get("medicalLicense") as File;
    const medicalDegreeFile = formData.get("medicalDegree") as File;
    const governmentIdFile = formData.get("governmentId") as File;
    const registrationCertificateFile = formData.get("registrationCertificate") as File;

    // Validate files exist
    if (!medicalLicenseFile || !medicalDegreeFile || !governmentIdFile || !registrationCertificateFile) {
      return NextResponse.json(
        { error: "All documents must be uploaded" },
        { status: 400 }
      );
    }

    // Validate file types (PDF, JPG, PNG only)
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    const validateFile = (file: File, fieldName: string) => {
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`${fieldName} must be a PDF or image file`);
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error(`${fieldName} must be less than 5MB`);
      }
    };

    validateFile(medicalLicenseFile, "Medical License");
    validateFile(medicalDegreeFile, "Medical Degree");
    validateFile(governmentIdFile, "Government ID");
    validateFile(registrationCertificateFile, "Registration Certificate");

    // Convert files to base64 for storage
    const convertToBase64 = async (file: File): Promise<string> => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      return `data:${file.type};base64,${buffer.toString("base64")}`;
    };

    const [medicalLicense, medicalDegree, governmentId, registrationCertificate] = await Promise.all([
      convertToBase64(medicalLicenseFile),
      convertToBase64(medicalDegreeFile),
      convertToBase64(governmentIdFile),
      convertToBase64(registrationCertificateFile),
    ]);

    // Check if verification already exists
    const existingVerification = await DoctorVerification.findOne({ 
      userId: session.user.email 
    });

    if (existingVerification) {
      return NextResponse.json(
        { 
          error: "Verification already submitted",
          status: existingVerification.verificationStatus,
          message: existingVerification.verificationStatus === "verified" 
            ? "Your credentials are already verified" 
            : "Your verification is under review"
        },
        { status: 400 }
      );
    }

    // Create new verification record
    const verification = new DoctorVerification({
      userId: session.user.email,
      email: session.user.email,
      name: session.user.name || "",
      medicalLicenseNumber,
      licenseIssuingAuthority,
      licenseExpiryDate: new Date(licenseExpiryDate),
      specialization,
      yearsOfExperience: parseInt(yearsOfExperience),
      institutionGraduated,
      graduationYear: parseInt(graduationYear),
      documents: {
        medicalLicense,
        medicalDegree,
        governmentId,
        registrationCertificate,
      },
      aiVerification: {
        status: "pending",
        confidenceScore: 0,
        documentAnalysis: {
          medicalLicense: { verified: false, confidence: 0, issues: [] },
          medicalDegree: { verified: false, confidence: 0, issues: [] },
          governmentId: { verified: false, confidence: 0, issues: [] },
          registrationCertificate: { verified: false, confidence: 0, issues: [] },
        },
        overallAssessment: "",
        riskFactors: [],
      },
      verificationStatus: "pending",
      expiresAt: new Date(licenseExpiryDate),
    });

    await verification.save();

    // Update user's verification status in Patient model
    const userEmail = session.user?.email;
    if (userEmail) {
      await import("@/lib/models/Patient").then(async ({ default: Patient }) => {
        await Patient.findOneAndUpdate(
          { userId: userEmail },
          { verificationStatus: "pending" }
        );
      });
    }

    return NextResponse.json({
      message: "Documents submitted successfully for verification. AI verification will start shortly...",
      verificationId: verification._id,
      status: "pending",
      shouldTriggerAI: true,
    });

  } catch (error) {
    console.error("Error uploading documents:", error);
    
    let errorMessage = "Failed to upload documents";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to check verification status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const verification = await DoctorVerification.findOne({ 
      userId: session.user.email 
    }).select("-documents"); // Don't return document data

    if (!verification) {
      return NextResponse.json({
        status: "not_submitted",
        message: "No verification request found"
      });
    }

    return NextResponse.json({
      status: verification.verificationStatus,
      aiVerificationStatus: verification.aiVerification.status,
      confidenceScore: verification.aiVerification.confidenceScore,
      submittedAt: verification.submittedAt,
      rejectionReason: verification.rejectionReason,
      message: getStatusMessage(verification.verificationStatus),
    });

  } catch (error) {
    console.error("Error fetching verification status:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove verification record (for re-submission)
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Delete existing verification record
    const result = await DoctorVerification.deleteOne({
      userId: session.user.email,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        message: "No verification record found to delete",
      });
    }

    // Also reset verification status in Patient model
    const userEmail = session.user?.email;
    if (userEmail) {
      await import("@/lib/models/Patient").then(async ({ default: Patient }) => {
        await Patient.findOneAndUpdate(
          { userId: userEmail },
          { 
            verificationStatus: "pending",
            hasCompletedInfo: false
          }
        );
      });
    }

    return NextResponse.json({
      message: "Verification record deleted successfully. You can now re-upload documents.",
      deletedCount: result.deletedCount,
    });

  } catch (error) {
    console.error("Error deleting verification:", error);
    return NextResponse.json(
      { error: "Failed to delete verification record" },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case "pending":
      return "Your verification is under review. This usually takes 5-10 minutes.";
    case "verified":
      return "Congratulations! Your credentials have been verified.";
    case "rejected":
      return "Your verification was rejected. Please check the reason and resubmit.";
    default:
      return "";
  }
}
