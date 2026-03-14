"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Database, 
  Search, 
  FileText, 
  Activity, 
  Pill,
  BookOpen,
  Loader2,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Stethoscope
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ResearchResult {
  agent: string
  possibleConditions?: {
    name: string
    likelihood: string
    reasoning: string
    symptoms_matched?: string[]
  }[]
  differentialDiagnosis?: string[]
  recommendedTests?: string[]
  epidemiologicalNotes?: string
  confidence?: number
  literatureSources?: string
  analysis?: string
}

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState("symptoms")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleResearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/agents/research-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredSymptoms: [query],
          originalSymptoms: query
        })
      })

      if (!response.ok) {
        throw new Error('Research request failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('Failed to fetch research results. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getLikelihoodColor = (likelihood: string) => {
    if (likelihood.includes('High') || likelihood.includes('80') || likelihood.includes('90')) {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    if (likelihood.includes('Moderate') || likelihood.includes('50') || likelihood.includes('60')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    return 'bg-green-100 text-green-800 border-green-200'
  }

  const quickSearches = [
    { icon: Activity, label: "Chest pain with shortness of breath", query: "Chest pain and shortness of breath in adults" },
    { icon: Pill, label: "Metformin side effects", query: "Metformin side effects and drug interactions" },
    { icon: Stethoscope, label: "Type 2 diabetes management", query: "Type 2 diabetes latest treatment guidelines" },
    { icon: AlertCircle, label: "Migraine vs tension headache", query: "Difference between migraine and tension headache" },
  ]

  return (
    <div className="p-6 min-h-screen bg-[#FFFFF4]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center">
              <Database className="w-6 h-6 text-[#151616]" />
            </div>
            <div>
              <h1 className="text-3xl font-instrument-serif font-bold text-[#151616]">
                Medical Research
              </h1>
              <p className="text-[#151616]/70 font-poppins">
                AI-powered medical literature and research assistant
              </p>
            </div>
          </div>
        </motion.div>

        {/* Research Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] mb-6">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4 border-2 border-[#151616]">
                  <TabsTrigger value="symptoms" className="data-[state=active]:bg-[#f9c80e] data-[state=active]:text-[#151616]">
                    <Activity className="w-4 h-4 mr-2" />
                    Symptoms
                  </TabsTrigger>
                  <TabsTrigger value="conditions" className="data-[state=active]:bg-[#f9c80e] data-[state=active]:text-[#151616]">
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Conditions
                  </TabsTrigger>
                  <TabsTrigger value="drugs" className="data-[state=active]:bg-[#f9c80e] data-[state=active]:text-[#151616]">
                    <Pill className="w-4 h-4 mr-2" />
                    Drugs
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="mb-4">
                {activeTab === "symptoms" && (
                  <p className="text-[#151616]/70">
                    Enter symptoms to research possible conditions and get evidence-based insights from medical literature.
                  </p>
                )}
                {activeTab === "conditions" && (
                  <p className="text-[#151616]/70">
                    Search for specific medical conditions to learn about causes, symptoms, treatments, and latest research.
                  </p>
                )}
                {activeTab === "drugs" && (
                  <p className="text-[#151616]/70">
                    Research medications, their uses, side effects, interactions, and contraindications.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Textarea
                  placeholder={`Enter ${activeTab} to research...`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 min-h-[100px] border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] focus:shadow-[1px_1px_0px_0px_#151616] transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  {quickSearches.map((item, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setQuery(item.query)}
                      className="border-2 border-[#151616]/20 hover:border-[#151616] hover:bg-[#f9c80e]/10"
                    >
                      <item.icon className="w-3 h-3 mr-1" />
                      {item.label}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={handleResearch}
                  disabled={loading || !query.trim()}
                  className="bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:shadow-[1px_1px_0px_0px_#151616] hover:translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Research
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-2 border-red-300 bg-red-50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Confidence Score */}
              <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-[#151616]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#151616]/70">Research Confidence</p>
                        <p className="text-2xl font-bold text-[#151616]">{result.confidence || 'N/A'}%</p>
                      </div>
                    </div>
                    <Badge className="bg-[#f9c80e] text-[#151616] border-2 border-[#151616] px-4 py-2">
                      <BookOpen className="w-4 h-4 mr-1" />
                      Evidence-Based
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Possible Conditions */}
                {result.possibleConditions && result.possibleConditions.length > 0 && (
                  <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-instrument-serif">
                        <Activity className="w-5 h-5 text-[#f9c80e]" />
                        Possible Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {result.possibleConditions.map((condition, i) => (
                          <div key={i} className="p-4 bg-[#FFFFF4] rounded-xl border-2 border-[#151616]/10">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-bold text-[#151616]">{condition.name}</h4>
                              <Badge className={`${getLikelihoodColor(condition.likelihood)} border`}>
                                {condition.likelihood}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#151616]/70 mb-2">{condition.reasoning}</p>
                            {condition.symptoms_matched && (
                              <div className="flex flex-wrap gap-1">
                                {condition.symptoms_matched.map((sym, j) => (
                                  <span key={j} className="text-xs bg-[#f9c80e]/20 px-2 py-1 rounded">
                                    {sym}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommended Tests */}
                {result.recommendedTests && result.recommendedTests.length > 0 && (
                  <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-instrument-serif">
                        <FileText className="w-5 h-5 text-[#f9c80e]" />
                        Recommended Tests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.recommendedTests.map((test, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 text-[#f9c80e] mt-1 flex-shrink-0" />
                            <span className="text-[#151616]">{test}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Differential Diagnosis */}
                {result.differentialDiagnosis && result.differentialDiagnosis.length > 0 && (
                  <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-instrument-serif">
                        <Lightbulb className="w-5 h-5 text-[#f9c80e]" />
                        Differential Diagnosis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.differentialDiagnosis.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-6 h-6 bg-[#f9c80e] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#151616]">
                              {i + 1}
                            </div>
                            <span className="text-[#151616]">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Epidemiological Notes */}
                {result.epidemiologicalNotes && (
                  <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-instrument-serif">
                        <Database className="w-5 h-5 text-[#f9c80e]" />
                        Epidemiological Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#151616]/80 whitespace-pre-wrap">{result.epidemiologicalNotes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Literature Sources */}
              {result.literatureSources && (
                <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-instrument-serif">
                      <BookOpen className="w-5 h-5 text-[#f9c80e]" />
                      Literature Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#151616]/80 whitespace-pre-wrap">{result.literatureSources}</p>
                  </CardContent>
                </Card>
              )}

              {/* Raw Analysis */}
              {result.analysis && !result.possibleConditions && (
                <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-instrument-serif">
                      <FileText className="w-5 h-5 text-[#f9c80e]" />
                      Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-[#151616]/80 font-poppins bg-[#FFFFF4] p-4 rounded-xl border border-[#151616]/10">
                        {result.analysis}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
