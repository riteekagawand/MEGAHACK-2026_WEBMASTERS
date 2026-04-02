"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  User,
  IndianRupee,
  Stethoscope,
  Video,
  Building,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { formatMeetingLink } from "@/lib/utils/meeting-link"

interface Appointment {
  id: string
  patientId: string
  doctorId: string
  doctorName: string
  specialization: string
  date: string
  time: string
  status: "scheduled" | "completed" | "cancelled"
  consultationFee: number
  paymentId?: string
  consultationType?: "virtual" | "physical"
  meetingLink?: string
  createdAt: string
}

export default function BookingHistoryPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "scheduled" | "completed" | "cancelled">("all")

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments")
      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <CheckCircle className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleJoinMeeting = (meetingLink: string) => {
    window.open(meetingLink, '_blank', 'noopener,noreferrer')
  }

  const filteredAppointments = filter === "all" 
    ? appointments 
    : appointments.filter(apt => apt.status === filter)

  return (
    <div className="min-h-screen bg-[#FFFFF4] p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-instrument-serif font-bold text-[#151616] mb-2">
            Booking History
          </h1>
          <p className="text-[#151616]/70 font-poppins">
            View all your appointment bookings and meeting links
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "scheduled", "completed", "cancelled"] as const).map((f) => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              className={`border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] transition-all ${
                filter === f
                  ? "bg-[#f9c80e] text-[#151616]"
                  : "bg-white text-[#151616] hover:bg-[#f9c80e]/20"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {loading ? (
          <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
            <CardContent className="p-8">
              <p className="text-center text-[#151616]/70">Loading your bookings...</p>
            </CardContent>
          </Card>
        ) : filteredAppointments.length === 0 ? (
          <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
            <CardContent className="p-8">
              <p className="text-center text-[#151616]/70">No appointments found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-14 h-14 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="w-7 h-7 text-[#151616]" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-poppins font-bold text-[#151616] text-lg">
                              {appointment.doctorName}
                            </h3>
                            <Badge className={`${getStatusColor(appointment.status)} flex items-center gap-1`}>
                              {getStatusIcon(appointment.status)}
                              <span className="capitalize">{appointment.status}</span>
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-[#151616]/70 mb-3">{appointment.specialization}</p>
                          
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-[#151616]/70">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-green-600" />
                              <span>{formatDate(appointment.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span>{appointment.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <IndianRupee className="w-4 h-4 text-green-600" />
                              <span>₹{appointment.consultationFee.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {appointment.consultationType === "virtual" ? (
                                <Video className="w-4 h-4 text-purple-600" />
                              ) : (
                                <Building className="w-4 h-4 text-orange-600" />
                              )}
                              <span className="capitalize">
                                {appointment.consultationType || "physical"} Consultation
                              </span>
                            </div>
                          </div>

                          {/* Meeting Link for Virtual Consultations */}
                          {appointment.consultationType === "virtual" && appointment.meetingLink && appointment.status !== "cancelled" && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-purple-100 rounded-lg border-2 border-purple-300 flex items-center justify-center">
                                    <Video className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-purple-900 text-sm">Google Meet Link</p>
                                    <p className="text-xs text-purple-700 font-mono">
                                      {formatMeetingLink(appointment.meetingLink)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleJoinMeeting(appointment.meetingLink!)}
                                  className="bg-purple-600 text-white border-2 border-purple-800 shadow-[2px_2px_0px_0px_#5B2A6E] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#5B2A6E] transition-all"
                                  size="sm"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Join Meeting
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-[#151616]/50 mb-1">Booked on</p>
                        <p className="text-sm text-[#151616]/70">
                          {new Date(appointment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
