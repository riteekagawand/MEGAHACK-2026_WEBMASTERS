"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  FileText, 
  Calendar, 
  Activity, 
  AlertCircle,
  ChevronRight,
  Loader2,
  User,
  Stethoscope,
  Clock,
  CheckCircle,
  Brain,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface HealthRecord {
  id: string
  date: string
  patientName: string
  age: string
  gender: string
  symptoms: string
  medicalHistory: string
  diagnosis: string
  confidence: number
  urgencyLevel: string
  doctorEmail: string
  aiResults: {
    analytica: any
    researchBot: any
    coordinator: any
  }
}

export default function HealthRecordsPage() {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/patient/records')
      const data = await response.json()
      
      if (data.records) {
        setRecords(data.records)
      }
    } catch (error) {
      console.error("Error fetching records:", error)
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'moderate': return 'bg-yellow-500 text-black'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-[#FFFFF4] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f9c80e]" />
        <span className="ml-3 text-[#151616] font-poppins">Loading your health records...</span>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-[#FFFFF4]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#151616]" />
            </div>
            <div>
              <h1 className="text-3xl font-instrument-serif font-bold text-[#151616]">
                Health Records
              </h1>
              <p className="text-[#151616]/70 font-poppins">
                Your complete medical history and AI diagnosis reports
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#151616]">{records.length}</p>
                  <p className="text-sm text-[#151616]/70">Total Records</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f9c80e]/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-[#f9c80e]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#151616]">
                    {records.filter(r => r.aiResults?.coordinator).length}
                  </p>
                  <p className="text-sm text-[#151616]/70">AI Diagnoses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#151616]">
                    {records.length > 0 ? formatDate(records[0].date).split(',')[0] : 'N/A'}
                  </p>
                  <p className="text-sm text-[#151616]/70">Last Visit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Records List */}
        {records.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-[#f9c80e]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-[#f9c80e]" />
            </div>
            <h3 className="text-xl font-bold text-[#151616] mb-2">No Health Records Yet</h3>
            <p className="text-[#151616]/70 mb-4">
              Your medical records will appear here after your first AI diagnosis.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {records.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:shadow-[3px_3px_0px_0px_#151616] hover:-translate-y-0.5 transition-all cursor-pointer"
                  onClick={() => setSelectedRecord(record)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                          <Stethoscope className="w-6 h-6 text-[#151616]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#151616] font-poppins">
                            {record.diagnosis}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-[#151616]/70 mt-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(record.date)}
                          </div>
                          <p className="text-sm text-[#151616]/60 mt-2 line-clamp-2">
                            Symptoms: {record.symptoms}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge className={`${getUrgencyColor(record.urgencyLevel)} mb-2`}>
                          {record.urgencyLevel}
                        </Badge>
                        <p className="text-sm text-[#151616]/70">
                          {record.confidence}% confidence
                        </p>
                        <ChevronRight className="w-5 h-5 text-[#151616]/50 mt-2 ml-auto" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Record Detail Modal */}
        <AnimatePresence>
          {selectedRecord && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedRecord(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#FFFFF4] rounded-2xl border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] max-w-3xl w-full max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                        <FileText className="w-7 h-7 text-[#151616]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[#151616] font-instrument-serif">
                          Diagnosis Report
                        </h2>
                        <p className="text-[#151616]/70">
                          {formatDate(selectedRecord.date)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedRecord(null)}
                      className="border-2 border-[#151616]"
                    >
                      Close
                    </Button>
                  </div>

                  {/* Main Diagnosis */}
                  <Card className="border-2 border-[#151616] bg-[#f9c80e]/10 mb-6">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[#151616]">Primary Diagnosis</span>
                        <Badge className={`${getUrgencyColor(selectedRecord.urgencyLevel)}`}>
                          {selectedRecord.urgencyLevel}
                        </Badge>
                      </div>
                      <p className="text-xl font-bold text-[#151616]">{selectedRecord.diagnosis}</p>
                      <p className="text-sm text-[#151616]/70 mt-1">
                        AI Confidence: {selectedRecord.confidence}%
                      </p>
                    </CardContent>
                  </Card>

                  {/* Patient Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card className="border-2 border-[#151616]">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-[#f9c80e]" />
                          <span className="text-sm text-[#151616]/70">Patient</span>
                        </div>
                        <p className="font-bold text-[#151616]">{selectedRecord.patientName}</p>
                        <p className="text-sm text-[#151616]/70">
                          {selectedRecord.age} years • {selectedRecord.gender}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-[#151616]">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-[#f9c80e]" />
                          <span className="text-sm text-[#151616]/70">Attending Doctor</span>
                        </div>
                        <p className="font-bold text-[#151616]">{selectedRecord.doctorEmail}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Symptoms */}
                  <Card className="border-2 border-[#151616] mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-instrument-serif">
                        <AlertCircle className="w-5 h-5 text-[#f9c80e]" />
                        Symptoms
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#151616]/80 whitespace-pre-wrap">{selectedRecord.symptoms}</p>
                    </CardContent>
                  </Card>

                  {/* Medical History */}
                  {selectedRecord.medicalHistory && (
                    <Card className="border-2 border-[#151616] mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-instrument-serif">
                          <Clock className="w-5 h-5 text-[#f9c80e]" />
                          Medical History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-[#151616]/80 whitespace-pre-wrap">{selectedRecord.medicalHistory}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Analysis */}
                  {selectedRecord.aiResults?.coordinator && (
                    <Card className="border-2 border-[#151616] mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-instrument-serif">
                          <Brain className="w-5 h-5 text-[#f9c80e]" />
                          AI Analysis Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedRecord.aiResults.coordinator.finalDiagnosis && (
                          <div className="mb-4">
                            <p className="font-bold text-[#151616]">Final Assessment:</p>
                            <p className="text-[#151616]/80">
                              {selectedRecord.aiResults.coordinator.finalDiagnosis.condition}
                            </p>
                          </div>
                        )}
                        {selectedRecord.aiResults.coordinator.recommendedActions && (
                          <div>
                            <p className="font-bold text-[#151616] mb-2">Recommended Actions:</p>
                            <ul className="list-disc list-inside text-[#151616]/80">
                              {selectedRecord.aiResults.coordinator.recommendedActions.map((action: string, i: number) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-center gap-2 text-sm text-[#151616]/50">
                    <CheckCircle className="w-4 h-4" />
                    <span>Report generated by Orka AI Medical Platform</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
