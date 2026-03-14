"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Brain, FileText, Loader2, Send, User, Database, TrendingUp, Shield, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface AgentResult {
    agentName: string
    agentType: "symptom-analysis" | "literature-research" | "health-database" | "case-history" | "risk-assessment" | "decision-aggregator"
    result: any
    status: "idle" | "processing" | "completed" | "error"
    processingTime?: number
}

export default function TestKaustubhPage() {
    const [symptoms, setSymptoms] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [agentResults, setAgentResults] = useState<AgentResult[]>([])
    const [currentStep, setCurrentStep] = useState(0)
    const [logs, setLogs] = useState<string[]>([])

    const agents = [
        {
            name: "Analytica",
            type: "symptom-analysis" as const,
            description: "Analyzes and structures patient symptoms",
            icon: Brain,
            color: "#D6F32F"
        },
        {
            name: "ResearchBot",
            type: "literature-research" as const,
            description: "Searches medical literature for matching conditions",
            icon: FileText,
            color: "#151616"
        },
        {
            name: "EpiWatch",
            type: "health-database" as const,
            description: "Monitors health databases and epidemiological trends",
            icon: Database,
            color: "#D6F32F"
        },
        {
            name: "PatternSeeker",
            type: "case-history" as const,
            description: "Analyzes case history patterns and similarities",
            icon: TrendingUp,
            color: "#151616"
        },
        {
            name: "RiskAnalyzer",
            type: "risk-assessment" as const,
            description: "Calculates risk factors based on patient demographics and history",
            icon: Shield,
            color: "#D6F32F"
        },
        {
            name: "Coordinator",
            type: "decision-aggregator" as const,
            description: "Aggregates all agent data to provide final diagnosis recommendations",
            icon: Target,
            color: "#151616"
        }
    ]

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString()
        setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    }

    const processSymptoms = async () => {
        if (!symptoms.trim()) return

        setIsProcessing(true)
        setAgentResults([])
        setCurrentStep(0)
        setLogs([])

        addLog("🚀 Starting AI Agent Orchestration...")
        addLog("📝 Input received: " + symptoms.substring(0, 50) + "...")

        try {
            // Initialize agent results
            const initialResults = agents.map(agent => ({
                agentName: agent.name,
                agentType: agent.type,
                result: null,
                status: "idle" as const
            }))
            setAgentResults(initialResults)
            addLog("🤖 Initialized 6 AI agents: Analytica, ResearchBot, EpiWatch, PatternSeeker, RiskAnalyzer, Coordinator")

            // Process with Analytica (Symptom Analysis Agent)
            setCurrentStep(1)
            addLog("🔍 Agent 1: Analytica - Starting symptom analysis...")
            setAgentResults(prev => prev.map(result =>
                result.agentName === "Analytica"
                    ? { ...result, status: "processing" }
                    : result
            ))

            const analyticaStartTime = Date.now()
            const analyticaResponse = await fetch('/api/agents/analytica', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms })
            })
            const analyticaResult = await analyticaResponse.json()
            const analyticaTime = Date.now() - analyticaStartTime

            addLog(`✅ Agent 1: Analytica - Completed in ${analyticaTime}ms`)
            addLog(`📊 Structured ${analyticaResult.structuredSymptoms?.length || 0} symptoms`)
            addLog(`Response of AI 1:`)
            addLog(`🔍 Symptom Analysis Results:`)
            if (analyticaResult.structuredSymptoms) {
                addLog(`📋 Structured Symptoms: ${analyticaResult.structuredSymptoms.join(', ')}`)
            }
            if (analyticaResult.categories) {
                addLog(`🏷️ Categories: ${analyticaResult.categories.join(', ')}`)
            }
            if (analyticaResult.severity) {
                addLog(`⚠️ Severity Assessment: ${analyticaResult.severity.substring(0, 100)}...`)
            }

            setAgentResults(prev => prev.map(result =>
                result.agentName === "Analytica"
                    ? {
                        ...result,
                        result: analyticaResult,
                        status: "completed",
                        processingTime: analyticaTime
                    }
                    : result
            ))

            // Process with ResearchBot (Medical Literature Agent)
            setCurrentStep(2)
            addLog("📚 Agent 2: ResearchBot - Searching medical literature...")
            setAgentResults(prev => prev.map(result =>
                result.agentName === "ResearchBot"
                    ? { ...result, status: "processing" }
                    : result
            ))

            const researchStartTime = Date.now()
            const researchResponse = await fetch('/api/agents/research-bot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    structuredSymptoms: analyticaResult.structuredSymptoms,
                    originalSymptoms: symptoms
                })
            })
            const researchResult = await researchResponse.json()
            const researchTime = Date.now() - researchStartTime

            addLog(`✅ Agent 2: ResearchBot - Completed in ${researchTime}ms`)
            addLog(`🔬 Found ${researchResult.possibleConditions?.length || 0} possible conditions`)
            addLog(`Response of AI 2:`)
            addLog(`📚 Literature Research Results:`)
            if (researchResult.possibleConditions) {
                addLog(`🔬 Possible Conditions Found: ${researchResult.possibleConditions.length}`)
                researchResult.possibleConditions.slice(0, 3).forEach((condition: any, idx: number) => {
                    addLog(`   ${idx + 1}. ${condition.name} - ${condition.likelihood}% likelihood`)
                })
            }
            if (researchResult.recommendedTests) {
                addLog(`🧪 Recommended Tests:`)
                researchResult.recommendedTests.slice(0, 2).forEach((test: any, idx: number) => {
                    addLog(`   ${idx + 1}. ${test.substring(0, 70)}...`)
                })
            }
            if (researchResult.confidence) {
                addLog(`🎯 Research Confidence: ${researchResult.confidence}%`)
            }

            setAgentResults(prev => prev.map(result =>
                result.agentName === "ResearchBot"
                    ? {
                        ...result,
                        result: researchResult,
                        status: "completed",
                        processingTime: researchTime
                    }
                    : result
            ))

            // Process with EpiWatch (Health Database Agent)
            setCurrentStep(3)
            addLog("🌍 Agent 3: EpiWatch - Analyzing epidemiological data...")
            setAgentResults(prev => prev.map(result =>
                result.agentName === "EpiWatch"
                    ? { ...result, status: "processing" }
                    : result
            ))

            const epiStartTime = Date.now()
            const epiResponse = await fetch('/api/agents/epi-watch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    structuredSymptoms: analyticaResult.structuredSymptoms,
                    possibleConditions: researchResult.possibleConditions,
                    originalSymptoms: symptoms,
                    patientLocation: "global"
                })
            })
            const epiResult = await epiResponse.json()
            const epiTime = Date.now() - epiStartTime

            addLog(`✅ Agent 3: EpiWatch - Completed in ${epiTime}ms`)
            addLog(`🚨 Analyzed current health trends and outbreaks`)
            addLog(`Response of AI 3:`)
            addLog(`🌍 Epidemiological Analysis:`)
            if (epiResult.currentOutbreaks) {
                addLog(`📈 Current Outbreaks: ${epiResult.currentOutbreaks.length} identified`)
                epiResult.currentOutbreaks.slice(0, 2).forEach((outbreak: any, idx: number) => {
                    addLog(`   ${idx + 1}. ${outbreak.name || outbreak.details?.substring(0, 60) || 'Outbreak detected'}`)
                })
            }
            if (epiResult.seasonalFactors) {
                addLog(`🗓️ Seasonal Factors:`)
                epiResult.seasonalFactors.slice(0, 2).forEach((factor: any, idx: number) => {
                    addLog(`   ${idx + 1}. ${typeof factor === 'string' ? factor.substring(0, 70) : factor.factor || 'Seasonal consideration'}`)
                })
            }
            if (epiResult.confidence) {
                addLog(`🎯 Confidence Level: ${epiResult.confidence}%`)
            }

            setAgentResults(prev => prev.map(result =>
                result.agentName === "EpiWatch"
                    ? {
                        ...result,
                        result: epiResult,
                        status: "completed",
                        processingTime: epiTime
                    }
                    : result
            ))

            // Process with PatternSeeker (Case History Agent)
            setCurrentStep(4)
            addLog("🔍 Agent 4: PatternSeeker - Analyzing case history patterns...")
            setAgentResults(prev => prev.map(result =>
                result.agentName === "PatternSeeker"
                    ? { ...result, status: "processing" }
                    : result
            ))

            const patternStartTime = Date.now()
            const patternResponse = await fetch('/api/agents/pattern-seeker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    structuredSymptoms: analyticaResult.structuredSymptoms,
                    possibleConditions: researchResult.possibleConditions,
                    epidemiologicalData: epiResult,
                    originalSymptoms: symptoms
                })
            })
            const patternResult = await patternResponse.json()
            const patternTime = Date.now() - patternStartTime

            addLog(`✅ Agent 4: PatternSeeker - Completed in ${patternTime}ms`)
            addLog(`📈 Identified diagnostic patterns from case history`)
            addLog(`Response of AI 4:`)
            addLog(`📊 Pattern Strength: ${patternResult.patternStrength || 'N/A'}%`)
            if (patternResult.similarCases) {
                addLog(`🔍 Similar Cases Found: ${patternResult.similarCases.length}`)
                patternResult.similarCases.slice(0, 2).forEach((case_: any, idx: number) => {
                    addLog(`   Case ${idx + 1}: ${case_.finalDiagnosis} (${case_.similarity}% similarity)`)
                })
            }
            if (patternResult.diagnosticPatterns) {
                addLog(`🩺 Top Diagnostic Patterns:`)
                patternResult.diagnosticPatterns.slice(0, 3).forEach((pattern: any, idx: number) => {
                    addLog(`   ${idx + 1}. ${pattern.condition} - ${pattern.confidence}% confidence`)
                })
            }
            if (patternResult.recommendedActions) {
                addLog(`💡 Key Recommendations:`)
                patternResult.recommendedActions.slice(0, 2).forEach((action: any, idx: number) => {
                    addLog(`   ${idx + 1}. ${action.substring(0, 80)}...`)
                })
            }

            setAgentResults(prev => prev.map(result =>
                result.agentName === "PatternSeeker"
                    ? {
                        ...result,
                        result: patternResult,
                        status: "completed",
                        processingTime: patternTime
                    }
                    : result
            ))

            // Process with RiskAnalyzer (Risk Assessment Agent)
            setCurrentStep(5)
            addLog("⚖️ Agent 5: RiskAnalyzer - Analyzing patient risk factors...")
            setAgentResults(prev => prev.map(result =>
                result.agentName === "RiskAnalyzer"
                    ? { ...result, status: "processing" }
                    : result
            ))

            const riskStartTime = Date.now()
            const riskResponse = await fetch('/api/agents/risk-analyzer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    structuredSymptoms: analyticaResult.structuredSymptoms,
                    possibleConditions: researchResult.possibleConditions,
                    epidemiologicalData: epiResult,
                    caseHistoryData: patternResult,
                    originalSymptoms: symptoms,
                    patientDemographics: {
                        age: 25,
                        gender: "unknown",
                        medicalHistory: [],
                        lifestyle: "standard"
                    }
                })
            })
            const riskResult = await riskResponse.json()
            const riskTime = Date.now() - riskStartTime

            addLog(`✅ Agent 5: RiskAnalyzer - Completed in ${riskTime}ms`)
            addLog(`⚖️ Risk assessment completed with demographic analysis`)
            addLog(`Response of AI 5:`)
            addLog(`🎯 Risk Analysis Results:`)
            if (riskResult.overallRiskScore) {
                addLog(`📊 Overall Risk Score: ${riskResult.overallRiskScore}/100`)
            }
            if (riskResult.riskFactors) {
                addLog(`⚠️ Risk Factors Identified: ${riskResult.riskFactors.length}`)
                riskResult.riskFactors.slice(0, 3).forEach((factor: any, idx: number) => {
                    addLog(`   ${idx + 1}. ${factor.factor} - ${factor.impact} impact`)
                })
            }
            if (riskResult.recommendations) {
                addLog(`💡 Risk-based Recommendations:`)
                riskResult.recommendations.slice(0, 2).forEach((rec: any, idx: number) => {
                    addLog(`   ${idx + 1}. ${rec.substring(0, 80)}...`)
                })
            }

            setAgentResults(prev => prev.map(result =>
                result.agentName === "RiskAnalyzer"
                    ? {
                        ...result,
                        result: riskResult,
                        status: "completed",
                        processingTime: riskTime
                    }
                    : result
            ))

            // Process with Coordinator (Decision Aggregator Agent)
            setCurrentStep(6)
            addLog("🎯 Agent 6: Coordinator - Aggregating all agent data for final diagnosis...")
            setAgentResults(prev => prev.map(result =>
                result.agentName === "Coordinator"
                    ? { ...result, status: "processing" }
                    : result
            ))

            const coordinatorStartTime = Date.now()
            const coordinatorResponse = await fetch('/api/agents/coordinator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    analyticaData: analyticaResult,
                    researchData: researchResult,
                    epidemiologicalData: epiResult,
                    caseHistoryData: patternResult,
                    riskData: riskResult,
                    originalSymptoms: symptoms
                })
            })
            const coordinatorResult = await coordinatorResponse.json()
            const coordinatorTime = Date.now() - coordinatorStartTime

            addLog(`✅ Agent 6: Coordinator - Completed in ${coordinatorTime}ms`)
            addLog(`🏁 Final diagnosis coordination completed`)
            addLog(`Response of AI 6:`)
            addLog(`🎯 Final Diagnosis Recommendations:`)
            if (coordinatorResult.finalDiagnosis) {
                addLog(`🏆 Primary Diagnosis: ${coordinatorResult.finalDiagnosis.condition} (${coordinatorResult.finalDiagnosis.confidence}%)`)
            }
            if (coordinatorResult.differentialDiagnosis) {
                addLog(`🔍 Differential Diagnoses:`)
                coordinatorResult.differentialDiagnosis.slice(0, 3).forEach((diff: any, idx: number) => {
                    addLog(`   ${idx + 1}. ${diff.condition} - ${diff.probability}%`)
                })
            }
            if (coordinatorResult.urgencyLevel) {
                addLog(`🚨 Urgency Level: ${coordinatorResult.urgencyLevel}`)
            }

            setAgentResults(prev => prev.map(result =>
                result.agentName === "Coordinator"
                    ? {
                        ...result,
                        result: coordinatorResult,
                        status: "completed",
                        processingTime: coordinatorTime
                    }
                    : result
            ))

            setCurrentStep(7)
            addLog("🎯 All 6 agents completed successfully!")

            const totalTime = analyticaTime + researchTime + epiTime + patternTime + riskTime + coordinatorTime
            addLog(`⏱️ Total processing time: ${totalTime}ms`)
        } catch (error) {
            console.error('Error processing symptoms:', error)
            addLog(`❌ Error occurred: ${error}`)
            setAgentResults(prev => prev.map(result => ({
                ...result,
                status: result.status === "processing" ? "error" : result.status
            })))
        } finally {
            setIsProcessing(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "processing": return "bg-yellow-500"
            case "completed": return "bg-green-500"
            case "error": return "bg-red-500"
            default: return "bg-gray-300"
        }
    }

    return (
        <div className="min-h-screen bg-[#FFFFF4] p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-instrument-serif font-bold text-[#151616] mb-4">
                        AI Agent Orchestration System
                    </h1>
                    <p className="text-lg font-poppins text-[#151616]/70 max-w-3xl mx-auto">
                        Advanced multi-agent system for medical symptom analysis and literature research
                    </p>
                </motion.div>

                {/* Input Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-8"
                >
                    <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                        <CardHeader>
                            <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Patient Symptom Input
                            </CardTitle>
                            <CardDescription className="font-poppins">
                                Describe the patient's symptoms in natural language
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Example: Patient has fever, headache, and body pain for the last 3 days..."
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                rows={4}
                                className="border-2 border-[#151616] font-poppins focus:border-[#D6F32F] resize-none"
                            />
                            <Button
                                onClick={processSymptoms}
                                disabled={isProcessing || !symptoms.trim()}
                                className="w-full bg-[#D6F32F] text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 font-poppins font-bold"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Start Agent Analysis
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Process Flow Indicator */}
                {(isProcessing || agentResults.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                    <Brain className="w-5 h-5" />
                                    Agent Orchestration Flow
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mb-4">
                                    {agents.map((agent, index) => {
                                        const agentResult = agentResults.find(r => r.agentName === agent.name)
                                        const isActive = currentStep === index + 1
                                        const isCompleted = agentResult?.status === "completed"
                                        const isError = agentResult?.status === "error"

                                        return (
                                            <div key={agent.name} className="flex items-center">
                                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#151616] transition-all duration-300 ${isCompleted ? 'bg-green-500' :
                                                    isError ? 'bg-red-500' :
                                                        isActive ? 'bg-[#D6F32F] animate-pulse' : 'bg-white'
                                                    }`}>
                                                    <span className="text-sm font-bold text-[#151616]">{index + 1}</span>
                                                </div>
                                                <div className="ml-2 text-xs font-poppins">
                                                    <div className="font-medium text-[#151616]">{agent.name}</div>
                                                    <div className="text-[#151616]/60">{agentResult?.status || 'waiting'}</div>
                                                </div>
                                                {index < agents.length - 1 && (
                                                    <div className="mx-4 w-8 h-0.5 bg-[#151616]/30"></div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}


                {/* Agent Pipeline - 3 Rows of 2 Agents */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {agents.map((agent, index) => {
                        const agentResult = agentResults.find(r => r.agentName === agent.name)
                        const Icon = agent.icon

                        return (
                            <motion.div
                                key={agent.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] h-full relative overflow-hidden">
                                    <div className="absolute top-2 left-2 z-10">
                                        <Badge className="bg-[#D6F32F] text-[#151616] border-[#151616] font-poppins font-bold">
                                            Agent {index + 1}
                                        </Badge>
                                    </div>
                                    <CardHeader className="pt-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-xl border-2 border-[#151616] flex items-center justify-center"
                                                    style={{ backgroundColor: agent.color === "#D6F32F" ? "#D6F32F" : "white" }}
                                                >
                                                    <Icon
                                                        className="w-6 h-6"
                                                        style={{ color: agent.color === "#D6F32F" ? "#151616" : "#151616" }}
                                                    />
                                                </div>
                                                <div>
                                                    <CardTitle className="font-poppins font-bold text-[#151616]">
                                                        {agent.name}
                                                    </CardTitle>
                                                    <CardDescription className="font-poppins text-sm">
                                                        {agent.description}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            {agentResult && (
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`w-3 h-3 rounded-full ${getStatusColor(agentResult.status)} ${agentResult.status === "processing" ? "animate-pulse" : ""
                                                            }`}
                                                    />
                                                    <Badge
                                                        variant="neutral"
                                                        className={`border-[#151616] font-poppins text-xs ${agentResult.status === "completed" ? "bg-green-100" :
                                                            agentResult.status === "processing" ? "bg-yellow-100" :
                                                                agentResult.status === "error" ? "bg-red-100" : ""
                                                            }`}
                                                    >
                                                        {agentResult.status}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {agentResult?.status === "processing" && (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-8 h-8 animate-spin text-[#151616]" />
                                            </div>
                                        )}

                                        {agentResult?.status === "completed" && agentResult.result && (
                                            <div className="space-y-4">
                                                {agentResult.processingTime && (
                                                    <div className="text-xs font-poppins text-[#151616]/60">
                                                        Processed in {agentResult.processingTime}ms
                                                    </div>
                                                )}

                                                {agent.type === "symptom-analysis" && (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="font-poppins font-semibold text-[#151616] mb-2">
                                                                Structured Symptoms:
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {agentResult.result.structuredSymptoms?.map((symptom: string, idx: number) => (
                                                                    <Badge
                                                                        key={idx}
                                                                        className="bg-[#D6F32F] text-[#151616] border-[#151616] font-poppins"
                                                                    >
                                                                        {symptom}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {agentResult.result.analysis && (
                                                            <div>
                                                                <h4 className="font-poppins font-semibold text-[#151616] mb-2">
                                                                    Analysis:
                                                                </h4>
                                                                <p className="text-sm font-poppins text-[#151616]/80">
                                                                    {agentResult.result.analysis}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {agent.type === "literature-research" && (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="font-poppins font-semibold text-[#151616] mb-2">
                                                                Possible Conditions:
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {agentResult.result.possibleConditions?.map((condition: any, idx: number) => (
                                                                    <div key={idx} className="p-3 bg-[#FFFFF4] rounded-xl border border-[#151616]/20">
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <span className="font-poppins font-medium text-[#151616]">
                                                                                {condition.name}
                                                                            </span>
                                                                            <Badge className="bg-[#151616] text-white font-poppins text-xs">
                                                                                {condition.likelihood}
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-xs font-poppins text-[#151616]/70">
                                                                            {condition.reasoning}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {agent.type === "health-database" && (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="font-poppins font-semibold text-[#151616] mb-2">
                                                                Current Outbreaks:
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {agentResult.result.currentOutbreaks?.map((outbreak: any, idx: number) => (
                                                                    <div key={idx} className="p-3 bg-[#FFFFF4] rounded-xl border border-[#151616]/20">
                                                                        <p className="text-sm font-poppins font-medium text-[#151616]">
                                                                            {outbreak.description}
                                                                        </p>
                                                                        <p className="text-xs font-poppins text-[#151616]/70">
                                                                            {outbreak.relevance}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {agentResult.result.seasonalFactors && (
                                                            <div>
                                                                <h4 className="font-poppins font-semibold text-[#151616] mb-2">
                                                                    Seasonal Factors:
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    {agentResult.result.seasonalFactors?.map((factor: any, idx: number) => (
                                                                        <div key={idx} className="text-xs font-poppins text-[#151616]/80">
                                                                            • {factor.factor}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {agent.type === "case-history" && (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="font-poppins font-semibold text-[#151616] mb-2">
                                                                Similar Cases:
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {agentResult.result.similarCases?.slice(0, 3).map((case_: any, idx: number) => (
                                                                    <div key={idx} className="p-3 bg-[#FFFFF4] rounded-xl border border-[#151616]/20">
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <span className="font-poppins font-medium text-[#151616] text-sm">
                                                                                {case_.finalDiagnosis || case_.description}
                                                                            </span>
                                                                            <Badge className="bg-[#D6F32F] text-[#151616] font-poppins text-xs">
                                                                                {case_.similarity}%
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-xs font-poppins text-[#151616]/70">
                                                                            {case_.caseId ? `${case_.caseId}: ${case_.outcome}` : case_.relevance}
                                                                        </p>
                                                                        {case_.symptoms && Array.isArray(case_.symptoms) && (
                                                                            <p className="text-xs font-poppins text-[#151616]/60 mt-1">
                                                                                Symptoms: {case_.symptoms.slice(0, 2).join(', ')}
                                                                                {case_.symptoms.length > 2 && '...'}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {agentResult.result.diagnosticPatterns && (
                                                            <div>
                                                                <h4 className="font-poppins font-semibold text-[#151616] mb-2">
                                                                    Diagnostic Patterns:
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    {agentResult.result.diagnosticPatterns?.slice(0, 3).map((pattern: any, idx: number) => (
                                                                        <div key={idx} className="flex justify-between items-center text-xs font-poppins p-2 bg-white rounded border border-[#151616]/20">
                                                                            <span className="text-[#151616] font-medium">{pattern.condition || pattern.pattern}</span>
                                                                            <Badge className="bg-[#D6F32F] text-[#151616] font-poppins text-xs">
                                                                                {pattern.confidence}%
                                                                            </Badge>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {agentResult.result.patternStrength && (
                                                            <div className="p-3 bg-[#D6F32F]/20 rounded-xl border border-[#D6F32F]">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-poppins font-bold text-[#151616]">
                                                                        Pattern Strength
                                                                    </span>
                                                                    <span className="font-poppins font-bold text-[#151616] text-lg">
                                                                        {agentResult.result.patternStrength}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {agent.type === "risk-assessment" && (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="font-poppins font-semibold text-[#151616] mb-2">
                                                                Risk Factors:
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {agentResult.result.riskFactors?.slice(0, 3).map((factor: any, idx: number) => (
                                                                    <div key={idx} className="p-3 bg-[#FFFFF4] rounded-xl border border-[#151616]/20">
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <span className="font-poppins font-medium text-[#151616] text-sm">
                                                                                {factor.factor}
                                                                            </span>
                                                                            <Badge className={`font-poppins text-xs ${factor.impact === "High" ? "bg-red-500 text-white" :
                                                                                factor.impact === "Medium" ? "bg-yellow-500 text-[#151616]" :
                                                                                    "bg-green-500 text-white"
                                                                                }`}>
                                                                                {factor.impact}
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-xs font-poppins text-[#151616]/70">
                                                                            {factor.description}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {agentResult.result.overallRiskScore && (
                                                            <div className="p-3 bg-[#D6F32F]/20 rounded-xl border border-[#D6F32F]">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-poppins font-bold text-[#151616]">
                                                                        Overall Risk Score
                                                                    </span>
                                                                    <span className="font-poppins font-bold text-[#151616] text-lg">
                                                                        {agentResult.result.overallRiskScore}/100
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {agent.type === "decision-aggregator" && (
                                                    <div className="space-y-3">
                                                        {agentResult.result.finalDiagnosis && (
                                                            <div className="p-3 bg-[#D6F32F] rounded-xl border-2 border-[#151616]">
                                                                <h4 className="font-poppins font-bold text-[#151616] mb-2">
                                                                    Primary Diagnosis:
                                                                </h4>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-poppins font-bold text-[#151616] text-lg">
                                                                        {agentResult.result.finalDiagnosis.condition}
                                                                    </span>
                                                                    <span className="font-poppins font-bold text-[#151616] text-xl">
                                                                        {agentResult.result.finalDiagnosis.confidence}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <h4 className="font-poppins font-semibold text-[#151616] mb-2">
                                                                Differential Diagnoses:
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {agentResult.result.differentialDiagnosis?.slice(0, 3).map((diff: any, idx: number) => (
                                                                    <div key={idx} className="flex justify-between items-center p-2 bg-[#FFFFF4] rounded border border-[#151616]/20">
                                                                        <span className="text-sm font-poppins font-medium text-[#151616]">
                                                                            {diff.condition}
                                                                        </span>
                                                                        <Badge className="bg-[#151616] text-white font-poppins text-xs">
                                                                            {diff.probability}%
                                                                        </Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {agentResult.result.urgencyLevel && (
                                                            <div className={`p-3 rounded-xl border-2 ${agentResult.result.urgencyLevel === "High" ? "bg-red-100 border-red-500" :
                                                                agentResult.result.urgencyLevel === "Medium" ? "bg-yellow-100 border-yellow-500" :
                                                                    "bg-green-100 border-green-500"
                                                                }`}>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-poppins font-bold text-[#151616]">
                                                                        Urgency Level
                                                                    </span>
                                                                    <span className="font-poppins font-bold text-[#151616] text-lg">
                                                                        {agentResult.result.urgencyLevel}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {agentResult?.status === "error" && (
                                            <div className="text-center py-8">
                                                <p className="text-red-600 font-poppins">Error processing request</p>
                                            </div>
                                        )}

                                        {!agentResult && (
                                            <div className="text-center py-8 text-[#151616]/50 font-poppins">
                                                Waiting for input...
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
