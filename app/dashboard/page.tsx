"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Users, FileText, Activity, TrendingUp, Calendar } from "lucide-react"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.user?.email) {
      // Check user role and redirect accordingly
      const checkUserInfo = async () => {
        try {
          const response = await fetch('/api/user/info')
          const data = await response.json()
          
          if (!data.role) {
            router.push('/select-role')
            return
          }
          
          if (data.role === 'clinician') {
            router.push('/medical/dashboard')
            return
          }
          
          if (data.role === 'patient') {
            router.push('/patient/dashboard')
            return
          }
        } catch (error) {
          console.error('Error checking user info:', error)
          router.push('/select-role')
        }
      }
      checkUserInfo()
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#151616]/30 border-t-[#151616] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const stats = [
    {
      title: "AI Diagnoses Today",
      value: "24",
      change: "+12%",
      icon: Brain,
      color: "#D6F32F"
    },
    {
      title: "Active Cases",
      value: "156",
      change: "+8%",
      icon: FileText,
      color: "#151616"
    },
    {
      title: "Team Consultations",
      value: "48",
      change: "+15%",
      icon: Users,
      color: "#D6F32F"
    },
    {
      title: "Patient Satisfaction",
      value: "98.5%",
      change: "+2%",
      icon: Activity,
      color: "#151616"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-instrument-serif font-bold text-[#151616] mb-2">
          Welcome back, {session.user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-[#151616]/70 font-poppins">
          Your AI-powered medical platform is ready to assist with diagnoses and patient care.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl border-2 border-[#151616] flex items-center justify-center"
                      style={{ backgroundColor: stat.color === "#D6F32F" ? "#D6F32F" : "white" }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: stat.color === "#D6F32F" ? "#151616" : "#151616" }}
                      />
                    </div>
                    <span className="text-sm font-poppins font-medium text-green-600">
                      {stat.change}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-2xl font-poppins font-bold text-[#151616]">
                      {stat.value}
                    </p>
                    <p className="text-sm font-poppins text-[#151616]/70">
                      {stat.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent AI Diagnoses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
            <CardHeader>
              <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Recent AI Diagnoses
              </CardTitle>
              <CardDescription className="font-poppins">
                Latest cases processed by your AI agent team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { patient: "John D.", condition: "Dengue Fever", confidence: "85%", time: "2 hours ago" },
                  { patient: "Sarah M.", condition: "Migraine", confidence: "92%", time: "4 hours ago" },
                  { patient: "Robert K.", condition: "Pneumonia", confidence: "78%", time: "6 hours ago" }
                ].map((case_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#FFFFF4] rounded-xl border border-[#151616]/20">
                    <div>
                      <p className="font-poppins font-medium text-[#151616]">{case_.patient}</p>
                      <p className="text-sm font-poppins text-[#151616]/70">{case_.condition}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-poppins font-medium text-[#151616]">{case_.confidence}</p>
                      <p className="text-xs font-poppins text-[#151616]/60">{case_.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
            <CardHeader>
              <CardTitle className="font-poppins font-bold text-[#151616]">
                Quick Actions
              </CardTitle>
              <CardDescription className="font-poppins">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-[#D6F32F] rounded-xl border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all duration-200 font-poppins font-medium text-[#151616]">
                  <Brain className="w-4 h-4" />
                  Start AI Diagnosis
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all duration-200 font-poppins font-medium text-[#151616]">
                  <FileText className="w-4 h-4" />
                  View Patient Cases
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all duration-200 font-poppins font-medium text-[#151616]">
                  <Calendar className="w-4 h-4" />
                  Schedule Consultation
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}