"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Stethoscope, User, ArrowRight, Shield, Brain } from "lucide-react"

export default function SelectRolePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")

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

  const handleRoleSelection = async (role: string) => {
    setLoading(true)
    setSelectedRole(role)
    
    try {
      const response = await fetch('/api/user/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })

      if (response.ok) {
        // Force a session update to reflect the new role
        await fetch('/api/auth/session?update')
        
        // Use router.push for better navigation
        if (role === 'clinician') {
          router.push('/medical/dashboard')
        } else {
          router.push('/patient/dashboard')
        }
      } else {
        console.error('Failed to save user role')
        setLoading(false)
        setSelectedRole("")
      }
    } catch (error) {
      console.error('Error saving user role:', error)
      setLoading(false)
      setSelectedRole("")
    }
  }

  const roles = [
    {
      id: "clinician",
      title: "Clinician",
      subtitle: "Doctors, Residents, Specialists",
      description: "Access advanced AI diagnostic tools, patient management, and medical research capabilities",
      icon: Stethoscope,
      features: [
        "Multi-agent diagnostic workflow",
        "Patient case management",
        "Medical literature search",
        "Advanced analytics dashboard",
        "Collaboration tools"
      ],
      color: "#D6F32F"
    },
    {
      id: "patient",
      title: "Patient",
      subtitle: "Healthcare Consumer",
      description: "Get personalized health insights, symptom analysis, and medical guidance",
      icon: User,
      features: [
        "Symptom checker",
        "Health monitoring",
        "Personal medical history",
        "AI health insights",
        "Appointment scheduling"
      ],
      color: "white"
    }
  ]

  return (
    <div className="min-h-screen bg-[#FFFFF4] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(#151616 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
            opacity: "0.05",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-6xl"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="mx-auto w-20 h-20 bg-[#D6F32F] rounded-xl border-2 border-[#151616] flex items-center justify-center mb-6"
            >
              <Brain className="w-10 h-10 text-[#151616]" />
            </motion.div>
            <h1 className="text-4xl font-instrument-serif font-bold text-[#151616] mb-4">
              Welcome to CuraLink
            </h1>
            <p className="text-xl text-[#151616]/70 font-poppins max-w-2xl mx-auto">
              Choose your role to access the appropriate AI-powered medical platform designed for your needs
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {roles.map((role, index) => {
              const Icon = role.icon
              const isSelected = selectedRole === role.id
              const isLoading = loading && isSelected

              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card 
                    className={`border-2 border-[#151616] shadow-[8px_8px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#151616] transition-all duration-200 cursor-pointer h-full ${
                      isSelected ? 'ring-4 ring-[#D6F32F]' : ''
                    }`}
                    onClick={() => !loading && handleRoleSelection(role.id)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="w-16 h-16 rounded-xl border-2 border-[#151616] flex items-center justify-center"
                          style={{ backgroundColor: role.color }}
                        >
                          <Icon
                            className="w-8 h-8"
                            style={{ color: role.color === "#D6F32F" ? "#151616" : "#151616" }}
                          />
                        </div>
                        {isLoading && (
                          <div className="w-6 h-6 border-2 border-[#151616]/30 border-t-[#151616] rounded-full animate-spin"></div>
                        )}
                      </div>
                      <CardTitle className="text-2xl font-poppins font-bold text-[#151616] mb-2">
                        {role.title}
                      </CardTitle>
                      <CardDescription className="text-[#151616]/70 font-poppins text-lg">
                        {role.subtitle}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-[#151616]/80 font-poppins">
                        {role.description}
                      </p>
                      
                      <div className="space-y-2">
                        <h4 className="font-poppins font-semibold text-[#151616]">Key Features:</h4>
                        <ul className="space-y-1">
                          {role.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm font-poppins text-[#151616]/70">
                              <div className="w-1.5 h-1.5 bg-[#D6F32F] rounded-full"></div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        disabled={loading}
                        className={`w-full mt-6 border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all duration-200 font-poppins font-medium ${
                          role.color === "#D6F32F" 
                            ? "bg-[#D6F32F] hover:bg-[#D6F32F]/90 text-[#151616]"
                            : "bg-white hover:bg-[#FFFFF4] text-[#151616]"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          !loading && handleRoleSelection(role.id)
                        }}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-[#151616]/30 border-t-[#151616] rounded-full animate-spin"></div>
                            Setting up...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            Continue as {role.title}
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-sm font-poppins text-[#151616]/60">
              <Shield className="w-4 h-4" />
              <span>Your data is secure and HIPAA compliant</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
