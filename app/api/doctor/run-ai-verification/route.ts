import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import DoctorVerification from "@/lib/models/DoctorVerification";
import { DoctorVerificationAgent } from "@/lib/agents/doctor-verification-agent";

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

    // Find pending verification
    const verification = await DoctorVerification.findOne({
      userId: session.user.email,
      verificationStatus: "pending",
    });

    if (!verification) {
      return NextResponse.json(
        { error: "No pending verification found" },
        { status: 404 }
      );
    }

    // Initialize AI agent
    const aiAgent = new DoctorVerificationAgent();

    // Run AI verification
    console.log("Starting AI verification for:", session.user.email);
    
    const verificationResult = await aiAgent.verifyDocuments(
      verification.documents,
      {
        medicalLicenseNumber: verification.medicalLicenseNumber,
        licenseIssuingAuthority: verification.licenseIssuingAuthority,
        specialization: verification.specialization,
        yearsOfExperience: verification.yearsOfExperience,
        institutionGraduated: verification.institutionGraduated,
        graduationYear: verification.graduationYear,
      }
    );

    // Update verification record with AI results
    verification.aiVerification = {
      status: verificationResult.status,
      confidenceScore: verificationResult.confidenceScore,
      documentAnalysis: verificationResult.documentAnalysis,
      overallAssessment: verificationResult.overallAssessment,
      riskFactors: verificationResult.riskFactors,
      verifiedAt: new Date(),
    };

    // Set final verification status
    verification.verificationStatus = 
      verificationResult.status === "manual_review_required" 
        ? "pending"  // Keep as pending for manual review later
        : verificationResult.status;

    // If rejected, add rejection reason
    if (verificationResult.status === "rejected") {
      verification.rejectionReason = `AI Verification Failed: ${verificationResult.overallAssessment}. Issues: ${verificationResult.riskFactors.join(", ")}`;
    }

    await verification.save();

    // Update user's verification status in Patient model
    await import("@/lib/models/Patient").then(async ({ default: Patient }) => {
      await Patient.findOneAndUpdate(
        { userId: session.user.email },
        { 
          verificationStatus: verification.verificationStatus,
          hasCompletedInfo: verification.verificationStatus === "verified"
        }
      );
    });

    console.log("AI Verification complete:", {
      status: verificationResult.status,
      confidence: verificationResult.confidenceScore,
      email: session.user.email,
    });

    // Send notification email (if configured)
    if (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY) {
      await sendVerificationEmail(
        session.user.email!,
        session.user.name!,
        verificationResult.status,
        verificationResult.confidenceScore
      ).catch(err => console.error("Failed to send email:", err));
    }

    return NextResponse.json({
      message: "AI verification completed",
      status: verificationResult.status,
      confidenceScore: verificationResult.confidenceScore,
      overallAssessment: verificationResult.overallAssessment,
      riskFactors: verificationResult.riskFactors,
    });

  } catch (error) {
    console.error("Error in AI verification:", error);
    return NextResponse.json(
      { error: "AI verification failed" },
      { status: 500 }
    );
  }
}

async function sendVerificationEmail(
  email: string,
  name: string,
  status: string,
  confidence: number
) {
  // Placeholder for email sending logic
  // You can integrate SendGrid, Resend, or AWS SES here
  
  const subject = `Doctor Verification ${status === "verified" ? "Successful" : status === "rejected" ? "Failed" : "Requires Review"}`;
  
  let message = "";
  if (status === "verified") {
    message = `Congratulations Dr. ${name}! Your credentials have been verified successfully with ${confidence}% confidence. You now have full access to all clinician features.`;
  } else if (status === "rejected") {
    message = `Dear Dr. ${name}, unfortunately your credential verification was not successful. Please check your dashboard for details and resubmit with clearer documents.`;
  } else {
    message = `Dear Dr. ${name}, your verification requires additional manual review. Our team will contact you within 24 hours.`;
  }

  console.log("Would send email:", { to: email, subject, message });
}

// GET endpoint to manually trigger AI verification (for testing)
export async function GET() {
  return POST(await new Request("http://localhost:3000/api/doctor/run-ai-verification", { method: "POST" }));
}
