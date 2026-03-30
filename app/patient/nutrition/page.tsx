"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { jsPDF } from "jspdf"
import { 
    FileText, Upload, Send, AlertTriangle, CheckCircle, Apple, 
    Utensils, Heart, Target, Droplets, Moon, Activity, Pill,
    Calendar, ChevronRight, Leaf, Salad, IndianRupee, Clock,
    TrendingUp, Shield, Zap, X, Plus, Minus, Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface NutritionalDeficiency {
    nutrient: string
    currentLevel: string
    normalRange: string
    status: string
    severity: string
    symptoms: string[]
}

interface HealthMarker {
    marker: string
    value: string
    normalRange: string
    status: string
    dietaryImpact: string
    foodsToInclude: string[]
    foodsToAvoid: string[]
}

interface NutritionAnalysis {
    reportSummary: {
        reportType: string
        testDate: string
        overallHealthStatus: string
    }
    nutritionalDeficiencies: NutritionalDeficiency[]
    healthMarkers: HealthMarker[]
    personalizedDietPlan: {
        dailyCalories: string
        macros: {
            protein: string
            carbs: string
            fats: string
            fiber: string
        }
        mealTiming: {
            breakfast: string
            lunch: string
            dinner: string
            snacks: string
        }
    }
    recommendedFoods: {
        byDeficiency: Array<{
            deficiency: string
            vegetarian: string[]
            nonVegetarian: string[]
            supplements: string
        }>
        superfoods: string[]
        herbs: string[]
    }
    mealPlan: {
        weekDays: Array<{
            day: string
            meals: {
                breakfast: string
                lunch: string
                dinner: string
                snacks: string
            }
        }>
        notes: string
    }
    lifestyleRecommendations: {
        exercise: string
        hydration: string
        sleep: string
        stress: string
    }
    foodsToAvoid: {
        strict: string[]
        moderate: string[]
        occasional: string[]
    }
    supplements: Array<{
        name: string
        dosage: string
        timing: string
        reason: string
        duration: string
    }>
    progressTracking: {
        markers: string[]
        frequency: string
        targetValues: string[]
    }
    indianDietOptions: {
        vegetarian: {
            breakfast: string[]
            lunch: string[]
            dinner: string[]
        }
        nonVegetarian: {
            breakfast: string[]
            lunch: string[]
            dinner: string[]
        }
    }
    warnings: string[]
    confidence: number
}

export default function NutritionAIPage() {
    const searchParams = useSearchParams()
    const fromReport = searchParams.get('fromReport')
    
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [additionalInfo, setAdditionalInfo] = useState("")
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [selectedDiet, setSelectedDiet] = useState<"vegetarian" | "nonVegetarian">("vegetarian")
    const [expandedDay, setExpandedDay] = useState<string | null>(null)
    const [isFetchingFromReport, setIsFetchingFromReport] = useState(false)

    // Auto-fetch from saved report if coming from lab-analyzer
    useEffect(() => {
        if (fromReport === 'true') {
            fetchNutritionFromSavedReport()
        }
    }, [fromReport])

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

    const analyzeNutrition = async () => {
        if (!image) {
            setError("Please upload a lab report image")
            return
        }

        setIsAnalyzing(true)
        setError(null)

        try {
            const base64Image = await convertImageToBase64(image)

            const response = await fetch('/api/nutrition/analyze', {
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
                throw new Error('Failed to analyze lab report')
            }

            const result = await response.json()
            setAnalysis(result)
        } catch (error) {
            console.error('Error analyzing nutrition:', error)
            setError('Failed to analyze lab report. Please try again.')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const fetchNutritionFromSavedReport = async () => {
        setIsFetchingFromReport(true)
        setError(null)

        try {
            const response = await fetch('/api/nutrition/fromreport', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    additionalContext: additionalInfo.trim()
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch nutrition from saved report')
            }

            const result = await response.json()
            
            // Validate the response has required fields
            if (result.error) {
                throw new Error(result.error)
            }
            
            if (!result.reportSummary) {
                throw new Error('Invalid response from server. Please try again.')
            }
            
            setAnalysis(result)
        } catch (error) {
            console.error('Error fetching nutrition from report:', error)
            setError(error instanceof Error ? error.message : 'Failed to fetch nutrition from saved report. Please analyze a lab report first.')
        } finally {
            setIsFetchingFromReport(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "normal": return "bg-green-500 text-white"
            case "high": return "bg-yellow-500 text-[#151616]"
            case "low": return "bg-blue-500 text-white"
            case "deficient": return "bg-red-500 text-white"
            case "severe": return "bg-red-600 text-white"
            case "moderate": return "bg-orange-500 text-white"
            case "mild": return "bg-yellow-400 text-[#151616]"
            default: return "bg-gray-500 text-white"
        }
    }

    const getHealthStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "good": return "bg-green-100 border-green-500 text-green-700"
            case "fair": return "bg-yellow-100 border-yellow-500 text-yellow-700"
            case "needs attention": return "bg-red-100 border-red-500 text-red-700"
            default: return "bg-gray-100 border-gray-500 text-gray-700"
        }
    }

    const downloadNutritionReport = () => {
        if (!analysis) return

        const formatList = (items: string[]) => (items.length > 0 ? items.join(", ") : "N/A")

        const today = new Date().toLocaleString()
        const filename = `nutrition-report-${new Date().toISOString().split("T")[0]}.pdf`

        const COLOR_HEADER_BG = [249, 200, 14] as const
        const COLOR_TEXT = [21, 22, 22] as const
        const COLOR_MUTED = [99, 101, 103] as const
        const COLOR_SECTION_BG = [255, 248, 220] as const
        const COLOR_SECTION = [180, 83, 9] as const
        const COLOR_OK = [22, 163, 74] as const
        const COLOR_WARN = [202, 138, 4] as const
        const COLOR_BAD = [220, 38, 38] as const

        const formatDeficiencyLine = (d: NutritionalDeficiency) =>
            `${d.nutrient}: ${d.status} (${d.severity}) | Current: ${d.currentLevel} | Normal: ${d.normalRange}`

        const doc = new jsPDF({
            orientation: "p",
            unit: "mm",
            format: "a4"
        })

        const marginLeft = 14
        const marginTop = 14
        const marginBottom = 14
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const maxLineWidth = pageWidth - marginLeft * 2

        const lineHeight = 6
        const smallLineHeight = 5.2
        let y = marginTop

        const addPageIfNeeded = (requiredHeight: number) => {
            if (y + requiredHeight > pageHeight - marginBottom) {
                doc.addPage()
                y = marginTop
                drawPageDecor(false)
            }
        }

        const drawPageDecor = (firstPage: boolean) => {
            doc.setDrawColor(...COLOR_HEADER_BG)
            doc.setLineWidth(0.5)
            doc.line(marginLeft, pageHeight - 10, pageWidth - marginLeft, pageHeight - 10)
            doc.setFont("helvetica", "normal")
            doc.setFontSize(8.5)
            doc.setTextColor(...COLOR_MUTED)
            doc.text("Nutrition AI - Personalized Health Report", marginLeft, pageHeight - 6)

            if (!firstPage) {
                doc.setFont("helvetica", "bold")
                doc.setFontSize(12)
                doc.setTextColor(...COLOR_SECTION)
                doc.text("Nutrition Report (cont.)", marginLeft, marginTop + 2)
                y = marginTop + 8
            }
        }

        const addHeader = () => {
            doc.setFillColor(...COLOR_HEADER_BG)
            doc.roundedRect(marginLeft - 1, y, maxLineWidth + 2, 24, 2, 2, "F")
            doc.setTextColor(...COLOR_TEXT)
            doc.setFont("helvetica", "bold")
            doc.setFontSize(20)
            doc.text("Nutrition AI Report", marginLeft + 2, y + 9)
            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            doc.text(`Generated on: ${today}`, marginLeft + 2, y + 15)
            doc.text(`Prepared for: ${analysis.reportSummary.reportType}`, marginLeft + 2, y + 20)
            y += 30
        }

        const addSectionTitle = (title: string) => {
            addPageIfNeeded(15)
            doc.setFillColor(...COLOR_SECTION_BG)
            doc.roundedRect(marginLeft - 1, y - 4.5, maxLineWidth + 2, 9, 1.5, 1.5, "F")
            doc.setFont("helvetica", "bold")
            doc.setTextColor(...COLOR_SECTION)
            doc.setFontSize(13)
            doc.text(title, marginLeft + 1, y + 1.5)
            doc.setTextColor(...COLOR_TEXT)
            y += 9
            doc.setFontSize(11)
            doc.setFont("helvetica", "normal")
        }

        const addWrappedText = (text: string, fontSize = 11, heightMultiplier = 1) => {
            const lines = doc.splitTextToSize(text, maxLineWidth)
            lines.forEach((line: string) => {
                addPageIfNeeded(lineHeight * heightMultiplier)
                doc.setFontSize(fontSize)
                doc.text(line, marginLeft, y)
                y += lineHeight * heightMultiplier
            })
        }

        const addList = (items: string[], bullet = "•", opts?: { color?: [number, number, number]; fontSize?: number }) => {
            const chosenColor = opts?.color ?? (COLOR_TEXT as unknown as [number, number, number])
            const fontSize = opts?.fontSize ?? 11
            doc.setTextColor(...chosenColor)
            items.forEach((item) => {
                const wrapped = doc.splitTextToSize(`${bullet} ${item}`, maxLineWidth)
                wrapped.forEach((line: string, idx: number) => {
                    addPageIfNeeded(smallLineHeight)
                    doc.setFontSize(fontSize)
                    doc.text(line, marginLeft, y)
                    y += smallLineHeight
                })
            })
            doc.setTextColor(...COLOR_TEXT)
            y += 1
        }

        const addKVRow = (label: string, value: string) => {
            addPageIfNeeded(6)
            doc.setFont("helvetica", "bold")
            doc.setFontSize(10.5)
            doc.text(`${label}:`, marginLeft, y)
            doc.setFont("helvetica", "normal")
            const valueLines = doc.splitTextToSize(value || "N/A", maxLineWidth - 35)
            doc.text(valueLines, marginLeft + 35, y)
            y += Math.max(6, valueLines.length * 5)
        }

        drawPageDecor(true)
        addHeader()

        addSectionTitle("Report Summary")
        addKVRow("Report Type", analysis.reportSummary.reportType)
        addKVRow("Test Date", analysis.reportSummary.testDate)
        addKVRow("Overall Health Status", analysis.reportSummary.overallHealthStatus)
        addKVRow("Confidence", `${analysis.confidence}%`)

        addSectionTitle("Personalized Diet Plan")
        addKVRow("Daily Calories", `${analysis.personalizedDietPlan.dailyCalories} kcal`)
        addKVRow("Protein", analysis.personalizedDietPlan.macros.protein)
        addKVRow("Carbs", analysis.personalizedDietPlan.macros.carbs)
        addKVRow("Fats", analysis.personalizedDietPlan.macros.fats)
        addKVRow("Fiber", analysis.personalizedDietPlan.macros.fiber)

        addSectionTitle("Meal Timing")
        addKVRow("Breakfast", analysis.personalizedDietPlan.mealTiming.breakfast)
        addKVRow("Lunch", analysis.personalizedDietPlan.mealTiming.lunch)
        addKVRow("Dinner", analysis.personalizedDietPlan.mealTiming.dinner)
        addKVRow("Snacks", analysis.personalizedDietPlan.mealTiming.snacks)

        addSectionTitle("Nutritional Deficiencies")
        if (analysis.nutritionalDeficiencies.length > 0) {
            analysis.nutritionalDeficiencies.forEach((d) => {
                const sev = d.severity.toLowerCase()
                const chosen =
                    sev.includes("severe") || sev.includes("critical") ? COLOR_BAD : sev.includes("moderate") ? COLOR_WARN : COLOR_OK
                addList([formatDeficiencyLine(d)], "•", { color: chosen as [number, number, number], fontSize: 10.2 })
                if (d.symptoms.length > 0) {
                    addList([`Symptoms: ${d.symptoms.join(", ")}`], "-", { color: COLOR_MUTED as [number, number, number], fontSize: 9.8 })
                }
            })
        } else {
            addWrappedText("No deficiencies detected.")
        }

        addSectionTitle("Health Markers Analysis")
        if (analysis.healthMarkers.length > 0) {
            analysis.healthMarkers.forEach((marker) => {
                addList(
                    [
                        `${marker.marker}: ${marker.value} (Normal: ${marker.normalRange}, Status: ${marker.status})`,
                        `Dietary Impact: ${marker.dietaryImpact}`,
                        `Foods to Include: ${formatList(marker.foodsToInclude)}`,
                        `Foods to Avoid: ${formatList(marker.foodsToAvoid)}`
                    ],
                    "•",
                    { color: COLOR_TEXT as [number, number, number], fontSize: 10.2 }
                )
            })
        } else {
            addWrappedText("No health markers available.")
        }

        addSectionTitle("Indian Diet Options - Vegetarian")
        addList(
            [
                `Breakfast: ${formatList(analysis.indianDietOptions.vegetarian.breakfast)}`,
                `Lunch: ${formatList(analysis.indianDietOptions.vegetarian.lunch)}`,
                `Dinner: ${formatList(analysis.indianDietOptions.vegetarian.dinner)}`
            ],
            "•",
            { color: COLOR_OK as [number, number, number] }
        )

        addSectionTitle("Indian Diet Options - Non-Vegetarian")
        addList(
            [
                `Breakfast: ${formatList(analysis.indianDietOptions.nonVegetarian.breakfast)}`,
                `Lunch: ${formatList(analysis.indianDietOptions.nonVegetarian.lunch)}`,
                `Dinner: ${formatList(analysis.indianDietOptions.nonVegetarian.dinner)}`
            ],
            "•",
            { color: COLOR_TEXT as [number, number, number] }
        )

        addSectionTitle("Recommended Foods")
        addList(
            [
                `Superfoods: ${formatList(analysis.recommendedFoods.superfoods)}`,
                `Beneficial Herbs & Spices: ${formatList(analysis.recommendedFoods.herbs)}`
            ],
            "•",
            { color: COLOR_OK as [number, number, number] }
        )
        if (analysis.recommendedFoods.byDeficiency.length > 0) {
            analysis.recommendedFoods.byDeficiency.forEach((item) => {
                addList(
                    [
                        `${item.deficiency}`,
                        `Vegetarian Sources: ${formatList(item.vegetarian)}`,
                        `Non-Veg Sources: ${formatList(item.nonVegetarian)}`,
                        `Supplements: ${item.supplements || "N/A"}`
                    ],
                    "-",
                    { color: COLOR_TEXT as [number, number, number], fontSize: 10.2 }
                )
            })
        }

        addSectionTitle("Foods To Avoid")
        addList(
            [
                `Strict: ${formatList(analysis.foodsToAvoid.strict)}`,
                `Moderate: ${formatList(analysis.foodsToAvoid.moderate)}`,
                `Occasional: ${formatList(analysis.foodsToAvoid.occasional)}`
            ],
            "•",
            { color: COLOR_BAD as [number, number, number] }
        )

        addSectionTitle("Recommended Supplements")
        if (analysis.supplements.length > 0) {
            analysis.supplements.forEach((supplement) => {
                addList(
                    [
                        `${supplement.name}`,
                        `Dosage: ${supplement.dosage}`,
                        `Timing: ${supplement.timing}`,
                        `Duration: ${supplement.duration}`,
                        `Reason: ${supplement.reason}`
                    ],
                    "-",
                    { color: COLOR_TEXT as [number, number, number], fontSize: 10.2 }
                )
            })
        } else {
            addWrappedText("No supplements recommended.")
        }

        addSectionTitle("Lifestyle Recommendations")
        addList(
            [
                `Exercise: ${analysis.lifestyleRecommendations.exercise}`,
                `Hydration: ${analysis.lifestyleRecommendations.hydration}`,
                `Sleep: ${analysis.lifestyleRecommendations.sleep}`,
                `Stress Management: ${analysis.lifestyleRecommendations.stress}`
            ],
            "•",
            { color: COLOR_TEXT as [number, number, number] }
        )

        addSectionTitle("Progress Tracking")
        addList(
            [
                `Markers: ${formatList(analysis.progressTracking.markers)}`,
                `Frequency: ${analysis.progressTracking.frequency || "As recommended by your doctor"}`,
                `Targets: ${formatList(analysis.progressTracking.targetValues)}`
            ],
            "•",
            { color: COLOR_TEXT as [number, number, number] }
        )

        addSectionTitle("Warnings")
        if (analysis.warnings.length > 0) {
            addList(analysis.warnings, "•", { color: COLOR_WARN as [number, number, number] })
        } else {
            addWrappedText("No warnings provided.")
        }

        addSectionTitle("Medical Disclaimer")
        doc.setTextColor(...COLOR_MUTED)
        addWrappedText(
            "This AI nutrition analysis is for informational purposes only and should not replace professional medical or nutritional advice. Always consult with a qualified healthcare provider or registered dietitian before making significant dietary changes or starting any supplement regimen.",
            10.5,
            1
        )
        doc.setTextColor(...COLOR_TEXT)

        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFont("helvetica", "normal")
            doc.setFontSize(8.5)
            doc.setTextColor(...COLOR_MUTED)
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginLeft, pageHeight - 6, { align: "right" })
        }

        doc.save(filename)
    }

    return (
        <div className="min-h-screen bg-[#FFFFF4] p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Apple className="w-12 h-12 text-[#f9c80e]" />
                        <h1 className="text-4xl font-instrument-serif font-bold text-[#151616]">
                            Nutrition AI
                        </h1>
                    </div>
                    <p className="text-xl text-[#151616]/70 font-poppins max-w-3xl mx-auto">
                        Upload your lab reports and get personalized nutrition recommendations based on your health markers
                    </p>
                </motion.div>

                {/* Loading from saved report */}
                {isFetchingFromReport && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 border-4 border-[#f9c80e] border-t-transparent rounded-full mx-auto mb-4"
                        />
                        <h3 className="text-xl font-poppins font-semibold text-[#151616] mb-2">
                            Fetching your saved lab report...
                        </h3>
                        <p className="text-[#151616]/70 font-poppins">
                            Generating personalized nutrition recommendations
                        </p>
                    </motion.div>
                )}

                {/* Upload Section */}
                {!isFetchingFromReport && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                        <CardHeader>
                            <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Upload Lab Report
                            </CardTitle>
                            <CardDescription className="font-poppins">
                                Upload blood test or other medical reports for nutrition analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Use Saved Report Button */}
                            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <p className="font-poppins font-medium text-green-800">
                                            Already analyzed a lab report?
                                        </p>
                                        <p className="text-sm font-poppins text-green-600">
                                            Use your saved lab report to get nutrition recommendations
                                        </p>
                                    </div>
                                    <Button
                                        onClick={fetchNutritionFromSavedReport}
                                        variant="outline"
                                        className="border-2 border-green-600 text-green-700 hover:bg-green-100 font-poppins font-medium"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Use Saved Report
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-[#151616]/20" />
                                <span className="text-sm font-poppins text-[#151616]/50">OR</span>
                                <div className="flex-1 h-px bg-[#151616]/20" />
                            </div>

                            {/* Image Upload */}
                            <div className="border-2 border-dashed border-[#151616] rounded-xl p-8 text-center">
                                {imagePreview ? (
                                    <div className="space-y-4">
                                        <img
                                            src={imagePreview}
                                            alt="Lab report preview"
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
                                                Upload Lab Report
                                            </p>
                                            <p className="text-sm font-poppins text-[#151616]/70 mb-4">
                                                PNG, JPG up to 10MB
                                            </p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                id="nutrition-report-upload"
                                            />
                                            <label htmlFor="nutrition-report-upload">
                                                <Button
                                                    asChild
                                                    className="bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] font-poppins font-bold"
                                                >
                                                    <span className="cursor-pointer">
                                                        Choose Report
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
                                    Additional Context (Optional)
                                </label>
                                <Textarea
                                    placeholder="Enter your age, gender, dietary preferences (vegetarian/non-vegetarian), allergies, medical conditions, medications..."
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
                                onClick={analyzeNutrition}
                                disabled={!image || isAnalyzing}
                                className="w-full bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] disabled:opacity-50 disabled:cursor-not-allowed font-poppins font-bold text-lg py-6"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-[#151616] border-t-transparent rounded-full mr-2"
                                        />
                                        Analyzing Nutrition...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 mr-2" />
                                        Get Nutrition Recommendations
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
                )}

                {/* Analysis Results */}
                {analysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6"
                    >
                        {/* Report Summary */}
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Report Summary
                                </CardTitle>
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="bg-[#f9c80e] text-[#151616] font-poppins">
                                        {analysis.reportSummary.reportType}
                                    </Badge>
                                    <Badge variant="outline" className="border-[#151616] font-poppins">
                                        {analysis.reportSummary.testDate}
                                    </Badge>
                                    <Badge className={`${getHealthStatusColor(analysis.reportSummary.overallHealthStatus)} font-poppins`}>
                                        {analysis.reportSummary.overallHealthStatus}
                                    </Badge>
                                    <Badge className="bg-green-500 text-white font-poppins">
                                        {analysis.confidence}% Confidence
                                    </Badge>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Nutritional Deficiencies */}
                        {analysis.nutritionalDeficiencies.length > 0 && (
                            <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                                <CardHeader>
                                    <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                                        Nutritional Deficiencies Detected
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {analysis.nutritionalDeficiencies.map((deficiency, idx) => (
                                            <div key={idx} className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="font-poppins font-semibold text-[#151616]">
                                                        {deficiency.nutrient}
                                                    </h5>
                                                    <div className="flex gap-2">
                                                        <Badge className={`font-poppins text-xs ${getStatusColor(deficiency.status)}`}>
                                                            {deficiency.status}
                                                        </Badge>
                                                        <Badge className={`font-poppins text-xs ${getStatusColor(deficiency.severity)}`}>
                                                            {deficiency.severity}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                                    <div>
                                                        <p className="text-xs text-[#151616]/60">Your Level</p>
                                                        <p className="font-poppins font-medium">{deficiency.currentLevel}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-[#151616]/60">Normal Range</p>
                                                        <p className="font-poppins font-medium">{deficiency.normalRange}</p>
                                                    </div>
                                                </div>
                                                {deficiency.symptoms.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-[#151616]/60 mb-1">Possible Symptoms:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {deficiency.symptoms.map((symptom, sIdx) => (
                                                                <Badge key={sIdx} variant="outline" className="text-xs border-orange-300">
                                                                    {symptom}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Health Markers */}
                        {analysis.healthMarkers.length > 0 && (
                            <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                                <CardHeader>
                                    <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                        <Activity className="w-5 h-5" />
                                        Health Markers Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {analysis.healthMarkers.map((marker, idx) => (
                                            <div key={idx} className="p-4 bg-[#FFFFF4] rounded-xl border border-[#151616]/20">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="font-poppins font-semibold text-[#151616]">
                                                        {marker.marker}
                                                    </h5>
                                                    <Badge className={`font-poppins ${getStatusColor(marker.status)}`}>
                                                        {marker.status}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                                                    <div>
                                                        <p className="text-xs text-[#151616]/60">Your Value</p>
                                                        <p className="font-poppins font-medium">{marker.value}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-[#151616]/60">Normal Range</p>
                                                        <p className="font-poppins font-medium">{marker.normalRange}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-[#151616]/80 mb-2">
                                                    <strong>Dietary Impact:</strong> {marker.dietaryImpact}
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    <div className="p-2 bg-green-50 rounded border border-green-200">
                                                        <p className="text-xs text-green-700 font-medium mb-1">Foods to Include:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {marker.foodsToInclude.map((food, fIdx) => (
                                                                <Badge key={fIdx} className="bg-green-100 text-green-700 text-xs">
                                                                    {food}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="p-2 bg-red-50 rounded border border-red-200">
                                                        <p className="text-xs text-red-700 font-medium mb-1">Foods to Avoid:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {marker.foodsToAvoid.map((food, fIdx) => (
                                                                <Badge key={fIdx} className="bg-red-100 text-red-700 text-xs">
                                                                    {food}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Personalized Diet Plan */}
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                    <Utensils className="w-5 h-5" />
                                    Personalized Diet Plan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Daily Targets */}
                                    <div className="p-4 bg-[#f9c80e]/10 rounded-xl border border-[#f9c80e]">
                                        <h5 className="font-poppins font-semibold text-[#151616] mb-3 flex items-center gap-2">
                                            <Target className="w-4 h-4" />
                                            Daily Targets
                                        </h5>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-poppins text-[#151616]">Calories</span>
                                                <Badge className="bg-[#f9c80e] text-[#151616]">{analysis.personalizedDietPlan.dailyCalories} kcal</Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-poppins text-[#151616]">Protein</span>
                                                <Badge variant="outline" className="border-[#151616]">{analysis.personalizedDietPlan.macros.protein}</Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-poppins text-[#151616]">Carbs</span>
                                                <Badge variant="outline" className="border-[#151616]">{analysis.personalizedDietPlan.macros.carbs}</Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-poppins text-[#151616]">Fats</span>
                                                <Badge variant="outline" className="border-[#151616]">{analysis.personalizedDietPlan.macros.fats}</Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-poppins text-[#151616]">Fiber</span>
                                                <Badge variant="outline" className="border-[#151616]">{analysis.personalizedDietPlan.macros.fiber}</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meal Timing */}
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                        <h5 className="font-poppins font-semibold text-[#151616] mb-3 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Meal Timing
                                        </h5>
                                        <div className="space-y-2 text-sm">
                                            <p><strong>Breakfast:</strong> {analysis.personalizedDietPlan.mealTiming.breakfast}</p>
                                            <p><strong>Lunch:</strong> {analysis.personalizedDietPlan.mealTiming.lunch}</p>
                                            <p><strong>Dinner:</strong> {analysis.personalizedDietPlan.mealTiming.dinner}</p>
                                            <p><strong>Snacks:</strong> {analysis.personalizedDietPlan.mealTiming.snacks}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Indian Diet Options */}
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                    <Salad className="w-5 h-5" />
                                    Indian Diet Options
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs
                                    value={selectedDiet}
                                    onValueChange={(v) => setSelectedDiet(v as "vegetarian" | "nonVegetarian")}
                                    className="flex-col"
                                >
                                    <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 rounded-xl p-1">
                                        <TabsTrigger 
                                            value="vegetarian" 
                                            className="font-poppins data-[state=active]:bg-[#f9c80e] data-[state=active]:text-[#151616] data-[state=active]:shadow-md rounded-lg h-10 px-4 transition-all"
                                        >
                                            <Leaf className="w-4 h-4 mr-2" />
                                            Vegetarian
                                        </TabsTrigger>
                                        <TabsTrigger 
                                            value="nonVegetarian" 
                                            className="font-poppins data-[state=active]:bg-[#f9c80e] data-[state=active]:text-[#151616] data-[state=active]:shadow-md rounded-lg h-10 px-4 transition-all"
                                        >
                                            <Utensils className="w-4 h-4 mr-2" />
                                            Non-Vegetarian
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="vegetarian" className="mt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                                                <h6 className="font-poppins font-semibold text-green-700 mb-2">Breakfast</h6>
                                                <ul className="space-y-1">
                                                    {analysis.indianDietOptions.vegetarian.breakfast.map((item, idx) => (
                                                        <li key={idx} className="text-sm font-poppins text-[#151616] flex items-center gap-1">
                                                            <ChevronRight className="w-3 h-3" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                                                <h6 className="font-poppins font-semibold text-yellow-700 mb-2">Lunch</h6>
                                                <ul className="space-y-1">
                                                    {analysis.indianDietOptions.vegetarian.lunch.map((item, idx) => (
                                                        <li key={idx} className="text-sm font-poppins text-[#151616] flex items-center gap-1">
                                                            <ChevronRight className="w-3 h-3" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                                                <h6 className="font-poppins font-semibold text-orange-700 mb-2">Dinner</h6>
                                                <ul className="space-y-1">
                                                    {analysis.indianDietOptions.vegetarian.dinner.map((item, idx) => (
                                                        <li key={idx} className="text-sm font-poppins text-[#151616] flex items-center gap-1">
                                                            <ChevronRight className="w-3 h-3" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="nonVegetarian" className="mt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                                                <h6 className="font-poppins font-semibold text-red-700 mb-2">Breakfast</h6>
                                                <ul className="space-y-1">
                                                    {analysis.indianDietOptions.nonVegetarian.breakfast.map((item, idx) => (
                                                        <li key={idx} className="text-sm font-poppins text-[#151616] flex items-center gap-1">
                                                            <ChevronRight className="w-3 h-3" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                                                <h6 className="font-poppins font-semibold text-amber-700 mb-2">Lunch</h6>
                                                <ul className="space-y-1">
                                                    {analysis.indianDietOptions.nonVegetarian.lunch.map((item, idx) => (
                                                        <li key={idx} className="text-sm font-poppins text-[#151616] flex items-center gap-1">
                                                            <ChevronRight className="w-3 h-3" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                                                <h6 className="font-poppins font-semibold text-purple-700 mb-2">Dinner</h6>
                                                <ul className="space-y-1">
                                                    {analysis.indianDietOptions.nonVegetarian.dinner.map((item, idx) => (
                                                        <li key={idx} className="text-sm font-poppins text-[#151616] flex items-center gap-1">
                                                            <ChevronRight className="w-3 h-3" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>

                        {/* Recommended Foods */}
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                    <Apple className="w-5 h-5" />
                                    Recommended Foods
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Superfoods */}
                                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                                        <h5 className="font-poppins font-semibold text-purple-700 mb-2">Superfoods for You</h5>
                                        {analysis.recommendedFoods.superfoods.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.recommendedFoods.superfoods.map((food, idx) => (
                                                    <Badge key={idx} className="bg-purple-100 text-purple-700">
                                                        {food}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-[#151616]/60">No specific superfoods recommended</p>
                                        )}
                                    </div>
                                    {/* Herbs & Spices */}
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                        <h5 className="font-poppins font-semibold text-green-700 mb-2">Beneficial Herbs & Spices</h5>
                                        {analysis.recommendedFoods.herbs.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.recommendedFoods.herbs.map((herb, idx) => (
                                                    <Badge key={idx} className="bg-green-100 text-green-700">
                                                        {herb}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-[#151616]/60">No specific herbs recommended</p>
                                        )}
                                    </div>
                                </div>

                                {/* Foods by Deficiency */}
                                {analysis.recommendedFoods.byDeficiency.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                        {analysis.recommendedFoods.byDeficiency.map((item, idx) => (
                                            <div key={idx} className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                                <h6 className="font-poppins font-semibold text-blue-700 mb-2">{item.deficiency}</h6>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <p className="text-green-600 font-medium">Vegetarian Sources:</p>
                                                        <p>{item.vegetarian.join(", ")}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-red-600 font-medium">Non-Veg Sources:</p>
                                                        <p>{item.nonVegetarian.join(", ")}</p>
                                                    </div>
                                                </div>
                                                {item.supplements && (
                                                    <p className="mt-2 text-sm text-blue-600">
                                                        <strong>Supplements:</strong> {item.supplements}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Foods to Avoid */}
                        <Card className="border-2 border-red-500 shadow-[4px_4px_0px_0px_red-500]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-red-700 flex items-center gap-2">
                                    <X className="w-5 h-5" />
                                    Foods to Avoid
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-3 bg-red-100 rounded-xl border border-red-300">
                                        <h6 className="font-poppins font-semibold text-red-700 mb-2 flex items-center gap-1">
                                            <X className="w-3 h-3" /> Strict Avoid
                                        </h6>
                                        {analysis.foodsToAvoid.strict.length > 0 ? (
                                            <ul className="space-y-1">
                                                {analysis.foodsToAvoid.strict.map((food, idx) => (
                                                    <li key={idx} className="text-sm text-red-800">• {food}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-red-600 mt-2">No foods to strictly avoid</p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-orange-100 rounded-xl border border-orange-300">
                                        <h6 className="font-poppins font-semibold text-orange-700 mb-2 flex items-center gap-1">
                                            <Minus className="w-3 h-3" /> Limit Consumption
                                        </h6>
                                        {analysis.foodsToAvoid.moderate.length > 0 ? (
                                            <ul className="space-y-1">
                                                {analysis.foodsToAvoid.moderate.map((food, idx) => (
                                                    <li key={idx} className="text-sm text-orange-800">• {food}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-orange-600 mt-2">No foods to limit</p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-yellow-100 rounded-xl border border-yellow-300">
                                        <h6 className="font-poppins font-semibold text-yellow-700 mb-2 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Occasional
                                        </h6>
                                        {analysis.foodsToAvoid.occasional.length > 0 ? (
                                            <ul className="space-y-1">
                                                {analysis.foodsToAvoid.occasional.map((food, idx) => (
                                                    <li key={idx} className="text-sm text-yellow-800">• {food}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-yellow-600 mt-2">No occasional restrictions</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Supplements */}
                        {analysis.supplements.length > 0 && (
                            <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                                <CardHeader>
                                    <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                        <Pill className="w-5 h-5" />
                                        Recommended Supplements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {analysis.supplements.map((supplement, idx) => (
                                            <div key={idx} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                <h5 className="font-poppins font-semibold text-blue-700 mb-2">{supplement.name}</h5>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <p className="text-blue-600 font-medium">Dosage:</p>
                                                        <p>{supplement.dosage}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-600 font-medium">Timing:</p>
                                                        <p>{supplement.timing}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-600 font-medium">Duration:</p>
                                                        <p>{supplement.duration}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-2 text-sm text-blue-800">
                                                    <strong>Why:</strong> {supplement.reason}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Lifestyle Recommendations */}
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                    <Heart className="w-5 h-5" />
                                    Lifestyle Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Activity className="w-4 h-4 text-orange-600" />
                                            <h6 className="font-poppins font-semibold text-orange-700">Exercise</h6>
                                        </div>
                                        <p className="text-sm text-[#151616]">{analysis.lifestyleRecommendations.exercise}</p>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Droplets className="w-4 h-4 text-blue-600" />
                                            <h6 className="font-poppins font-semibold text-blue-700">Hydration</h6>
                                        </div>
                                        <p className="text-sm text-[#151616]">{analysis.lifestyleRecommendations.hydration}</p>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Moon className="w-4 h-4 text-purple-600" />
                                            <h6 className="font-poppins font-semibold text-purple-700">Sleep</h6>
                                        </div>
                                        <p className="text-sm text-[#151616]">{analysis.lifestyleRecommendations.sleep}</p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="w-4 h-4 text-green-600" />
                                            <h6 className="font-poppins font-semibold text-green-700">Stress Management</h6>
                                        </div>
                                        <p className="text-sm text-[#151616]">{analysis.lifestyleRecommendations.stress}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Progress Tracking */}
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    Progress Tracking
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                                        <h6 className="font-poppins font-semibold text-green-700 mb-2">Markers to Monitor</h6>
                                        {analysis.progressTracking.markers.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {analysis.progressTracking.markers.map((marker, idx) => (
                                                    <Badge key={idx} className="bg-green-100 text-green-700 text-xs">
                                                        {marker}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-green-600">No specific markers to monitor</p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                        <h6 className="font-poppins font-semibold text-blue-700 mb-2">Retest Frequency</h6>
                                        <p className="text-sm text-[#151616]">{analysis.progressTracking.frequency || "As recommended by your doctor"}</p>
                                    </div>
                                    <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                                        <h6 className="font-poppins font-semibold text-yellow-700 mb-2">Target Values</h6>
                                        {analysis.progressTracking.targetValues.length > 0 ? (
                                            <ul className="space-y-1">
                                                {analysis.progressTracking.targetValues.map((target, idx) => (
                                                    <li key={idx} className="text-sm text-[#151616]">• {target}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-yellow-600">Consult your doctor for target values</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Warnings */}
                        {analysis.warnings.length > 0 && (
                            <Alert className="border-2 border-orange-500 bg-orange-50">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="font-poppins">
                                    <strong>Important Warnings:</strong>
                                    <ul className="mt-2 space-y-1">
                                        {analysis.warnings.map((warning, idx) => (
                                            <li key={idx}>• {warning}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Disclaimer */}
                        <Alert className="border-2 border-blue-500 bg-blue-50">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="font-poppins">
                                <strong>Medical Disclaimer:</strong> This AI nutrition analysis is for informational purposes only and should not replace professional medical or nutritional advice. Always consult with a qualified healthcare provider or registered dietitian before making significant dietary changes or starting any supplement regimen.
                            </AlertDescription>
                        </Alert>

                        <div className="flex justify-center">
                            <Button
                                onClick={downloadNutritionReport}
                                className="bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] font-poppins font-bold"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download Nutrition Report
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
