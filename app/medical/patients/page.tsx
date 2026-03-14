"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  Search, 
  Calendar, 
  Activity, 
  ChevronRight, 
  User, 
  AlertCircle,
  Clock,
  FileText,
  TrendingUp,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Patient {
  name: string
  age: string
  gender: string
  medicalHistory: string
  lastVisit: string
  totalVisits: number
  latestDiagnosis: string
  latestUrgency: string
  latestConfidence: number
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  useEffect(() => {
    fetchPatients()
  }, [searchQuery])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/patients?search=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data.patients) {
        setPatients(data.patients)
      }
    } catch (error) {
      console.error("Error fetching patients:", error)
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
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="p-6 min-h-screen bg-[#FFFFF4]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center">
              <Users className="w-6 h-6 text-[#151616]" />
            </div>
            <div>
              <h1 className="text-3xl font-instrument-serif font-bold text-[#151616]">
                Patient Management
              </h1>
              <p className="text-[#151616]/70 font-poppins">
                View and manage AI-diagnosed patients
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#151616]">{patients.length}</p>
                  <p className="text-sm text-[#151616]/70">Total Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#151616]">
                    {patients.filter(p => p.latestUrgency?.toLowerCase() === 'critical').length}
                  </p>
                  <p className="text-sm text-[#151616]/70">Critical Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#151616]">
                    {patients.filter(p => p.latestUrgency?.toLowerCase() === 'high').length}
                  </p>
                  <p className="text-sm text-[#151616]/70">High Priority</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#151616]">
                    {patients.reduce((sum, p) => sum + p.totalVisits, 0)}
                  </p>
                  <p className="text-sm text-[#151616]/70">Total Diagnoses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#151616]/50" />
            <Input
              placeholder="Search patients by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] focus:shadow-[1px_1px_0px_0px_#151616] transition-all"
            />
          </div>
        </motion.div>

        {/* Patients List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#f9c80e]" />
            <span className="ml-3 text-[#151616] font-poppins">Loading patients...</span>
          </div>
        ) : patients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-[#f9c80e]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-[#f9c80e]" />
            </div>
            <h3 className="text-xl font-bold text-[#151616] mb-2">No Patients Found</h3>
            <p className="text-[#151616]/70 mb-4">
              {searchQuery 
                ? `No patients match "${searchQuery}"` 
                : "No patients have been diagnosed yet. Use AI Diagnosis to create patient records."}
            </p>
            <Link href="/medical/ai-orchestration">
              <Button className="bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:shadow-[1px_1px_0px_0px_#151616] hover:translate-y-0.5 transition-all">
                <Activity className="w-4 h-4 mr-2" />
                Start AI Diagnosis
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 gap-4"
          >
            {patients.map((patient, index) => (
              <motion.div
                key={patient.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:shadow-[3px_3px_0px_0px_#151616] hover:-translate-y-0.5 transition-all cursor-pointer"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                          <User className="w-6 h-6 text-[#151616]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#151616] font-poppins">
                            {patient.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-[#151616]/70">
                            <span>{patient.age} years</span>
                            <span>•</span>
                            <span className="capitalize">{patient.gender}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Last visit: {formatDate(patient.lastVisit)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge className={`${getUrgencyColor(patient.latestUrgency)} mb-1`}>
                            {patient.latestUrgency}
                          </Badge>
                          <p className="text-sm text-[#151616]/70">
                            {patient.totalVisits} visit{patient.totalVisits > 1 ? 's' : ''}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#151616]/50" />
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#151616]/10">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#f9c80e]" />
                        <span className="text-sm font-medium text-[#151616]">
                          Latest Diagnosis:
                        </span>
                        <span className="text-sm text-[#151616]/70">
                          {patient.latestDiagnosis}
                        </span>
                        <span className="text-sm text-[#151616]/50">
                          ({patient.latestConfidence}% confidence)
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Patient Detail Modal */}
        {selectedPatient && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPatient(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#FFFFF4] rounded-2xl border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                      <User className="w-7 h-7 text-[#151616]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#151616] font-instrument-serif">
                        {selectedPatient.name}
                      </h2>
                      <p className="text-[#151616]/70">
                        {selectedPatient.age} years • {selectedPatient.gender}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPatient(null)}
                    className="border-2 border-[#151616]"
                  >
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card className="border-2 border-[#151616]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-[#f9c80e]" />
                        <span className="text-sm text-[#151616]/70">Last Visit</span>
                      </div>
                      <p className="text-lg font-bold text-[#151616]">
                        {formatDate(selectedPatient.lastVisit)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-[#151616]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-[#f9c80e]" />
                        <span className="text-sm text-[#151616]/70">Total Visits</span>
                      </div>
                      <p className="text-lg font-bold text-[#151616]">
                        {selectedPatient.totalVisits}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-[#151616] mb-3">Latest Diagnosis</h3>
                  <Card className="border-2 border-[#151616] bg-[#f9c80e]/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[#151616]">
                          {selectedPatient.latestDiagnosis}
                        </span>
                        <Badge className={getUrgencyColor(selectedPatient.latestUrgency)}>
                          {selectedPatient.latestUrgency}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#151616]/70">
                        Confidence: {selectedPatient.latestConfidence}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {selectedPatient.medicalHistory && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#151616] mb-3">Medical History</h3>
                    <Card className="border-2 border-[#151616]">
                      <CardContent className="p-4">
                        <p className="text-[#151616]/80 whitespace-pre-wrap">
                          {selectedPatient.medicalHistory}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Link href={`/medical/ai-orchestration?patient=${encodeURIComponent(selectedPatient.name)}`}>
                  <Button className="w-full bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:shadow-[1px_1px_0px_0px_#151616] hover:translate-y-0.5 transition-all">
                    <Activity className="w-4 h-4 mr-2" />
                    New AI Diagnosis for {selectedPatient.name}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
