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
  MessageCircle,
  Star
} from "lucide-react"

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
  createdAt: string
}

export function AppointmentHistory() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const isUpcoming = (dateString: string, timeString: string) => {
    const appointmentDate = new Date(`${dateString} ${timeString}`)
    return appointmentDate > new Date()
  }

  const upcomingAppointments = appointments.filter(apt => 
    apt.status === "scheduled" && isUpcoming(apt.date, apt.time)
  )
  
  const pastAppointments = appointments.filter(apt => 
    apt.status === "completed" || apt.status === "cancelled" || 
    (apt.status === "scheduled" && !isUpcoming(apt.date, apt.time))
  )

  if (loading) {
    return (
      <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
        <CardContent className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-[#151616]/30 border-t-[#151616] rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {upcomingAppointments.length > 0 && (
        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
          <CardHeader>
            <CardTitle className="font-instrument-serif font-bold text-[#151616] flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#D6F32F] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-[#151616]" />
                      </div>
                      <div>
                        <h4 className="font-poppins font-bold text-[#151616]">
                          {appointment.doctorName}
                        </h4>
                        <p className="text-sm text-[#151616]/70">{appointment.specialization}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{formatDate(appointment.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{appointment.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                      <p className="text-sm font-bold text-[#151616] mt-1">
                        ₹{appointment.consultationFee.toLocaleString()}
                      </p>
                      <Button
                        size="sm"
                        className="mt-2 bg-white text-[#151616] border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] text-xs"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Join Call
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
        <CardHeader>
          <CardTitle className="font-instrument-serif font-bold text-[#151616] flex items-center gap-2">
            <Clock className="w-6 h-6 text-gray-600" />
            Appointment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-[#151616]/30 mx-auto mb-4" />
              <p className="text-[#151616]/70 font-poppins">No appointment history found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white rounded-xl border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl border-2 border-[#151616] flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-poppins font-bold text-[#151616]">
                          {appointment.doctorName}
                        </h4>
                        <p className="text-sm text-[#151616]/70">{appointment.specialization}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{formatDate(appointment.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{appointment.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                      <p className="text-sm font-bold text-[#151616] mt-1">
                        ₹{appointment.consultationFee.toLocaleString()}
                      </p>
                      {appointment.status === "completed" && (
                        <Button
                          size="sm"
                          className="mt-2 bg-white text-[#151616] border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] text-xs"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Rate Doctor
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {pastAppointments.length > 0 && (
                <div className="mt-6 p-4 bg-[#D6F32F]/20 rounded-xl border-2 border-[#151616]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-poppins font-bold text-[#151616]">Total Consultations</h4>
                      <p className="text-sm text-[#151616]/70">
                        {pastAppointments.filter(apt => apt.status === "completed").length} completed • {pastAppointments.filter(apt => apt.status === "cancelled").length} cancelled
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#151616]">
                        {pastAppointments.length}
                      </div>
                      <p className="text-sm text-[#151616]/70">appointments</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
