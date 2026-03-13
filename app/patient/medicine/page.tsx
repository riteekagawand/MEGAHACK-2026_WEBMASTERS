"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Camera, Upload, Send, Pill, AlertTriangle, Clock, User, Heart, FileText, Shield, Zap, RefreshCw, Activity, Info, Utensils, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MedicineAnalysis {
    medicineName: string
    activeIngredients: string[]
    whatItHelps: string[]
    severity: "Low" | "Medium" | "High"
    doctorConsultationRequired: boolean
    whenToTake: {
        timing: string[]
        withFood: "Before" | "After" | "With" | "Doesn't matter"
        frequency: string
    }
    sideEffects: {
        common: string[]
        serious: string[]
        patientSpecific: string[]
    }
    precautions: string[]
    interactions: string[]
    confidence: number
}

export default function TestCamPage() {
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [additionalInfo, setAdditionalInfo] = useState("")
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysis, setAnalysis] = useState<MedicineAnalysis | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.type.startsWith('image/')) {
                setImage(file)
                const reader = new FileReader()
                reader.onload = (e) => {
                    setImagePreview(e.target?.result as string)
                }
                reader.readAsDataURL(file)
                setError(null)
            } else {
                setError("Please upload a valid image file")
            }
        }
    }

    const convertImageToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1]
                resolve(base64String)
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    const analyzeMedicine = async () => {
        if (!image) {
            setError("Please upload an image of the medicine")
            return
        }

        setIsAnalyzing(true)
        setError(null)

        try {
            const base64Image = await convertImageToBase64(image)

            const response = await fetch('/api/analyze-medicine', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64Image,
                    additionalInfo: additionalInfo.trim()
                })
            })

            if (!response.ok) {
                throw new Error('Failed to analyze medicine')
            }

            const result = await response.json()
            setAnalysis(result)
        } catch (error) {
            console.error('Error analyzing medicine:', error)
            setError('Failed to analyze medicine. Please try again.')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "High": return "bg-red-500 text-white"
            case "Medium": return "bg-yellow-500 text-[#151616]"
            case "Low": return "bg-green-500 text-white"
            default: return "bg-gray-500 text-white"
        }
    }

    return (
        <div className="min-h-screen bg-[#FFFFF4] p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <h1 className="text-4xl font-instrument-serif font-bold text-[#151616] mb-4">
                        Medicine Scanner & Analyzer
                    </h1>
                    <p className="text-xl text-[#151616]/70 font-poppins max-w-2xl mx-auto">
                        Upload an image of your medicine and get comprehensive analysis including dosage, side effects, and safety information
                    </p>
                </motion.div>

                {/* Upload Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                        <CardHeader>
                            <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                <Camera className="w-5 h-5" />
                                Upload Medicine Image
                            </CardTitle>
                            <CardDescription className="font-poppins">
                                Take a clear photo of the medicine package or upload an existing image
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Image Upload */}
                            <div className="border-2 border-dashed border-[#151616] rounded-xl p-8 text-center">
                                {imagePreview ? (
                                    <div className="space-y-4">
                                        <img
                                            src={imagePreview}
                                            alt="Medicine preview"
                                            className="max-h-64 mx-auto rounded-xl border-2 border-[#151616]"
                                        />
                                        <Button
                                            onClick={() => {
                                                setImage(null)
                                                setImagePreview(null)
                                            }}
                                            variant="outline"
                                            className="border-2 border-[#151616] hover:bg-[#151616] hover:text-white"
                                        >
                                            Remove Image
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Upload className="w-16 h-16 mx-auto text-[#151616]/50" />
                                        <div>
                                            <p className="text-lg font-poppins font-medium text-[#151616] mb-2">
                                                Upload Medicine Image
                                            </p>
                                            <p className="text-sm font-poppins text-[#151616]/70 mb-4">
                                                PNG, JPG up to 10MB
                                            </p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                id="image-upload"
                                            />
                                            <label htmlFor="image-upload">
                                                <Button
                                                    asChild
                                                    className="bg-[#D6F32F] text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] font-poppins font-bold"
                                                >
                                                    <span className="cursor-pointer">
                                                        Choose Image
                                                    </span>
                                                </Button>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Additional Information */}
                            <div className="space-y-2">
                                <label className="text-sm font-poppins font-medium text-[#151616]">
                                    Additional Information (Optional)
                                </label>
                                <Textarea
                                    placeholder="Enter any specific questions about this medicine, your medical conditions, or concerns..."
                                    value={additionalInfo}
                                    onChange={(e) => setAdditionalInfo(e.target.value)}
                                    className="border-2 border-[#151616] rounded-xl font-poppins"
                                    rows={3}
                                />
                            </div>

                            {/* Error Display */}
                            {error && (
                                <Alert className="border-2 border-red-500 bg-red-50">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription className="font-poppins">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Analyze Button */}
                            <Button
                                onClick={analyzeMedicine}
                                disabled={!image || isAnalyzing}
                                className="w-full bg-[#D6F32F] text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] disabled:opacity-50 disabled:cursor-not-allowed font-poppins font-bold text-lg py-6"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-[#151616] border-t-transparent rounded-full mr-2"
                                        />
                                        Analyzing Medicine...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 mr-2" />
                                        Analyze Medicine
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Analysis Results */}
                {analysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6"
                    >
                        {/* Medicine Info */}
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                    <Pill className="w-5 h-5" />
                                    {analysis.medicineName}
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Badge className={`font-poppins ${getSeverityColor(analysis.severity)}`}>
                                        {analysis.severity} Risk
                                    </Badge>
                                    <Badge className={`font-poppins ${analysis.doctorConsultationRequired
                                        ? "bg-orange-500 text-white"
                                        : "bg-green-500 text-white"
                                        }`}>
                                        {analysis.doctorConsultationRequired ? "Doctor Required" : "Self-Medication OK"}
                                    </Badge>
                                    <Badge className="bg-[#D6F32F] text-[#151616] font-poppins">
                                        {analysis.confidence}% Confidence
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Active Ingredients */}
                                <div>
                                    <h4 className="font-poppins font-semibold text-[#151616] mb-2">Active Ingredients:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.activeIngredients.map((ingredient, idx) => (
                                            <Badge key={idx} variant="outline" className="border-[#151616] font-poppins">
                                                {ingredient}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* What it helps with */}
                                <div>
                                    <h4 className="font-poppins font-semibold text-[#151616] mb-2 flex items-center gap-2">
                                        <Heart className="w-4 h-4" />
                                        What it helps with:
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {analysis.whatItHelps.map((condition, idx) => (
                                            <div key={idx} className="p-2 bg-[#FFFFF4] rounded border border-[#151616]/20">
                                                <div className="flex items-center gap-2">
                                                    <Heart className="w-3 h-3 text-green-600 flex-shrink-0" />
                                                    <span className="text-sm font-poppins text-[#151616]">{condition}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Dosage & Timing */}
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    When & How to Take
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                            <h5 className="font-poppins font-bold text-[#151616]">Timing</h5>
                                        </div>
                                        <div className="space-y-2">
                                            {analysis.whenToTake.timing.map((time, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                                    <span className="text-sm font-poppins text-[#151616]">{time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Utensils className="w-5 h-5 text-green-600" />
                                            <h5 className="font-poppins font-bold text-[#151616]">With Food</h5>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0"></div>
                                            <span className="text-sm font-poppins text-[#151616]">{analysis.whenToTake.withFood} meals</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <RotateCcw className="w-5 h-5 text-purple-600" />
                                            <h5 className="font-poppins font-bold text-[#151616]">Frequency</h5>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0"></div>
                                            <span className="text-sm font-poppins text-[#151616]">{analysis.whenToTake.frequency}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Side Effects */}
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Side Effects & Precautions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Common Side Effects */}
                                <div>
                                    <h5 className="font-poppins font-semibold text-[#151616] mb-2">Common Side Effects:</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {analysis.sideEffects.common.map((effect, idx) => (
                                            <div key={idx} className="p-2 bg-yellow-50 rounded border border-yellow-200">
                                                <div className="flex items-center gap-2">
                                                    <Info className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                                                    <span className="text-sm font-poppins text-[#151616]">{effect}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Serious Side Effects */}
                                {analysis.sideEffects.serious.length > 0 && (
                                    <div>
                                        <h5 className="font-poppins font-semibold text-[#151616] mb-2">Serious Side Effects (Seek immediate medical help):</h5>
                                        <div className="grid grid-cols-1 gap-2">
                                            {analysis.sideEffects.serious.map((effect, idx) => (
                                                <div key={idx} className="p-2 bg-red-50 rounded border border-red-200">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                                        <span className="text-sm font-poppins text-[#151616]">{effect}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Patient-Specific Side Effects */}
                                {analysis.sideEffects.patientSpecific.length > 0 && (
                                    <div>
                                        <h5 className="font-poppins font-semibold text-[#151616] mb-2">Based on your condition:</h5>
                                        <div className="grid grid-cols-1 gap-2">
                                            {analysis.sideEffects.patientSpecific.map((effect, idx) => (
                                                <div key={idx} className="p-2 bg-blue-50 rounded border border-blue-200">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                                        <span className="text-sm font-poppins text-[#151616]">{effect}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Precautions */}
                                {analysis.precautions.length > 0 && (
                                    <div>
                                        <h5 className="font-poppins font-semibold text-[#151616] mb-2">Important Precautions:</h5>
                                        <div className="space-y-2">
                                            {analysis.precautions.map((precaution, idx) => (
                                                <div key={idx} className="p-3 bg-orange-50 rounded border border-orange-200">
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                                        <span className="text-sm font-poppins text-[#151616]">{precaution}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Drug Interactions */}
                        {analysis.interactions.length > 0 && (
                            <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                                <CardHeader>
                                    <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Drug Interactions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {analysis.interactions.map((interaction, idx) => (
                                            <div key={idx} className="p-3 bg-purple-50 rounded border border-purple-200">
                                                <div className="flex items-center gap-2">
                                                    <RefreshCw className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                                    <span className="text-sm font-poppins text-[#151616]">{interaction}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Disclaimer */}
                        <Alert className="border-2 border-orange-500 bg-orange-50">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="font-poppins">
                                <strong>Medical Disclaimer:</strong> This analysis is for informational purposes only and should not replace professional medical advice. Always consult with a healthcare provider before starting, stopping, or changing any medication.
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
