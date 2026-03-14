"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileImage, 
  X, 
  Eye, 
  Brain,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface ImageAnalysis {
  findings: string[];
  confidence: number;
  recommendations: string[];
  urgency: "low" | "medium" | "high" | "critical";
}

interface ProcessedImage {
  id: string;
  file: File;
  preview: string;
  analysis?: ImageAnalysis;
  processing: boolean;
}

export function ImageProcessor() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        toast.error(`${file.name} is not a supported file type`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large (max 50MB)`);
        return false;
      }
      return true;
    });

    validFiles.forEach(file => {
      const id = Math.random().toString(36).substr(2, 9);
      const preview = URL.createObjectURL(file);
      
      const newImage: ProcessedImage = {
        id,
        file,
        preview,
        processing: false
      };

      setImages(prev => [...prev, newImage]);
    });
  };

  const analyzeImage = async (imageId: string) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, processing: true } : img
    ));

    try {
      // Simulate AI image analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockAnalysis: ImageAnalysis = {
        findings: [
          "Chest X-ray shows clear lung fields",
          "No signs of pneumonia or consolidation",
          "Heart size within normal limits",
          "Diaphragm and costophrenic angles are sharp"
        ],
        confidence: 85,
        recommendations: [
          "Normal chest X-ray findings",
          "No immediate concerns identified",
          "Clinical correlation recommended"
        ],
        urgency: "low"
      };

      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, processing: false, analysis: mockAnalysis }
          : img
      ));

      toast.success("Image analysis completed");
    } catch (error) {
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, processing: false } : img
      ));
      toast.error("Failed to analyze image");
    }
  };

  const removeImage = (imageId: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === imageId);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
      <CardHeader>
        <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
          <FileImage className="w-5 h-5" />
          Medical Image Analysis
        </CardTitle>
        <CardDescription className="font-poppins">
          Upload X-rays, CT scans, MRI, ECG reports for AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragActive 
              ? "border-[#f9c80e] bg-[#f9c80e]/10" 
              : "border-[#151616]/30 hover:border-[#151616]/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-[#151616]/50" />
          <p className="font-poppins text-[#151616] mb-2">
            Drag and drop medical images here
          </p>
          <p className="text-sm font-poppins text-[#151616]/70 mb-4">
            Supports JPEG, PNG, PDF, DICOM (max 50MB)
          </p>
          <Button
            variant="reverse"
            className="border-2 border-[#151616]"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          />
        </div>

        {/* Uploaded Images */}
        {images.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-poppins font-bold text-[#151616]">
              Uploaded Images ({images.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((image) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border-2 border-[#151616] rounded-xl p-4 bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-poppins font-medium text-[#151616] truncate">
                        {image.file.name}
                      </p>
                      <p className="text-sm font-poppins text-[#151616]/70">
                        {(image.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="reverse"
                      size="sm"
                      onClick={() => removeImage(image.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Image Preview */}
                  {image.file.type.startsWith('image/') && (
                    <div className="mb-3">
                      <img
                        src={image.preview}
                        alt={image.file.name}
                        className="w-full h-32 object-cover rounded-lg border border-[#151616]/20"
                      />
                    </div>
                  )}

                  {/* Analysis Results */}
                  {image.analysis ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getUrgencyColor(image.analysis.urgency)} text-white`}>
                          {image.analysis.urgency.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-poppins text-[#151616]/70">
                          {image.analysis.confidence}% confidence
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-poppins font-medium text-[#151616]">Findings:</h4>
                        {image.analysis.findings.map((finding, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm font-poppins text-[#151616]/80">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => analyzeImage(image.id)}
                        disabled={image.processing}
                        className="bg-[#f9c80e] hover:bg-[#f9c80e]/90 text-[#151616] border-2 border-[#151616] font-poppins font-medium"
                      >
                        {image.processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Analyze
                          </>
                        )}
                      </Button>
                      <Button
                        variant="reverse"
                        size="sm"
                        className="border-2 border-[#151616]"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}