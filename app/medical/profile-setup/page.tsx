"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Stethoscope, Clock, DollarSign, User, FileText, Calendar } from "lucide-react"

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
]

const SPECIALIZATIONS = [
  "General Medicine",
  "Cardiology", 
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Gynecology",
  "ENT",
  "Ophthalmology",
  "Radiology",
  "Pathology"
]

export default function ClinicianProfileSetup() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    specialization: "",
    yearsOfExperience: "",
    consultationFee: "",
    description: "",
    availability: {} as Record<string, string[]>
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFF4]">
        <div className="w-8 h-8 border-4 border-[#151616]/30 border-t-[#151616] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: prev.availability[day] ? [] : []
      }
    }))
  }

  const handleTimeSlotToggle = (day: string, slot: string) => {
    setFormData(prev => {
      const daySlots = prev.availability[day] || []
      const newSlots = daySlots.includes(slot) 
        ? daySlots.filter(s => s !== slot)
        : [...daySlots, slot].sort()
      
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [day]: newSlots
        }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const availability = Object.entries(formData.availability)
        .filter(([day, slots]) => slots.length > 0)
        .map(([day, slots]) => ({ day, slots }))

      const profileData = {
        name: session.user?.name || "",
        email: session.user?.email || "",
        specialization: formData.specialization,
        yearsOfExperience: parseInt(formData.yearsOfExperience),
        consultationFee: parseInt(formData.consultationFee),
        description: formData.description,
        availability
      }

      const response = await fetch("/api/doctors/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        router.push("/medical/dashboard")
      } else {
        const error = await response.json()
        alert(error.message || "Failed to save profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Failed to save profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFFF4] p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-instrument-serif font-bold text-[#151616] mb-2">
            Complete Your Profile
          </h1>
          <p className="text-[#151616]/70 font-poppins">
            Set up your professional details to start accepting appointments
          </p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                <CardHeader>
                  <CardTitle className="font-instrument-serif font-bold text-[#151616] flex items-center gap-2">
                    <User className="w-6 h-6 text-blue-600" />
                    Professional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="specialization" className="text-[#151616] font-medium">
                      Specialization
                    </Label>
                    <Select onValueChange={(value) => setFormData(prev => ({ ...prev, specialization: value }))}>
                      <SelectTrigger className="mt-2 border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
                        <SelectValue placeholder="Select your specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALIZATIONS.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience" className="text-[#151616] font-medium">
                      Years of Experience
                    </Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      max="50"
                      placeholder="e.g., 5"
                      value={formData.yearsOfExperience}
                      onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                      className="mt-2 border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="fee" className="text-[#151616] font-medium">
                      Consultation Fee (₹)
                    </Label>
                    <Input
                      id="fee"
                      type="number"
                      min="100"
                      max="10000"
                      placeholder="e.g., 2500"
                      value={formData.consultationFee}
                      onChange={(e) => setFormData(prev => ({ ...prev, consultationFee: e.target.value }))}
                      className="mt-2 border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-[#151616] font-medium">
                      About You
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description about your expertise and approach..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-2 border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] min-h-24"
                      maxLength={500}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                <CardHeader>
                  <CardTitle className="font-instrument-serif font-bold text-[#151616] flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-green-600" />
                    Availability Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={!!formData.availability[day]}
                          onCheckedChange={() => handleDayToggle(day)}
                        />
                        <Label htmlFor={day} className="text-[#151616] font-medium">
                          {day}
                        </Label>
                      </div>
                      
                      {formData.availability[day] !== undefined && (
                        <div className="ml-6 grid grid-cols-4 gap-2">
                          {TIME_SLOTS.map((slot) => (
                            <Button
                              key={slot}
                              type="button"
                              size="sm"
                              onClick={() => handleTimeSlotToggle(day, slot)}
                              className={`text-xs ${
                                formData.availability[day]?.includes(slot)
                                  ? "bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]"
                                  : "bg-white text-[#151616] border-2 border-[#151616] hover:bg-[#f9c80e]/20 shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616]"
                              }`}
                            >
                              {slot}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <Button
              type="submit"
              disabled={loading || !formData.specialization || !formData.yearsOfExperience || !formData.consultationFee || !formData.description}
              className="bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#151616] disabled:opacity-50 disabled:cursor-not-allowed font-poppins font-bold px-8 py-3"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              {loading ? "Setting Up Profile..." : "Complete Profile Setup"}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  )
}
