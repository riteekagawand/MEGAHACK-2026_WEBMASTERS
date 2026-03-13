"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, FileText, Users, TrendingUp, Stethoscope, Activity, Plus, BarChart3, Calendar, Clock, IndianRupee, UserCheck } from "lucide-react"

interface DoctorAppointment {
  id: string
  appointmentId: string
  patientName: string
  date: string
  time: string
  status: string
  consultationFee: number
  paymentStatus: string
}

export default function MedicalDashboard() {
  const router = useRouter()
  const { data: session } = useSession()
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([])
  const [doctorInfo, setDoctorInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkDoctorProfile()
    fetchAppointments()
  }, [])

  const checkDoctorProfile = async () => {
    try {
      const response = await fetch("/api/doctors/profile")
      if (response.ok) {
        setHasProfile(true)
      } else if (response.status === 404) {
        setHasProfile(false)
        router.push("/medical/profile-setup")
      }
    } catch (error) {
      console.error("Error checking doctor profile:", error)
      setHasProfile(false)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/doctors/appointments")
      const data = await response.json()
      
      if (data.success) {
        setAppointments(data.appointments || [])
        setDoctorInfo(data.doctorInfo)
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  if (hasProfile === false) {
    return null // Will redirect to profile setup
  }

  const dashboardOptions = [
    {
      title: "AI Agent Orchestration",
      description: "Multi-agent AI system for comprehensive medical diagnosis",
      icon: Brain,
      color: "#f9c80e",
      path: "/medical/ai-orchestration",
      isNew: true
    },
    {
      title: "Patient Management",
      description: "Manage patient records and medical history",
      icon: Users,
      color: "white",
      path: "/medical/patients"
    },
    {
      title: "Medical Analytics",
      description: "View diagnostic trends and performance metrics",
      icon: BarChart3,
      color: "white",
      path: "/medical/analytics"
    },
    {
      title: "Research Portal",
      description: "Access medical literature and research tools",
      icon: FileText,
      color: "white",
      path: "/medical/research"
    },
    {
      title: "Clinical Workflow",
      description: "Streamlined clinical decision support",
      icon: Stethoscope,
      color: "white",
      path: "/medical/workflow"
    },
    {
      title: "Health Monitoring",
      description: "Real-time patient monitoring and alerts",
      icon: Activity,
      color: "white",
      path: "/medical/monitoring"
    }
  ]

  const recentStats = [
    { label: "Diagnoses Today", value: "24", change: "+12%" },
    { label: "Patients Seen", value: "18", change: "+8%" },
    { label: "AI Accuracy", value: "94.2%", change: "+2.1%" },
    { label: "Avg. Time Saved", value: "18min", change: "+5min" }
  ]

  return (
    <div className="min-h-screen bg-[#FFFFF4] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-instrument-serif font-bold text-[#151616] mb-2">
            Medical AI Command Center
          </h1>
          <p className="text-xl font-poppins text-[#151616]/70">
            AI-powered medical diagnosis system for clinicians
          </p>
          {doctorInfo && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <Badge className="bg-[#f9c80e] text-[#151616] border-[#151616]">
                {doctorInfo.specialization}
              </Badge>
              <span className="text-[#151616]/70">
                {doctorInfo.totalConsultations} consultations completed
              </span>
            </div>
          )}
        </motion.div>

        {/* Appointments Section */}
        {!loading && appointments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
              <CardHeader>
                <CardTitle className="font-instrument-serif font-bold text-[#151616] flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  Your Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {appointments.slice(0, 6).map((appointment, index) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="p-4 bg-white rounded-xl border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-poppins font-bold text-[#151616] text-sm">
                          {appointment.patientName}
                        </h4>
                        <Badge 
                          className={
                            appointment.status === "scheduled" 
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : appointment.status === "completed"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-[#151616]/70">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(appointment.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{appointment.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          <span>₹{appointment.consultationFee}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {appointments.length > 6 && (
                  <div className="mt-4 text-center">
                    <Button
                      onClick={() => router.push("/medical/appointments")}
                      className="bg-white text-[#151616] border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616]"
                    >
                      View All {appointments.length} Appointments
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {recentStats.map((stat, index) => (
            <Card key={stat.label} className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-poppins text-[#151616]/60 mb-1">{stat.label}</p>
                    <p className="text-2xl font-poppins font-bold text-[#151616]">{stat.value}</p>
                  </div>
                  <div className="text-xs font-poppins text-green-600 bg-green-100 px-2 py-1 rounded">
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Main Dashboard Options */}
        <div className="space-y-8">
          {/* AI Agent Orchestration - Main Focus */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            {dashboardOptions.filter(option => option.title === "AI Agent Orchestration").map((option, index) => {
            const Icon = option.icon
            return (
              <motion.div
                key={option.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="w-full max-w-2xl"
              >
                <Card 
                  className={`border-4 border-[#151616] shadow-[16px_16px_0px_0px_#151616] hover:translate-y-2 hover:shadow-[8px_8px_0px_0px_#151616] transition-all duration-300 cursor-pointer h-full relative ring-8 ring-[#f9c80e] bg-gradient-to-br from-white to-[#FFFFF4]`}
                  onClick={() => router.push(option.path)}
                >
                  {option.isNew && (
                    <div className="absolute -top-4 -right-4 z-10">
                      <div className="bg-[#f9c80e] border-4 border-[#151616] rounded-full px-6 py-2 shadow-[4px_4px_0px_0px_#151616]">
                        <span className="text-sm font-poppins font-bold text-[#151616]">NEW</span>
                      </div>
                    </div>
                  )}
                  
                  <CardHeader className="pb-8 pt-8">
                    <div className="flex items-center justify-center mb-8">
                      <div
                        className="w-24 h-24 rounded-2xl border-4 border-[#151616] flex items-center justify-center shadow-[8px_8px_0px_0px_#151616]"
                        style={{ backgroundColor: option.color }}
                      >
                        <Icon
                          className="w-12 h-12"
                          style={{ color: option.color === "#f9c80e" ? "#151616" : "#151616" }}
                        />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-poppins font-bold text-[#151616] mb-4 text-center">
                      {option.title}
                    </CardTitle>
                    <CardDescription className="text-lg text-[#151616]/70 font-poppins text-center leading-relaxed">
                      {option.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-4 pb-8">
                    <Button
                      className="w-full h-16 border-4 border-[#151616] shadow-[8px_8px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#151616] transition-all duration-300 font-poppins font-bold text-lg bg-[#f9c80e] hover:bg-[#f9c80e]/90 text-[#151616]"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(option.path)
                      }}
                    >
                      Start Diagnosis
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
          </motion.div>

          {/* Secondary Options */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            {dashboardOptions.filter(option => 
              option.title === "Patient Management" || option.title === "Medical Analytics"
            ).map((option, index) => {
              const Icon = option.icon
              return (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                > 
                  <Card 
                    className="border-2 border-[#151616] shadow-[6px_6px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_#151616] transition-all duration-200 cursor-pointer h-full"
                    onClick={() => router.push(option.path)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="w-14 h-14 rounded-xl border-2 border-[#151616] flex items-center justify-center bg-white"
                        >
                          <Icon className="w-7 h-7 text-[#151616]" />
                        </div>
                      </div>
                      <CardTitle className="text-xl font-poppins font-bold text-[#151616] mb-2">
                        {option.title}
                      </CardTitle>
                      <CardDescription className="text-[#151616]/70 font-poppins">
                        {option.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <Button
                        className="w-full border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all duration-200 font-poppins font-medium bg-white hover:bg-[#FFFFF4] text-[#151616]"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(option.path)
                        }}
                      >
                        Open
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div> */}
        </div>
      </div>
    </div>
  )
}