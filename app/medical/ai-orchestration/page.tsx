"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, FileText, Loader2, Send, User, Database, TrendingUp, Shield, Target, ArrowRight, CheckCircle, Clock, Edit, Save, History, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PatientInfo {
    name: string
    age: string
    gender: string
    medicalHistory: string
    symptoms: string
}

interface AgentResult {
    agentName: string
    agentType: "symptom-analysis" | "literature-research" | "health-database" | "case-history" | "risk-assessment" | "decision-aggregator"
    result: any
    status: "idle" | "processing" | "completed" | "error"
    processingTime?: number
}

export default function AIOrchestrationPage() {
    const [step, setStep] = useState<"patient-info" | "processing" | "results">("patient-info")
    const [patientInfo, setPatientInfo] = useState<PatientInfo>({
        name: "John Doe",
        age: "35",
        gender: "male",
        medicalHistory: "No significant past medical history. Non-smoker, occasional alcohol use. No known drug allergies.",
        symptoms: "Patient presents with high fever (102°F) for the past 3 days, severe headache, body aches, fatigue, and mild cough. Reports feeling nauseous and has poor appetite. Symptoms started gradually and have been worsening."
    })
    const [isEditing, setIsEditing] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [agentResults, setAgentResults] = useState<AgentResult[]>([])
    const [currentStep, setCurrentStep] = useState(0)
    const [logs, setLogs] = useState<string[]>([])
    const [showAllReports, setShowAllReports] = useState(false)
    const [patientHistory, setPatientHistory] = useState<any>(null)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [showHistory, setShowHistory] = useState(false)

    const agents = [
        {
            name: "Analytica",
            type: "symptom-analysis" as const,
            description: "Analyzes and structures patient symptoms",
            icon: Brain,
            color: "#f9c80e"
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
            color: "#f9c80e"
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
            description: "Calculates risk factors based on patient demographics",
            icon: Shield,
            color: "#f9c80e"
        },
        {
            name: "Coordinator",
            type: "decision-aggregator" as const,
            description: "Aggregates all agent data for final diagnosis",
            icon: Target,
            color: "#151616"
        }
    ]

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString()
        setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    }

    const fetchPatientHistory = async (patientName: string) => {
        if (!patientName.trim()) return
        
        setIsLoadingHistory(true)
        try {
            const response = await fetch(`/api/diagnosis/history?patientName=${encodeURIComponent(patientName)}`)
            const data = await response.json()
            
            if (data.isFirstTime) {
                addLog(`📋 First-time patient: ${patientName} - No previous history found`)
                setPatientHistory(null)
            } else {
                addLog(`📚 Found ${data.history.length} previous visits for ${patientName}`)
                addLog(`🔄 Most recent diagnosis: ${data.history[0].diagnosis}`)
                setPatientHistory(data)
                
                // Auto-fill patient info from history
                setPatientInfo(prev => ({
                    ...prev,
                    name: data.patientInfo.name,
                    age: data.patientInfo.age,
                    gender: data.patientInfo.gender,
                    medicalHistory: data.patientInfo.medicalHistory
                }))
            }
        } catch (error) {
            console.error('Error fetching patient history:', error)
            addLog(`❌ Error fetching history for ${patientName}`)
        } finally {
            setIsLoadingHistory(false)
        }
    }

    const savePatientDiagnosisWithResults = async (resultsArray: AgentResult[]) => {
        try {
            // Extract final diagnosis from coordinator results
            const coordinatorResult = resultsArray.find(r => r.agentName === "Coordinator")?.result
            
            // Create a fallback final diagnosis if coordinator doesn't provide one
            let finalDiagnosis = coordinatorResult?.finalDiagnosis
            
            if (!finalDiagnosis) {
                // Extract diagnosis from the most confident agent result
                const researchResult = resultsArray.find(r => r.agentName === "ResearchBot")?.result
                const riskResult = resultsArray.find(r => r.agentName === "RiskAnalyzer")?.result
                
                if (researchResult?.possibleConditions?.length > 0) {
                    const topCondition = researchResult.possibleConditions[0]
                    finalDiagnosis = {
                        condition: topCondition.name,
                        confidence: parseInt(topCondition.likelihood.replace('%', '')),
                        urgencyLevel: riskResult?.urgencyLevel || 'Moderate'
                    }
                } else {
                    // Ultimate fallback
                    finalDiagnosis = {
                        condition: "Clinical Assessment Required",
                        confidence: 50,
                        urgencyLevel: "Moderate"
                    }
                }
                
                addLog(`⚠️ Using fallback diagnosis: ${finalDiagnosis.condition}`)
            }

            // Debug: Check what we have in resultsArray before saving
            console.log('ResultsArray before saving:', resultsArray)
            console.log('ResultsArray length:', resultsArray.length)
            
            const analyticaData = resultsArray.find(r => r.agentName === "Analytica")?.result
            const researchBotData = resultsArray.find(r => r.agentName === "ResearchBot")?.result
            const epiWatchData = resultsArray.find(r => r.agentName === "EpiWatch")?.result
            const patternSeekerData = resultsArray.find(r => r.agentName === "PatternSeeker")?.result
            const riskAnalyzerData = resultsArray.find(r => r.agentName === "RiskAnalyzer")?.result
            
            console.log('Individual agent data from resultsArray:')
            console.log('Analytica:', analyticaData)
            console.log('ResearchBot:', researchBotData)
            console.log('EpiWatch:', epiWatchData)
            console.log('PatternSeeker:', patternSeekerData)
            console.log('RiskAnalyzer:', riskAnalyzerData)
            console.log('Coordinator:', coordinatorResult)

            const diagnosisData = {
                patientName: patientInfo.name,
                patientAge: patientInfo.age,
                patientGender: patientInfo.gender,
                medicalHistory: patientInfo.medicalHistory,
                symptoms: patientInfo.symptoms,
                diagnosisResults: {
                    analytica: analyticaData || null,
                    researchBot: researchBotData || null,
                    epiWatch: epiWatchData || null,
                    patternSeeker: patternSeekerData || null,
                    riskAnalyzer: riskAnalyzerData || null,
                    coordinator: coordinatorResult || null
                },
                finalDiagnosis: finalDiagnosis
            }
            
            console.log('Final diagnosisData being sent to API:', diagnosisData)

            const response = await fetch('/api/diagnosis/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(diagnosisData)
            })

            if (response.ok) {
                addLog(`💾 Diagnosis saved to database for ${patientInfo.name}`)
            } else {
                addLog(`❌ Failed to save diagnosis to database`)
            }
        } catch (error) {
            console.error('Error saving diagnosis:', error)
            addLog(`❌ Error saving diagnosis: ${error}`)
        }
    }

    const savePatientDiagnosis = async () => {
        try {
            // Extract final diagnosis from coordinator results
            const coordinatorResult = agentResults.find(r => r.agentName === "Coordinator")?.result
            
            // Create a fallback final diagnosis if coordinator doesn't provide one
            let finalDiagnosis = coordinatorResult?.finalDiagnosis
            
            if (!finalDiagnosis) {
                // Extract diagnosis from the most confident agent result
                const researchResult = agentResults.find(r => r.agentName === "ResearchBot")?.result
                const riskResult = agentResults.find(r => r.agentName === "RiskAnalyzer")?.result
                
                if (researchResult?.possibleConditions?.length > 0) {
                    const topCondition = researchResult.possibleConditions[0]
                    finalDiagnosis = {
                        condition: topCondition.name,
                        confidence: parseInt(topCondition.likelihood.replace('%', '')),
                        urgencyLevel: riskResult?.urgencyLevel || 'Moderate'
                    }
                } else {
                    // Ultimate fallback
                    finalDiagnosis = {
                        condition: "Clinical Assessment Required",
                        confidence: 50,
                        urgencyLevel: "Moderate"
                    }
                }
                
                addLog(`⚠️ Using fallback diagnosis: ${finalDiagnosis.condition}`)
            }

            // Debug: Check what we have in agentResults before saving
            console.log('AgentResults before saving:', agentResults)
            console.log('AgentResults length:', agentResults.length)
            
            const analyticaData = agentResults.find(r => r.agentName === "Analytica")?.result
            const researchBotData = agentResults.find(r => r.agentName === "ResearchBot")?.result
            const epiWatchData = agentResults.find(r => r.agentName === "EpiWatch")?.result
            const patternSeekerData = agentResults.find(r => r.agentName === "PatternSeeker")?.result
            const riskAnalyzerData = agentResults.find(r => r.agentName === "RiskAnalyzer")?.result
            
            console.log('Individual agent data:')
            console.log('Analytica:', analyticaData)
            console.log('ResearchBot:', researchBotData)
            console.log('EpiWatch:', epiWatchData)
            console.log('PatternSeeker:', patternSeekerData)
            console.log('RiskAnalyzer:', riskAnalyzerData)
            console.log('Coordinator:', coordinatorResult)

            const diagnosisData = {
                patientName: patientInfo.name,
                patientAge: patientInfo.age,
                patientGender: patientInfo.gender,
                medicalHistory: patientInfo.medicalHistory,
                symptoms: patientInfo.symptoms,
                diagnosisResults: {
                    analytica: analyticaData || null,
                    researchBot: researchBotData || null,
                    epiWatch: epiWatchData || null,
                    patternSeeker: patternSeekerData || null,
                    riskAnalyzer: riskAnalyzerData || null,
                    coordinator: coordinatorResult || null
                },
                finalDiagnosis: finalDiagnosis
            }
            
            console.log('Final diagnosisData being sent to API:', diagnosisData)

            const response = await fetch('/api/diagnosis/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(diagnosisData)
            })

            if (response.ok) {
                addLog(`💾 Diagnosis saved to database for ${patientInfo.name}`)
            } else {
                addLog(`❌ Failed to save diagnosis to database`)
            }
        } catch (error) {
            console.error('Error saving diagnosis:', error)
            addLog(`❌ Error saving diagnosis: ${error}`)
        }
    }

    const handlePatientInfoSubmit = () => {
        if (!patientInfo.name || !patientInfo.symptoms) return
        setStep("processing")
        processSymptoms()
    }

    const processSymptoms = async () => {
        setIsProcessing(true)
        setAgentResults([])
        setCurrentStep(0)
        setLogs([])

        addLog("🚀 Starting AI Agent Orchestration...")
        addLog(`👤 Patient: ${patientInfo.name}, Age: ${patientInfo.age}, Gender: ${patientInfo.gender}`)
        addLog("📝 Symptoms: " + patientInfo.symptoms.substring(0, 100) + "...")

        try {
            // Initialize agent results
            const initialResults = agents.map(agent => ({
                agentName: agent.name,
                agentType: agent.type,
                result: null,
                status: "idle" as const
            }))
            setAgentResults(initialResults)
            addLog("🤖 Initialized 6 AI agents for comprehensive diagnosis")

            // Track results locally to avoid state update delays
            let currentResults: AgentResult[] = [...initialResults]

            // Process each agent sequentially with animations
            for (let i = 0; i < agents.length; i++) {
                const agent = agents[i]
                setCurrentStep(i + 1)
                addLog(`🔍 Agent ${i + 1}: ${agent.name} - Starting analysis...`)
                
                setAgentResults(prev => prev.map(result =>
                    result.agentName === agent.name
                        ? { ...result, status: "processing" }
                        : result
                ))

                // Simulate processing time for demo
                await new Promise(resolve => setTimeout(resolve, 2000))

                const startTime = Date.now()
                let result: any = {}

                try {
                    // Map agent names to correct API endpoints
                    const apiEndpoints: {[key: string]: string} = {
                        'Analytica': 'analytica',
                        'ResearchBot': 'research-bot', 
                        'EpiWatch': 'epi-watch',
                        'PatternSeeker': 'pattern-seeker',
                        'RiskAnalyzer': 'risk-analyzer',
                        'Coordinator': 'coordinator'
                    }
                    
                    const endpoint = apiEndpoints[agent.name]
                    const completedResults = currentResults.filter(r => r.status === "completed")
                    
                    // Get specific previous results
                    const analyticaResult = completedResults.find(r => r.agentName === "Analytica")?.result
                    const researchResult = completedResults.find(r => r.agentName === "ResearchBot")?.result
                    const epiResult = completedResults.find(r => r.agentName === "EpiWatch")?.result
                    const patternResult = completedResults.find(r => r.agentName === "PatternSeeker")?.result
                    const riskResult = completedResults.find(r => r.agentName === "RiskAnalyzer")?.result
                    
                    // Prepare request body based on agent type (matching test-kaustubh pattern)
                    let requestBody: any = {}
                    
                    switch (agent.name) {
                        case 'Analytica':
                            requestBody = { symptoms: patientInfo.symptoms }
                            break
                        case 'ResearchBot':
                            requestBody = {
                                structuredSymptoms: analyticaResult?.structuredSymptoms || [],
                                originalSymptoms: patientInfo.symptoms
                            }
                            break
                        case 'EpiWatch':
                            requestBody = {
                                structuredSymptoms: analyticaResult?.structuredSymptoms || [],
                                possibleConditions: researchResult?.possibleConditions || [],
                                originalSymptoms: patientInfo.symptoms,
                                patientLocation: "global"
                            }
                            break
                        case 'PatternSeeker':
                            requestBody = {
                                structuredSymptoms: analyticaResult?.structuredSymptoms || [],
                                possibleConditions: researchResult?.possibleConditions || [],
                                epidemiologicalData: epiResult,
                                originalSymptoms: patientInfo.symptoms
                            }
                            break
                        case 'RiskAnalyzer':
                            requestBody = {
                                structuredSymptoms: analyticaResult?.structuredSymptoms || [],
                                possibleConditions: researchResult?.possibleConditions || [],
                                epidemiologicalData: epiResult,
                                caseHistoryData: patternResult,
                                originalSymptoms: patientInfo.symptoms,
                                patientDemographics: {
                                    age: parseInt(patientInfo.age) || 25,
                                    gender: patientInfo.gender || "unknown",
                                    medicalHistory: patientInfo.medicalHistory?.split(',').map(s => s.trim()) || [],
                                    lifestyle: "standard"
                                }
                            }
                            break
                        case 'Coordinator':
                            requestBody = {
                                analyticaData: analyticaResult,
                                researchData: researchResult,
                                epidemiologicalData: epiResult,
                                caseHistoryData: patternResult,
                                riskData: riskResult,
                                originalSymptoms: patientInfo.symptoms
                            }
                            break
                        default:
                            requestBody = { symptoms: patientInfo.symptoms }
                    }
                    
                    const response = await fetch(`/api/agents/${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    })
                    
                    if (response.ok) {
                        result = await response.json()
                        addLog(`🔗 ${agent.name} API call successful`)
                    } else {
                        throw new Error(`API call failed: ${response.status}`)
                    }
                } catch (error) {
                    // Fallback demo data - this will be used most of the time
                    addLog(`🔄 ${agent.name} using demo data (API: ${error})`)
                    result = getDemoResult(agent.type, patientInfo.symptoms, currentResults.filter(r => r.status === "completed"))
                }

                const processingTime = Date.now() - startTime

                addLog(`✅ Agent ${i + 1}: ${agent.name} - Completed in ${processingTime}ms`)
                
                // Update local results array immediately
                currentResults = currentResults.map(r =>
                    r.agentName === agent.name
                        ? {
                            ...r,
                            result: result,
                            status: "completed" as const,
                            processingTime: processingTime
                        }
                        : r
                ) as AgentResult[]

                // Update state for UI
                setAgentResults(prev => prev.map(r =>
                    r.agentName === agent.name
                        ? {
                            ...r,
                            result: result,
                            status: "completed",
                            processingTime: processingTime
                        }
                        : r
                ))
                
                // Debug: Log the updated result
                console.log(`Updated ${agent.name} result:`, result)
                console.log(`Local currentResults:`, currentResults)

                // Add specific logs for each agent
                logAgentResults(agent, result)
            }

            setCurrentStep(7)
            addLog("🎯 All 6 agents completed successfully!")
            
            // Debug: Check what we have in agent results
            addLog("🔍 Checking agent results...")
            agentResults.forEach(agent => {
                addLog(`   ${agent.agentName}: ${agent.status}`)
            })
            
            addLog("💾 Saving diagnosis to database...")
            
            // Debug: Log what we're about to save
            addLog(`🔍 Total agent results: ${agentResults.length}`)
            agentResults.forEach(agent => {
                if (agent.result && Object.keys(agent.result).length > 0) {
                    addLog(`💾 ${agent.agentName}: Data available (${Object.keys(agent.result).length} properties)`)
                    console.log(`${agent.agentName} result:`, agent.result)
                } else {
                    addLog(`⚠️ ${agent.agentName}: No data or empty result`)
                    console.log(`${agent.agentName} status:`, agent.status, 'result:', agent.result)
                }
            })
            
            // Save diagnosis to database with local results
            await savePatientDiagnosisWithResults(currentResults)
            
            addLog("📊 Click 'Show All Agent Reports' to view detailed analysis")
            
        } catch (error) {
            console.error('Error processing symptoms:', error)
            addLog(`❌ Error occurred: ${error}`)
        } finally {
            setIsProcessing(false)
            setStep("results")
        }
    }

    const getDemoResult = (agentType: string, symptoms: string = "", previousResults: any[] = []) => {
        const isChestPain = symptoms.toLowerCase().includes('chest pain')
        const isFever = symptoms.toLowerCase().includes('fever')
        const isAbdominalPain = symptoms.toLowerCase().includes('abdominal pain')
        
        // Use patient history context if available
        const hasHistory = patientHistory && !patientHistory.isFirstTime
        const patientContext = hasHistory ? patientHistory.contextForAI : null

        switch (agentType) {
            case "symptom-analysis":
                if (isChestPain) {
                    return {
                        structuredSymptoms: [
                            "Substernal chest pain", 
                            "Crushing/pressure sensation", 
                            "Left arm radiation", 
                            "Dyspnea on exertion",
                            "Diaphoresis", 
                            "Nausea",
                            "Pain severity: 8/10 on numerical rating scale"
                        ],
                        analysis: "Clinical presentation consistent with acute coronary syndrome. Patient exhibits classic ischemic chest pain pattern with radiation to left arm, associated autonomic symptoms (diaphoresis, nausea), and dyspnea. High clinical suspicion for STEMI given symptom severity and presentation in patient with known cardiovascular risk factors (diabetes mellitus, hypertension).",
                        categories: ["Cardiovascular", "Acute Care", "Emergency Medicine"],
                        severity: "Critical - Immediate cardiac intervention required",
                        clinicalPearls: [
                            "Time-sensitive diagnosis requiring rapid ECG and cardiac biomarkers",
                            "Door-to-balloon time goal <90 minutes if STEMI confirmed"
                        ]
                    }
                } else if (isAbdominalPain) {
                    return {
                        structuredSymptoms: [
                            "Right lower quadrant pain",
                            "Periumbilical pain migration",
                            "Nausea and vomiting", 
                            "Low-grade fever",
                            "McBurney's point tenderness",
                            "Positive Rovsing's sign"
                        ],
                        analysis: "Clinical presentation highly suggestive of acute appendicitis. Classic pain migration pattern from periumbilical region to right iliac fossa, accompanied by gastrointestinal symptoms and fever. Physical examination findings support inflammatory process in right lower quadrant.",
                        categories: ["General Surgery", "Acute Care", "Gastrointestinal"],
                        severity: "High - Urgent surgical evaluation required"
                    }
                } else {
                    return {
                        structuredSymptoms: [
                            "Pyrexia (102°F/38.9°C)",
                            "Cephalgia", 
                            "Myalgia",
                            "Asthenia",
                            "Productive cough",
                            "Decreased appetite"
                        ],
                        analysis: "Clinical syndrome consistent with viral upper respiratory tract infection. Constellation of systemic symptoms including fever, constitutional symptoms, and mild respiratory involvement. Differential diagnosis includes influenza, common cold, or other viral pathogens.",
                        categories: ["Internal Medicine", "Infectious Disease", "Primary Care"],
                        severity: "Moderate - Symptomatic management with monitoring"
                    }
                }
            
            case "literature-research":
                if (isChestPain) {
                    return {
                        possibleConditions: [
                            { 
                                name: "ST-Elevation Myocardial Infarction (STEMI)", 
                                likelihood: "87%", 
                                reasoning: "High probability based on clinical presentation, patient demographics (male, 45 years, DM, HTN), and symptom constellation. Framingham Risk Score indicates high cardiovascular risk. Literature supports 85-90% diagnostic accuracy for STEMI in patients with this presentation.",
                                evidenceLevel: "Level A (High)",
                                icd10: "I21.9"
                            },
                            { 
                                name: "Non-ST-Elevation Myocardial Infarction (NSTEMI)", 
                                likelihood: "72%", 
                                reasoning: "Strong alternative diagnosis. GRACE score suggests moderate-to-high risk ACS. May present with similar symptoms but different ECG findings. Requires serial troponin monitoring.",
                                evidenceLevel: "Level A (High)",
                                icd10: "I21.A1"
                            },
                            { 
                                name: "Unstable Angina Pectoris", 
                                likelihood: "58%", 
                                reasoning: "Part of acute coronary syndrome spectrum. Canadian Cardiovascular Society Class IV symptoms. Would require negative biomarkers for diagnosis.",
                                evidenceLevel: "Level B (Moderate)",
                                icd10: "I20.0"
                            }
                        ],
                        recommendedTests: [
                            "STAT 12-lead ECG with posterior leads V7-V9",
                            "Serial high-sensitivity cardiac troponin I (0, 3, 6 hours)",
                            "Comprehensive metabolic panel including glucose, creatinine",
                            "PT/INR, aPTT if anticoagulation considered",
                            "Chest radiograph (portable AP)",
                            "Echocardiogram if hemodynamically unstable"
                        ],
                        confidence: 94,
                        literatureReferences: [
                            "2020 ESC Guidelines for ACS management",
                            "ACC/AHA STEMI Guidelines 2023 Update",
                            "High-sensitivity troponin diagnostic pathways (Lancet 2021)"
                        ]
                    }
                } else if (isAbdominalPain) {
                    return {
                        possibleConditions: [
                            { 
                                name: "Acute Appendicitis", 
                                likelihood: "89%", 
                                reasoning: "Alvarado Score >7 indicates high probability. Classic presentation with RLQ pain, positive McBurney's sign, and constitutional symptoms.",
                                evidenceLevel: "Level A (High)",
                                icd10: "K35.9"
                            }
                        ],
                        recommendedTests: [
                            "CT abdomen/pelvis with IV contrast",
                            "Complete blood count with differential",
                            "Comprehensive metabolic panel"
                        ],
                        confidence: 89
                    }
                } else {
                    return {
                        possibleConditions: [
                            { 
                                name: "Viral Upper Respiratory Tract Infection", 
                                likelihood: "78%", 
                                reasoning: "Consistent with common viral syndrome. Seasonal epidemiology supports viral etiology.",
                                evidenceLevel: "Level B (Moderate)",
                                icd10: "J06.9"
                            },
                            { 
                                name: "Influenza A/B", 
                                likelihood: "65%", 
                                reasoning: "Influenza-like illness criteria met. Consider during flu season.",
                                evidenceLevel: "Level B (Moderate)",
                                icd10: "J11.1"
                            }
                        ],
                        recommendedTests: [
                            "Rapid influenza diagnostic test (RIDT)",
                            "Throat culture if bacterial suspected"
                        ],
                        confidence: 82
                    }
                }
            
            case "health-database":
                if (isChestPain) {
                    return {
                        currentOutbreaks: [
                            {
                                name: "Increased MI Rates During Winter",
                                description: "20% increase in myocardial infarction cases during winter months",
                                relevance: "Seasonal pattern supports higher cardiac event probability"
                            }
                        ],
                        seasonalFactors: [
                            { factor: "Winter season increases cardiovascular events by 15-25%", impact: "High" },
                            { factor: "Cold weather triggers vasoconstriction", impact: "Moderate" }
                        ],
                        confidence: 89
                    }
                } else {
                    return {
                        currentOutbreaks: [
                            {
                                name: "Seasonal Flu Activity",
                                description: "Moderate flu activity in the region with 15% increase in cases",
                                relevance: "Current viral illness patterns support viral etiology"
                            }
                        ],
                        seasonalFactors: [{ factor: "Peak viral season increases infection probability", impact: "High" }],
                        confidence: 75
                    }
                }

            case "case-history":
                if (isChestPain) {
                    return {
                        similarCases: [
                            {
                                caseId: "CASE-2024-001",
                                finalDiagnosis: "STEMI - LAD occlusion",
                                similarity: 94,
                                outcome: "Successful PCI, full recovery",
                                symptoms: ["crushing chest pain", "left arm radiation", "diaphoresis"]
                            },
                            {
                                caseId: "CASE-2024-015", 
                                finalDiagnosis: "NSTEMI",
                                similarity: 87,
                                outcome: "Medical management, good recovery"
                            }
                        ],
                        diagnosticPatterns: [
                            { condition: "Acute MI", confidence: 91, pattern: "Chest pain + radiation + diaphoresis" },
                            { condition: "Acute Coronary Syndrome", confidence: 88, pattern: "Cardiac risk factors + typical pain" }
                        ],
                        patternStrength: 93,
                        recommendedActions: [
                            "Immediate ECG and cardiac monitoring",
                            "Activate cardiac catheterization lab",
                            "Administer dual antiplatelet therapy"
                        ]
                    }
                } else {
                    return {
                        similarCases: [
                            {
                                caseId: "CASE-2024-087",
                                finalDiagnosis: "Viral syndrome", 
                                similarity: 85,
                                outcome: "Full recovery in 5-7 days"
                            }
                        ],
                        diagnosticPatterns: [
                            { condition: "Viral infection", confidence: 82, pattern: "Fever + body aches + fatigue" }
                        ],
                        patternStrength: 78
                    }
                }

            case "risk-assessment":
                if (isChestPain) {
                    return {
                        overallRiskScore: 87,
                        riskFactors: [
                            {
                                factor: "Type 2 Diabetes Mellitus",
                                impact: "High",
                                description: "Increases cardiovascular risk by 2-4 fold"
                            },
                            {
                                factor: "Hypertension",
                                impact: "High",
                                description: "Major modifiable risk factor for coronary artery disease"
                            },
                            {
                                factor: "Male gender, age 45",
                                impact: "Moderate", 
                                description: "Higher baseline risk for cardiac events"
                            }
                        ],
                        recommendations: [
                            "Immediate cardiac evaluation and monitoring",
                            "Consider cardiac catheterization",
                            "Initiate guideline-directed medical therapy"
                        ],
                        urgencyLevel: "Critical",
                        confidence: 91
                    }
                } else {
                    return {
                        overallRiskScore: 25,
                        riskFactors: [
                            {
                                factor: "No significant comorbidities",
                                impact: "Low",
                                description: "Generally healthy individual"
                            }
                        ],
                        recommendations: ["Supportive care", "Rest and hydration"],
                        urgencyLevel: "Low",
                        confidence: 85
                    }
                }

            case "decision-aggregator":
                if (isChestPain) {
                    return {
                        finalDiagnosis: {
                            condition: "ST-Elevation Myocardial Infarction (STEMI)",
                            confidence: 89,
                            urgencyLevel: "Critical"
                        },
                        differentialDiagnosis: [
                            { condition: "NSTEMI", probability: 75 },
                            { condition: "Unstable Angina", probability: 60 },
                            { condition: "Aortic Dissection", probability: 15 }
                        ],
                        urgencyLevel: "Critical",
                        recommendedActions: [
                            "Activate Code STEMI protocol immediately",
                            "Obtain 12-lead ECG within 10 minutes",
                            "Prepare for emergent cardiac catheterization",
                            "Administer aspirin 325mg chewed"
                        ],
                        treatmentPlan: "Emergency PCI (Percutaneous Coronary Intervention)",
                        prognosis: "Excellent with timely intervention (<90 min door-to-balloon)",
                        confidence: 91
                    }
                } else if (isAbdominalPain) {
                    return {
                        finalDiagnosis: {
                            condition: "Acute Appendicitis",
                            confidence: 85,
                            urgencyLevel: "High"
                        },
                        differentialDiagnosis: [
                            { condition: "Ovarian cyst rupture", probability: 25 },
                            { condition: "Mesenteric adenitis", probability: 20 }
                        ],
                        urgencyLevel: "High",
                        recommendedActions: ["Surgical consultation", "CT scan", "NPO status"],
                        confidence: 85
                    }
                } else {
                    return {
                        finalDiagnosis: {
                            condition: "Viral Upper Respiratory Syndrome",
                            confidence: 78,
                            urgencyLevel: "Low"
                        },
                        differentialDiagnosis: [
                            { condition: "Influenza", probability: 65 },
                            { condition: "Bacterial infection", probability: 25 }
                        ],
                        urgencyLevel: "Low",
                        recommendedActions: ["Symptomatic treatment", "Rest", "Hydration"],
                        confidence: 78
                    }
                }

            default:
                return { status: "Analysis completed with comprehensive medical data" }
        }
    }

    const logAgentResults = (agent: any, result: any) => {
        switch (agent.type) {
            case "symptom-analysis":
                if (result.structuredSymptoms) {
                    addLog(`📋 Structured Symptoms: ${result.structuredSymptoms.slice(0, 3).join(', ')}...`)
                }
                if (result.severity) {
                    addLog(`⚠️ Severity: ${result.severity}`)
                }
                break
            case "literature-research":
                if (result.possibleConditions) {
                    addLog(`🔬 Found ${result.possibleConditions.length} possible conditions`)
                    result.possibleConditions.slice(0, 2).forEach((condition: any, idx: number) => {
                        addLog(`   ${idx + 1}. ${condition.name} - ${condition.likelihood} likelihood`)
                    })
                }
                if (result.confidence) {
                    addLog(`🎯 Research Confidence: ${result.confidence}%`)
                }
                break
            case "health-database":
                if (result.currentOutbreaks) {
                    addLog(`🌍 Current Outbreaks: ${result.currentOutbreaks.length} identified`)
                }
                if (result.confidence) {
                    addLog(`📊 Epidemiological Confidence: ${result.confidence}%`)
                }
                break
            case "case-history":
                if (result.similarCases) {
                    addLog(`📈 Similar Cases Found: ${result.similarCases.length}`)
                    addLog(`💪 Pattern Strength: ${result.patternStrength}%`)
                }
                break
            case "risk-assessment":
                if (result.overallRiskScore) {
                    addLog(`⚖️ Overall Risk Score: ${result.overallRiskScore}/100`)
                }
                if (result.urgencyLevel) {
                    addLog(`🚨 Urgency Level: ${result.urgencyLevel}`)
                }
                break
            case "decision-aggregator":
                if (result.finalDiagnosis) {
                    addLog(`🏆 Primary Diagnosis: ${result.finalDiagnosis.condition} (${result.finalDiagnosis.confidence}%)`)
                }
                if (result.urgencyLevel) {
                    addLog(`🚨 Final Urgency: ${result.urgencyLevel}`)
                }
                break
            default:
                addLog(`📊 ${agent.name} analysis completed`)
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
            <div className="max-w-7xl mx-auto">
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
                        Advanced multi-agent system for comprehensive medical diagnosis
                    </p>
                </motion.div>

                {/* Step 1: Patient Information Form */}
                {step === "patient-info" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-2xl mx-auto"
                    >
                        <Card className="border-2 border-[#151616] shadow-[8px_8px_0px_0px_#151616]">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                            <User className="w-5 h-5" />
                                            Patient Information
                                        </CardTitle>
                                        <CardDescription className="font-poppins">
                                            {isEditing ? "Edit patient details" : "Pre-filled demo data ready for testing"}
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="border-2 border-[#151616] hover:bg-[#f9c80e] font-poppins bg-white"
                                    >
                                        {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                                        {isEditing ? "Save" : "Edit"}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Patient Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            value={patientInfo.name}
                                            onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                                            className={`border-2 border-[#151616] font-poppins ${!isEditing ? 'bg-gray-50' : ''}`}
                                            disabled={!isEditing}
                                        />
                                        <div className="mt-2">
                                            <Button
                                                onClick={() => fetchPatientHistory(patientInfo.name)}
                                                disabled={!patientInfo.name.trim() || isLoadingHistory}
                                                className="w-full bg-blue-500 hover:bg-blue-600 text-white border-2 border-[#151616] font-poppins text-sm"
                                            >
                                                {isLoadingHistory ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Searching History...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Search className="w-4 h-4 mr-2" />
                                                        Fetch Patient History
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="age">Age</Label>
                                        <Input
                                            id="age"
                                            placeholder="25"
                                            value={patientInfo.age}
                                            onChange={(e) => setPatientInfo({...patientInfo, age: e.target.value})}
                                            className={`border-2 border-[#151616] font-poppins ${!isEditing ? 'bg-gray-50' : ''}`}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select 
                                        value={patientInfo.gender} 
                                        onValueChange={(value) => setPatientInfo({...patientInfo, gender: value})}
                                        disabled={!isEditing}
                                    >
                                        <SelectTrigger className={`border-2 border-[#151616] font-poppins ${!isEditing ? 'bg-gray-50' : ''}`}>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="medicalHistory">Medical History (Optional)</Label>
                                    <Textarea
                                        id="medicalHistory"
                                        placeholder="Previous conditions, medications, allergies..."
                                        value={patientInfo.medicalHistory}
                                        onChange={(e) => setPatientInfo({...patientInfo, medicalHistory: e.target.value})}
                                        rows={3}
                                        className={`border-2 border-[#151616] font-poppins resize-none ${!isEditing ? 'bg-gray-50' : ''}`}
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="symptoms">Current Symptoms</Label>
                                    <Textarea
                                        id="symptoms"
                                        placeholder="Patient has fever, headache, and body pain for the last 3 days..."
                                        value={patientInfo.symptoms}
                                        onChange={(e) => setPatientInfo({...patientInfo, symptoms: e.target.value})}
                                        rows={4}
                                        className={`border-2 border-[#151616] font-poppins resize-none ${!isEditing ? 'bg-gray-50' : ''}`}
                                        disabled={!isEditing}
                                        required
                                    />
                                </div>

                                {/* Patient History Section */}
                                {patientHistory && !patientHistory.isFirstTime && (
                                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <History className="w-5 h-5 text-blue-600" />
                                                <span className="font-poppins font-semibold text-[#151616]">Patient History Found</span>
                                            </div>
                                            <Button
                                                onClick={() => setShowHistory(!showHistory)}
                                                className="bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 font-poppins text-xs h-8"
                                            >
                                                {showHistory ? "Hide" : "Show"} History
                                            </Button>
                                        </div>
                                        <div className="text-sm font-poppins text-[#151616]/70 mb-2">
                                            <strong>{patientHistory.summary.totalVisits}</strong> previous visits • Last visit: <strong>{new Date(patientHistory.summary.lastVisit).toLocaleDateString()}</strong>
                                        </div>
                                        <div className="text-sm font-poppins text-[#151616]/70">
                                            Recent diagnoses: <strong>{patientHistory.summary.recentTrends.slice(0, 2).join(', ')}</strong>
                                        </div>
                                        
                                        {showHistory && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-4 space-y-2"
                                            >
                                                <h4 className="font-poppins font-semibold text-[#151616]">Previous Visits:</h4>
                                                {patientHistory.history.slice(0, 3).map((visit: any, idx: number) => (
                                                    <div key={visit.id} className="bg-white rounded p-3 border border-blue-200">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="font-poppins font-medium text-[#151616] text-sm">
                                                                {visit.diagnosis}
                                                            </span>
                                                            <span className="text-xs text-blue-600 font-poppins">
                                                                {new Date(visit.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-poppins text-[#151616]/70">
                                                            Confidence: {visit.confidence}% • Urgency: {visit.urgencyLevel}
                                                        </p>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {/* Demo Data Indicator */}
                                {!isEditing && (
                                    <div className="bg-[#f9c80e]/20 border-2 border-[#f9c80e] rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <span className="font-poppins font-semibold text-[#151616]">Demo Data Loaded</span>
                                        </div>
                                        <p className="text-sm font-poppins text-[#151616]/70">
                                            Realistic patient data is pre-filled for easy testing. Click "Edit" to modify or use as-is.
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                            <Button
                                                onClick={() => {
                                                    setPatientInfo({
                                                        name: "Sarah Johnson",
                                                        age: "28",
                                                        gender: "female",
                                                        medicalHistory: "History of migraines, currently taking birth control pills. No other significant medical history.",
                                                        symptoms: "Patient reports severe abdominal pain in the lower right quadrant for the past 6 hours, accompanied by nausea, vomiting, and low-grade fever. Pain initially started around the umbilicus and then localized to the right iliac fossa."
                                                    })
                                                }}
                                                className="border-[#151616] hover:bg-[#f9c80e] font-poppins text-xs bg-white h-8"
                                            >
                                                Load Case 2
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setPatientInfo({
                                                        name: "Robert Chen",
                                                        age: "45",
                                                        gender: "male",
                                                        medicalHistory: "Type 2 diabetes mellitus, hypertension, family history of cardiovascular disease.",
                                                        symptoms: "Patient presents with chest pain that started 2 hours ago, described as crushing and radiating to the left arm. Associated with shortness of breath, sweating, and nausea. Pain scale 8/10."
                                                    })
                                                }}
                                                className="border-[#151616] hover:bg-[#f9c80e] font-poppins text-xs bg-white h-8"
                                            >
                                                Load Case 3
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    onClick={handlePatientInfoSubmit}
                                    disabled={!patientInfo.name || !patientInfo.symptoms}
                                    className="w-full bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 font-poppins font-bold"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Start AI Diagnosis
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Step 2: Processing & Agent Flow */}
                {step === "processing" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                    >
                        {/* Agent Flow Visualization */}
                        <Card className="border-2 border-[#151616] shadow-[8px_8px_0px_0px_#151616]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                    <Brain className="w-5 h-5" />
                                    AI Agent Processing Flow
                                </CardTitle>
                                <CardDescription className="font-poppins">
                                    Watch as each AI agent analyzes the patient data sequentially
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {agents.map((agent, index) => {
                                        const agentResult = agentResults.find(r => r.agentName === agent.name)
                                        const isActive = currentStep === index + 1
                                        const isCompleted = agentResult?.status === "completed"
                                        const isProcessing = agentResult?.status === "processing"
                                        const Icon = agent.icon

                                        return (
                                            <motion.div
                                                key={agent.name}
                                                initial={{ opacity: 0.5, scale: 0.9 }}
                                                animate={{ 
                                                    opacity: isActive || isCompleted ? 1 : 0.5,
                                                    scale: isActive ? 1.05 : 1
                                                }}
                                                transition={{ duration: 0.3 }}
                                                className="text-center"
                                            >
                                                <div className={`relative mx-auto w-16 h-16 rounded-full border-2 border-[#151616] flex items-center justify-center mb-2 transition-all duration-300 ${
                                                    isCompleted ? 'bg-green-500' :
                                                    isProcessing ? 'bg-[#f9c80e] animate-pulse' : 
                                                    isActive ? 'bg-yellow-500' : 'bg-white'
                                                }`}>
                                                    {isCompleted ? (
                                                        <CheckCircle className="w-6 h-6 text-white" />
                                                    ) : isProcessing ? (
                                                        <Loader2 className="w-6 h-6 text-[#151616] animate-spin" />
                                                    ) : (
                                                        <Icon className="w-6 h-6 text-[#151616]" />
                                                    )}
                                                    
                                                    {isActive && !isCompleted && (
                                                        <motion.div
                                                            className="absolute inset-0 rounded-full border-2 border-[#f9c80e]"
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="text-xs font-poppins font-medium text-[#151616]">
                                                    {agent.name}
                                                </div>
                                                <div className="text-xs font-poppins text-[#151616]/60">
                                                    {agentResult?.status || 'waiting'}
                                                </div>
                                                {agentResult?.processingTime && (
                                                    <div className="text-xs font-poppins text-green-600">
                                                        {agentResult.processingTime}ms
                                                    </div>
                                                )}
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Live Processing Logs */}
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Live Processing Logs
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                                    <AnimatePresence>
                                        {logs.map((log, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="text-green-400 mb-1"
                                            >
                                                {log}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Step 3: Results */}
                {step === "results" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                    >
                        {/* Summary Card */}
                        <Card className="border-2 border-[#151616] shadow-[8px_8px_0px_0px_#151616]">
                            <CardHeader>
                                <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    AI Diagnosis Complete
                                </CardTitle>
                                <CardDescription className="font-poppins">
                                    All 6 AI agents have completed their analysis for {patientInfo.name}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="text-lg font-poppins text-[#151616]">
                                        Comprehensive diagnosis report ready
                                    </div>
                                    <Button
                                        onClick={() => setShowAllReports(!showAllReports)}
                                        className="bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all duration-200 font-poppins font-bold"
                                    >
                                        {showAllReports ? "Hide" : "Show All Agent Reports"}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* All Agent Reports */}
                        <AnimatePresence>
                            {showAllReports && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                >
                                    {agentResults.map((agentResult, index) => {
                                        const agent = agents.find(a => a.name === agentResult.agentName)
                                        if (!agent) return null
                                        const Icon = agent.icon

                                        return (
                                            <motion.div
                                                key={agentResult.agentName}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                            >
                                                <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] h-full">
                                                    <CardHeader>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div
                                                                className="w-12 h-12 rounded-xl border-2 border-[#151616] flex items-center justify-center"
                                                                style={{ backgroundColor: agent.color === "#f9c80e" ? "#f9c80e" : "white" }}
                                                            >
                                                                <Icon
                                                                    className="w-6 h-6"
                                                                    style={{ color: "#151616" }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <CardTitle className="font-poppins font-bold text-[#151616]">
                                                                    {agent.name}
                                                                </CardTitle>
                                                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                                                    Completed
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <CardDescription className="font-poppins text-sm">
                                                            {agent.description}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {agentResult.processingTime && (
                                                            <div className="text-xs font-poppins text-[#151616]/60 mb-3">
                                                                Processed in {agentResult.processingTime}ms
                                                            </div>
                                                        )}
                                                        <div className="space-y-3">
                                                            {/* Analysis Text */}
                                                            <div className="text-sm font-poppins text-[#151616]">
                                                                {agentResult.result?.analysis || "Analysis completed successfully"}
                                                            </div>

                                                            {/* Symptom Analysis Agent Results */}
                                                            {agent.type === "symptom-analysis" && agentResult.result?.structuredSymptoms && (
                                                                <div className="space-y-2">
                                                                    <h5 className="font-poppins font-semibold text-[#151616] text-sm">Structured Symptoms:</h5>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {agentResult.result.structuredSymptoms.map((symptom: string, idx: number) => (
                                                                            <Badge key={idx} className="bg-[#f9c80e] text-[#151616] text-xs">
                                                                                {symptom}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                    {agentResult.result.severity && (
                                                                        <div className="text-xs font-poppins text-orange-600 font-semibold">
                                                                            Severity: {agentResult.result.severity}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Literature Research Agent Results */}
                                                            {agent.type === "literature-research" && agentResult.result?.possibleConditions && (
                                                                <div className="space-y-2">
                                                                    <h5 className="font-poppins font-semibold text-[#151616] text-sm">Possible Conditions:</h5>
                                                                    {agentResult.result.possibleConditions.slice(0, 3).map((condition: any, idx: number) => (
                                                                        <div key={idx} className="bg-gray-50 p-2 rounded border">
                                                                            <div className="flex justify-between items-start mb-1">
                                                                                <span className="font-medium text-xs text-[#151616]">{condition.name}</span>
                                                                                <Badge className="bg-blue-100 text-blue-800 text-xs">{condition.likelihood}</Badge>
                                                                            </div>
                                                                            <p className="text-xs text-gray-600">{condition.reasoning?.substring(0, 100)}...</p>
                                                                            {condition.icd10 && (
                                                                                <p className="text-xs text-blue-600 mt-1">ICD-10: {condition.icd10}</p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {agentResult.result.confidence && (
                                                                        <div className="text-xs font-poppins text-green-600 font-semibold">
                                                                            Research Confidence: {agentResult.result.confidence}%
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Health Database Agent Results */}
                                                            {agent.type === "health-database" && agentResult.result?.currentOutbreaks && (
                                                                <div className="space-y-2">
                                                                    <h5 className="font-poppins font-semibold text-[#151616] text-sm">Current Health Trends:</h5>
                                                                    {agentResult.result.currentOutbreaks.map((outbreak: any, idx: number) => (
                                                                        <div key={idx} className="bg-yellow-50 p-2 rounded border border-yellow-200">
                                                                            <p className="font-medium text-xs text-[#151616]">{outbreak.name || outbreak.description}</p>
                                                                            <p className="text-xs text-gray-600">{outbreak.relevance}</p>
                                                                        </div>
                                                                    ))}
                                                                    {agentResult.result.confidence && (
                                                                        <div className="text-xs font-poppins text-blue-600 font-semibold">
                                                                            Epidemiological Confidence: {agentResult.result.confidence}%
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Case History Agent Results */}
                                                            {agent.type === "case-history" && agentResult.result?.similarCases && (
                                                                <div className="space-y-2">
                                                                    <h5 className="font-poppins font-semibold text-[#151616] text-sm">Similar Cases:</h5>
                                                                    {agentResult.result.similarCases.slice(0, 2).map((case_: any, idx: number) => (
                                                                        <div key={idx} className="bg-purple-50 p-2 rounded border border-purple-200">
                                                                            <div className="flex justify-between items-start mb-1">
                                                                                <span className="font-medium text-xs text-[#151616]">{case_.finalDiagnosis}</span>
                                                                                <Badge className="bg-purple-100 text-purple-800 text-xs">{case_.similarity}% match</Badge>
                                                                            </div>
                                                                            <p className="text-xs text-gray-600">{case_.outcome}</p>
                                                                        </div>
                                                                    ))}
                                                                    {agentResult.result.patternStrength && (
                                                                        <div className="text-xs font-poppins text-purple-600 font-semibold">
                                                                            Pattern Strength: {agentResult.result.patternStrength}%
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Risk Assessment Agent Results */}
                                                            {agent.type === "risk-assessment" && agentResult.result?.riskFactors && (
                                                                <div className="space-y-2">
                                                                    <h5 className="font-poppins font-semibold text-[#151616] text-sm">Risk Factors:</h5>
                                                                    {agentResult.result.riskFactors.slice(0, 3).map((factor: any, idx: number) => (
                                                                        <div key={idx} className="bg-red-50 p-2 rounded border border-red-200">
                                                                            <div className="flex justify-between items-start mb-1">
                                                                                <span className="font-medium text-xs text-[#151616]">{factor.factor}</span>
                                                                                <Badge className={`text-xs ${
                                                                                    factor.impact === "High" ? "bg-red-100 text-red-800" :
                                                                                    factor.impact === "Moderate" ? "bg-yellow-100 text-yellow-800" :
                                                                                    "bg-green-100 text-green-800"
                                                                                }`}>{factor.impact}</Badge>
                                                                            </div>
                                                                            <p className="text-xs text-gray-600">{factor.description}</p>
                                                                        </div>
                                                                    ))}
                                                                    {agentResult.result.overallRiskScore && (
                                                                        <div className="text-xs font-poppins text-red-600 font-semibold">
                                                                            Overall Risk Score: {agentResult.result.overallRiskScore}/100
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Coordinator Agent Results */}
                                                            {agent.type === "decision-aggregator" && agentResult.result?.finalDiagnosis && (
                                                                <div className="space-y-3">
                                                                    <div className="bg-green-50 p-3 rounded border-2 border-green-200">
                                                                        <h5 className="font-poppins font-semibold text-[#151616] text-sm mb-2">Final Diagnosis:</h5>
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="font-bold text-[#151616]">{agentResult.result.finalDiagnosis.condition}</span>
                                                                            <Badge className="bg-green-100 text-green-800 font-bold">{agentResult.result.finalDiagnosis.confidence}%</Badge>
                                                                        </div>
                                                                        <div className="mt-2">
                                                                            <span className={`text-xs font-semibold ${
                                                                                agentResult.result.urgencyLevel === "Critical" ? "text-red-600" :
                                                                                agentResult.result.urgencyLevel === "High" ? "text-orange-600" :
                                                                                agentResult.result.urgencyLevel === "Moderate" ? "text-yellow-600" :
                                                                                "text-green-600"
                                                                            }`}>
                                                                                Urgency: {agentResult.result.urgencyLevel}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {agentResult.result.differentialDiagnosis && (
                                                                        <div>
                                                                            <h5 className="font-poppins font-semibold text-[#151616] text-sm mb-2">Differential Diagnoses:</h5>
                                                                            {agentResult.result.differentialDiagnosis.slice(0, 3).map((diff: any, idx: number) => (
                                                                                <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                                                                                    <span className="text-xs text-[#151616]">{diff.condition}</span>
                                                                                    <Badge className="bg-gray-100 text-gray-800 text-xs">{diff.probability}%</Badge>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {agentResult.result.recommendedActions && (
                                                                        <div>
                                                                            <h5 className="font-poppins font-semibold text-[#151616] text-sm mb-2">Recommended Actions:</h5>
                                                                            <ul className="space-y-1">
                                                                                {agentResult.result.recommendedActions.slice(0, 4).map((action: string, idx: number) => (
                                                                                    <li key={idx} className="text-xs text-[#151616] flex items-start">
                                                                                        <span className="text-green-600 mr-1">•</span>
                                                                                        {action}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        )
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
