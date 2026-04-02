"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  CheckCircle, 
  Loader2, 
  Mail, 
  RefreshCw,
  Stethoscope,
  Shield,
  Zap
} from "lucide-react";

export default function PendingVerificationPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<string>("pending");
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Trigger AI verification immediately on mount, then check status
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      // Trigger AI verification IMMEDIATELY on page load
      triggerAIVerification();
      
      // Check status every 10 seconds to see if AI finished
      const checkInterval = setInterval(checkVerificationStatus, 10000);
      
      // Timer to show elapsed time
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 60000); // Every minute

      return () => {
        clearInterval(checkInterval);
        clearInterval(timer);
      };
    }
  }, [status, router]);

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch("/api/doctor/verify-documents");
      const data = await response.json();

      if (data.status === "verified") {
        setVerificationStatus("verified");
        setConfidenceScore(data.confidenceScore);
        
        // Update session
        await update();
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/medical/dashboard");
        }, 2000);
      } else if (data.status === "rejected") {
        setVerificationStatus("rejected");
      } else {
        setVerificationStatus("pending");
      }
    } catch (error) {
      console.error("Error checking status:", error);
    }
  };

  const triggerAIVerification = async () => {
    try {
      console.log("Triggering AI verification...");
      const response = await fetch("/api/doctor/run-ai-verification", {
        method: "POST",
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("AI Verification result:", data);
        
        // Immediately check status to update UI
        await checkVerificationStatus();
      } else if (response.status === 404) {
        // No pending verification found - might already be processed
        console.log("No pending verification found");
        await checkVerificationStatus();
      } else {
        console.error("AI verification failed");
      }
    } catch (error) {
      console.error("Error triggering AI verification:", error);
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    await checkVerificationStatus();
    setIsChecking(false);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFF4]">
        <Loader2 className="w-8 h-8 animate-spin text-[#f9c80e]" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Format elapsed time
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''}${mins > 0 ? ` ${mins} minute${mins > 1 ? 's' : ''}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-[#FFFFF4] p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Shield className="w-16 h-16 text-[#f9c80e] mx-auto mb-4" />
          <h1 className="text-4xl font-instrument-serif font-bold text-[#151616] mb-2">
            Verification Status
          </h1>
          <p className="text-lg text-[#151616]/70 font-poppins">
            Your credentials are being verified by our AI system
          </p>
        </motion.div>

        {/* Status Card */}
        <Card className="mb-6 border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#151616]">Verification Status:</span>
                <Badge
                  variant={
                    verificationStatus === "verified"
                      ? "default"
                      : verificationStatus === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-sm px-4 py-2"
                >
                  {verificationStatus === "verified" && (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  )}
                  {verificationStatus === "pending" && (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  )}
                  {verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)}
                </Badge>
              </div>

              {/* Confidence Score (if verified) */}
              {verificationStatus === "verified" && confidenceScore && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#151616]">AI Confidence Score:</span>
                    <span className="text-sm font-bold text-green-600">{confidenceScore}%</span>
                  </div>
                  <Progress value={confidenceScore} className="h-3" />
                </div>
              )}

              {/* Time Elapsed */}
              {verificationStatus === "pending" && (
                <div className="text-sm text-[#151616]/70">
                  <p>Time since submission: {formatTime(timeElapsed)}</p>
                  <p className="mt-1 text-xs">Average verification time: 5-10 minutes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* What's Happening */}
        {verificationStatus === "pending" && (
          <Card className="mb-6 border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Stethoscope className="w-5 h-5" />
                What's Happening Now?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-800 mt-0.5">
                  1
                </div>
                <p className="text-sm text-blue-900">
                  Our AI is analyzing your uploaded documents using Google Gemini Vision
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-800 mt-0.5">
                  2
                </div>
                <p className="text-sm text-blue-900">
                  Cross-checking NMC registration details with government database
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-800 mt-0.5">
                  3
                </div>
                <p className="text-sm text-blue-900">
                  Verifying medical license, degree, and registration certificates
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-800 mt-0.5">
                  4
                </div>
                <p className="text-sm text-blue-900">
                  Calculating confidence score based on document authenticity and consistency
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {verificationStatus === "verified" && (
          <Card className="mb-6 border-2 border-green-600 shadow-[4px_4px_0px_0px_#151616] bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-6 h-6" />
                Congratulations!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-green-900 font-medium">
                Your credentials have been successfully verified!
              </p>
              <p className="text-sm text-green-800">
                You now have full access to all clinician features including:
              </p>
              <ul className="space-y-1 text-sm text-green-700 ml-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  AI-powered medical diagnosis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Multi-agent clinical decision support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Patient records management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Medical analytics dashboard
                </li>
              </ul>
              <p className="text-xs text-green-700 mt-4">
                Redirecting to dashboard...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Rejected Message */}
        {verificationStatus === "rejected" && (
          <Card className="mb-6 border-2 border-red-600 shadow-[4px_4px_0px_0px_#151616] bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Alert className="w-6 h-6" />
                Verification Issue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-red-900 font-medium">
                Unfortunately, your verification could not be completed.
              </p>
              <Alert className="bg-white border-2 border-red-600">
                <AlertDescription className="ml-2 text-sm text-red-800">
                  This could be due to unclear document scans, mismatched information, or invalid credentials. Please check your email for detailed reasons and resubmission instructions.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => router.push("/medical/verification")}
                className="w-full bg-red-600 hover:bg-red-700 text-white border-2 border-red-800"
              >
                Resubmit Documents
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Email Notification Info */}
        {verificationStatus === "pending" && (
          <Alert className="mb-6 bg-white border-2 border-[#151616]">
            <Mail className="h-4 w-4" />
            <AlertDescription className="ml-2 text-sm">
              You'll receive an email notification at <strong>{session.user?.email}</strong> once verification is complete.
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Trigger & Check Buttons */}
        {verificationStatus === "pending" && (
          <div className="space-y-4 text-center">
            <div className="bg-yellow-50 border-2 border-yellow-600 rounded-lg p-4">
              <p className="text-sm font-bold text-yellow-800 mb-2">
                ⚡ Quick Action Required
              </p>
              <p className="text-xs text-yellow-700 mb-3">
                If verification hasn't started yet, click below to trigger AI now:
              </p>
              <Button
                onClick={triggerAIVerification}
                disabled={isChecking}
                className="bg-[#f9c80e] hover:bg-[#f9c80e]/90 text-[#151616] border-2 border-[#151616] font-bold"
              >
                {isChecking ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting AI...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    START AI VERIFICATION NOW
                  </div>
                )}
              </Button>
              <p className="text-xs text-yellow-700 mt-2">
                Takes 2-5 minutes to complete
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleManualCheck}
                disabled={isChecking}
                variant="outline"
                className="border-2 border-[#151616] hover:bg-[#f9c80e] transition-all"
              >
                {isChecking ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Check Status
                  </div>
                )}
              </Button>
              <p className="text-xs text-[#151616]/60 mt-2">
                Auto-checks every 10 seconds
              </p>
            </div>
          </div>
        )}

        {/* Contact Support */}
        <div className="text-center mt-8 text-sm text-[#151616]/60">
          <p>Having trouble? Contact support at support@orka.health</p>
        </div>
      </div>
    </div>
  );
}
