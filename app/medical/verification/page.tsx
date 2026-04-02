"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Shield, 
  Stethoscope,
  Loader2,
  X
} from "lucide-react";

const SPECIALIZATIONS = [
  "General Medicine",
  "Cardiology", 
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Gynecology",
  "ENT",
  "Ophthalmology",
  "Radiology",
  "Pathology",
  "Anesthesiology",
  "Oncology",
  "Emergency Medicine"
];

export default function ClinicianVerification() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [existingRecord, setExistingRecord] = useState<any>(null);

  const [formData, setFormData] = useState({
    medicalLicenseNumber: "",
    licenseIssuingAuthority: "",
    licenseExpiryDate: "",
    specialization: "",
    yearsOfExperience: "",
    institutionGraduated: "",
    graduationYear: new Date().getFullYear() - 5,
    nmcRegistrationNumber: "",
    nmcCouncilName: "",
    nmcQualification: "",
  });

  const [documents, setDocuments] = useState<{
    medicalLicense: File | null;
    medicalDegree: File | null;
    governmentId: File | null;
    registrationCertificate: File | null;
  }>({
    medicalLicense: null,
    medicalDegree: null,
    governmentId: null,
    registrationCertificate: null,
  });

  // Check existing verification status on mount
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      checkExistingVerification();
    }
  }, [status, router]);

  const checkExistingVerification = async () => {
    try {
      const response = await fetch("/api/doctor/verify-documents");
      const data = await response.json();
      
      if (data.status === "verified") {
        // Already verified, redirect to dashboard
        router.push("/medical/dashboard");
      } else if (data.status === "pending" || data.status === "rejected") {
        setVerificationStatus(data.status);
        setExistingRecord(data);
      } else if (data.status === "not_submitted") {
        setVerificationStatus("not_submitted");
      }
    } catch (error) {
      console.error("Error checking status:", error);
    }
  };

  const handleDeleteExisting = async () => {
    if (!confirm("This will delete your existing verification record. Are you sure?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/doctor/verify-documents", {
        method: "DELETE",
      });

      if (response.ok) {
        setExistingRecord(null);
        setVerificationStatus(null);
        alert("Verification record deleted. You can now upload new documents.");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to delete record");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field: keyof typeof documents, file: File | null) => {
    if (file) {
      // Validate file
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        alert("Please upload PDF or image files only");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
    }
    setDocuments(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields are filled
    for (const key in formData) {
      if (!formData[key as keyof typeof formData]) {
        alert("Please fill all required fields");
        return;
      }
    }

    // Validate all documents uploaded
    for (const key in documents) {
      if (!documents[key as keyof typeof documents]) {
        alert("Please upload all required documents");
        return;
      }
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Create form data
      const form = new FormData();
      
      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.append(key, String(value));
        }
      });

      // Add files
      Object.entries(documents).forEach(([key, file]) => {
        if (file) {
          form.append(key, file);
        }
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await fetch("/api/doctor/verify-documents", {
        method: "POST",
        body: form,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        setShowSuccess(true);
        
        // Update session
        await update();
        
        // Trigger AI verification immediately before redirecting
        console.log("Triggering AI verification...");
        try {
          await fetch("/api/doctor/run-ai-verification", {
            method: "POST",
          });
          console.log("AI verification started!");
        } catch (error) {
          console.error("Failed to trigger AI:", error);
        }
        
        // Show success message for 2 seconds then redirect
        setTimeout(() => {
          router.push("/medical/pending-verification");
        }, 2000);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit verification");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error submitting verification:", error);
      alert("Failed to submit verification");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFF4]">
        <div className="w-8 h-8 border-4 border-[#151616]/30 border-t-[#151616] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Show existing record info
  if (existingRecord && (verificationStatus === "pending" || verificationStatus === "rejected")) {
    return (
      <div className="min-h-screen bg-[#FFFFF4] p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h1 className="text-3xl font-instrument-serif font-bold text-[#151616] mb-4">
              Verification Already Submitted
            </h1>
            <p className="text-lg text-[#151616]/70 font-poppins mb-6">
              You have already submitted documents for verification.
            </p>
            
            <Card className="mb-6 border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={verificationStatus === "rejected" ? "destructive" : "secondary"} className="capitalize">
                      {verificationStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Submitted:</span>
                    <span className="text-sm">{new Date(existingRecord.submittedAt).toLocaleString()}</span>
                  </div>
                  {existingRecord.rejectionReason && (
                    <div className="bg-red-50 border-2 border-red-600 rounded-lg p-3 text-left">
                      <p className="text-sm font-bold text-red-800 mb-1">Rejection Reason:</p>
                      <p className="text-xs text-red-700">{existingRecord.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {verificationStatus === "pending" ? (
                <Button
                  onClick={() => router.push("/medical/pending-verification")}
                  className="bg-[#f9c80e] hover:bg-[#f9c80e]/90 text-[#151616] border-2 border-[#151616] font-bold"
                >
                  Go to Pending Status Page
                </Button>
              ) : (
                <p className="text-sm text-[#151616]/70">
                  Your verification was rejected. You can delete this record and submit new documents.
                </p>
              )}

              <div className="pt-4 border-t-2 border-[#151616]/20">
                <p className="text-sm font-bold text-[#151616] mb-2">Want to start over?</p>
                <Button
                  onClick={handleDeleteExisting}
                  disabled={loading}
                  variant="outline"
                  className="border-2 border-red-600 text-red-600 hover:bg-red-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Delete & Start Fresh"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show pending status
  if (verificationStatus === "pending") {
    return (
      <div className="min-h-screen bg-[#FFFFF4] p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Clock className="w-16 h-16 text-[#f9c80e] mx-auto mb-4" />
            <h1 className="text-3xl font-instrument-serif font-bold text-[#151616] mb-4">
              Verification Under Review
            </h1>
            <p className="text-lg text-[#151616]/70 font-poppins mb-6">
              Your documents are being verified by our AI system. This process typically takes 5-10 minutes.
            </p>
            <Alert className="bg-white border-2 border-[#151616]">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                You will be notified once the verification is complete. You can check your email for updates.
              </AlertDescription>
            </Alert>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show success message after submission
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#FFFFF4] flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <CheckCircle className="w-24 h-24 text-green-600 mx-auto mb-6" />
          <h1 className="text-4xl font-instrument-serif font-bold text-[#151616] mb-4">
            Documents Submitted!
          </h1>
          <p className="text-xl text-[#151616]/70 font-poppins mb-6">
            Your credentials are being verified. Redirecting you to the status page...
          </p>
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#f9c80e]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFF4] p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Shield className="w-16 h-16 text-[#f9c80e] mx-auto mb-4" />
          <h1 className="text-4xl font-instrument-serif font-bold text-[#151616] mb-2">
            Doctor Credential Verification
          </h1>
          <p className="text-lg text-[#151616]/70 font-poppins">
            Upload your professional documents for AI-powered verification
          </p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          {/* Professional Details */}
          <Card className="mb-8 border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Professional Information
              </CardTitle>
              <CardDescription>Provide your medical credentials and practice details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="medicalLicenseNumber">Medical License Number *</Label>
                  <Input
                    id="medicalLicenseNumber"
                    value={formData.medicalLicenseNumber}
                    onChange={(e) => setFormData({ ...formData, medicalLicenseNumber: e.target.value })}
                    placeholder="Enter your license number"
                    className="border-2 border-[#151616]"
                  />
                </div>

                <div>
                  <Label htmlFor="licenseIssuingAuthority">Issuing Authority *</Label>
                  <Input
                    id="licenseIssuingAuthority"
                    value={formData.licenseIssuingAuthority}
                    onChange={(e) => setFormData({ ...formData, licenseIssuingAuthority: e.target.value })}
                    placeholder="e.g., Medical Council of India"
                    className="border-2 border-[#151616]"
                  />
                </div>

                <div>
                  <Label htmlFor="licenseExpiryDate">License Expiry Date *</Label>
                  <Input
                    id="licenseExpiryDate"
                    type="date"
                    value={formData.licenseExpiryDate}
                    onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                    className="border-2 border-[#151616]"
                  />
                </div>

                <div>
                  <Label htmlFor="specialization">Specialization *</Label>
                  <Select
                    value={formData.specialization}
                    onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                  >
                    <SelectTrigger className="border-2 border-[#151616]">
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALIZATIONS.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    min="0"
                    max="60"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    className="border-2 border-[#151616]"
                  />
                </div>

                <div>
                  <Label htmlFor="graduationYear">Graduation Year *</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    min="1950"
                    max={new Date().getFullYear()}
                    value={formData.graduationYear}
                    onChange={(e) => setFormData({ ...formData, graduationYear: parseInt(e.target.value) })}
                    className="border-2 border-[#151616]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="institutionGraduated">Medical Institution/College *</Label>
                <Input
                  id="institutionGraduated"
                  value={formData.institutionGraduated}
                  onChange={(e) => setFormData({ ...formData, institutionGraduated: e.target.value })}
                  placeholder="Name of your medical school/college"
                  className="border-2 border-[#151616]"
                />
              </div>
            </CardContent>
          </Card>

          {/* NMC Verification Section */}
          <Card className="mb-8 border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Shield className="w-5 h-5" />
                National Medical Commission (NMC) Details
              </CardTitle>
              <CardDescription className="text-green-700">Verify your registration with India's official medical registry (Recommended)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-white border-2 border-green-600">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="ml-2 text-sm text-green-800">
                  Providing NMC details enables automatic verification against the government database. This significantly speeds up your verification process!
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nmcRegistrationNumber">NMC Registration Number</Label>
                  <Input
                    id="nmcRegistrationNumber"
                    value={formData.nmcRegistrationNumber}
                    onChange={(e) => setFormData({ ...formData, nmcRegistrationNumber: e.target.value })}
                    placeholder="e.g., 12345"
                    className="border-2 border-[#151616]"
                  />
                  <p className="text-xs text-[#151616]/60 mt-1">Your unique medical council registration ID</p>
                </div>

                <div>
                  <Label htmlFor="nmcCouncilName">State Medical Council</Label>
                  <Input
                    id="nmcCouncilName"
                    value={formData.nmcCouncilName}
                    onChange={(e) => setFormData({ ...formData, nmcCouncilName: e.target.value })}
                    placeholder="e.g., Delhi Medical Council"
                    className="border-2 border-[#151616]"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="nmcQualification">Primary Qualification</Label>
                  <Input
                    id="nmcQualification"
                    value={formData.nmcQualification}
                    onChange={(e) => setFormData({ ...formData, nmcQualification: e.target.value })}
                    placeholder="e.g., MBBS from AIIMS"
                    className="border-2 border-[#151616]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Uploads */}
          <Card className="mb-8 border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Required Documents
              </CardTitle>
              <CardDescription>Upload clear scans or photos (PDF, JPG, PNG - Max 5MB each)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentUploadField
                label="Medical License Certificate"
                description="Your valid medical practice license"
                file={documents.medicalLicense}
                onFileChange={(file) => handleFileChange("medicalLicense", file)}
                icon={<FileText className="w-5 h-5" />}
              />

              <DocumentUploadField
                label="Medical Degree Certificate"
                description="MBBS/MD/MS degree certificate"
                file={documents.medicalDegree}
                onFileChange={(file) => handleFileChange("medicalDegree", file)}
                icon={<FileText className="w-5 h-5" />}
              />

              <DocumentUploadField
                label="Government ID Proof"
                description="Aadhar Card / Passport / Driving License"
                file={documents.governmentId}
                onFileChange={(file) => handleFileChange("governmentId", file)}
                icon={<FileText className="w-5 h-5" />}
              />

              <DocumentUploadField
                label="Medical Council Registration"
                description="Registration certificate from medical council"
                file={documents.registrationCertificate}
                onFileChange={(file) => handleFileChange("registrationCertificate", file)}
                icon={<FileText className="w-5 h-5" />}
              />
            </CardContent>
          </Card>

          {/* Upload Progress */}
          {loading && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading and verifying...</span>
                <span className="text-sm">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f9c80e] hover:bg-[#f9c80e]/90 text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 font-poppins font-bold text-lg py-6"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting for Verification...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Submit Documents for Verification
              </div>
            )}
          </Button>

          <Alert className="mt-4 bg-[#f9c80e]/20 border-2 border-[#151616]">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2 text-sm">
              Our AI system will verify your documents within 5-10 minutes. You'll receive an email notification once verified.
            </AlertDescription>
          </Alert>
        </form>
      </div>
    </div>
  );
}

// Document Upload Field Component
interface DocumentUploadFieldProps {
  label: string;
  description: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  icon: React.ReactNode;
}

function DocumentUploadField({ label, description, file, onFileChange, icon }: DocumentUploadFieldProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0] || null;
    onFileChange(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <p className="text-xs text-[#151616]/60 mb-2">{description}</p>
      
      {file ? (
        <div className="flex items-center justify-between p-3 bg-white border-2 border-[#151616] rounded-lg">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium truncate max-w-xs">{file.name}</span>
            <Badge variant="outline" className="text-xs">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </Badge>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onFileChange(null)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-[#151616]/30 rounded-lg p-6 text-center cursor-pointer hover:border-[#f9c80e] hover:bg-[#f9c80e]/10 transition-all"
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-[#151616]/40" />
          <p className="text-sm text-[#151616]/70">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-[#151616]/50 mt-1">
            PDF, JPG, PNG (Max 5MB)
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
