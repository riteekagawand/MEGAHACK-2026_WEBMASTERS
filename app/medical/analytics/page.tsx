"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  PieChart,
  BarChart,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AnalyticsData {
  overview: {
    totalDiagnoses: number
    uniquePatients: number
    avgConfidence: number
  }
  urgencyDistribution: Record<string, number>
  topConditions: { name: string; count: number }[]
  genderDistribution: Record<string, number>
  ageDistribution: Record<string, number>
  trendData: { date: string; count: number }[]
  recentActivity: {
    patientName: string
    diagnosis: string
    urgency: string
    confidence: number
    date: string
  }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?period=${period}`)
      const result = await response.json()
      if (!result.error) {
        setData(result)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'moderate': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Simple bar chart component
  const SimpleBarChart = ({ data, maxValue }: { data: { label: string; value: number }[], maxValue: number }) => (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-[#151616]/70 w-16 truncate">{item.label}</span>
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="h-full bg-[#f9c80e] rounded-full"
            />
          </div>
          <span className="text-xs font-bold text-[#151616] w-8 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  )

  // Simple line chart for trends
  const TrendChart = ({ data }: { data: { date: string; count: number }[] }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1)
    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: 100 - (d.count / maxCount) * 80 - 10
    }))
    
    const pathD = points.length > 0 
      ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
      : ''

    return (
      <div className="h-40 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
          ))}
          {/* Trend line */}
          {pathD && (
            <motion.path
              d={pathD}
              fill="none"
              stroke="#f9c80e"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
          )}
          {/* Data points */}
          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="2"
              fill="#151616"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.02 }}
            />
          ))}
        </svg>
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-[#151616]/50 mt-1">
          {data.filter((_, i) => i % 5 === 0).map((d, i) => (
            <span key={i}>{formatDate(d.date)}</span>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-[#FFFFF4] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f9c80e]" />
        <span className="ml-3 text-[#151616] font-poppins">Loading analytics...</span>
      </div>
    )
  }

  if (!data || data.overview.totalDiagnoses === 0) {
    return (
      <div className="p-6 min-h-screen bg-[#FFFFF4]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#151616]" />
              </div>
              <div>
                <h1 className="text-3xl font-instrument-serif font-bold text-[#151616]">
                  Medical Analytics
                </h1>
                <p className="text-[#151616]/70 font-poppins">
                  Performance metrics and diagnostic insights
                </p>
              </div>
            </div>
          </motion.div>

          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#f9c80e]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-10 h-10 text-[#f9c80e]" />
            </div>
            <h3 className="text-xl font-bold text-[#151616] mb-2">No Data Yet</h3>
            <p className="text-[#151616]/70 mb-4">
              Start making AI diagnoses to see your analytics dashboard.
            </p>
            <Button className="bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
              <Activity className="w-4 h-4 mr-2" />
              Start AI Diagnosis
            </Button>
          </div>
        </div>
      </div>
    )
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#151616]" />
              </div>
              <div>
                <h1 className="text-3xl font-instrument-serif font-bold text-[#151616]">
                  Medical Analytics
                </h1>
                <p className="text-[#151616]/70 font-poppins">
                  Performance metrics and diagnostic insights
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {['7', '30', '90'].map((days) => (
                <Button
                  key={days}
                  variant={period === days ? "default" : "outline"}
                  onClick={() => setPeriod(days)}
                  className={`border-2 border-[#151616] ${
                    period === days 
                      ? 'bg-[#f9c80e] text-[#151616] shadow-[2px_2px_0px_0px_#151616]' 
                      : 'bg-white'
                  }`}
                >
                  {days} Days
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#151616]">{data.overview.totalDiagnoses}</p>
                  <p className="text-sm text-[#151616]/70">Total Diagnoses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#151616]">{data.overview.uniquePatients}</p>
                  <p className="text-sm text-[#151616]/70">Unique Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#f9c80e]/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-[#f9c80e]" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#151616]">{data.overview.avgConfidence}%</p>
                  <p className="text-sm text-[#151616]/70">Avg Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-instrument-serif">
                  <TrendingUp className="w-5 h-5 text-[#f9c80e]" />
                  Diagnosis Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart data={data.trendData} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Urgency Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-instrument-serif">
                  <AlertCircle className="w-5 h-5 text-[#f9c80e]" />
                  Urgency Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.urgencyDistribution).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getUrgencyColor(level)}`} />
                        <span className="text-[#151616] font-medium">{level}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getUrgencyColor(level)}`}
                            style={{ width: `${(count / data.overview.totalDiagnoses) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-[#151616] w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Conditions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-instrument-serif">
                  <BarChart className="w-5 h-5 text-[#f9c80e]" />
                  Top Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={data.topConditions.map(c => ({ label: c.name.slice(0, 12), value: c.count }))}
                  maxValue={Math.max(...data.topConditions.map(c => c.count))}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Demographics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-instrument-serif">
                  <User className="w-5 h-5 text-[#f9c80e]" />
                  Demographics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#151616] mb-2">Gender</h4>
                    <div className="space-y-2">
                      {Object.entries(data.genderDistribution).map(([gender, count]) => (
                        <div key={gender} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-[#151616]/70">{gender}</span>
                          <span className="font-bold text-[#151616]">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#151616] mb-2">Age Groups</h4>
                    <div className="space-y-2">
                      {Object.entries(data.ageDistribution).map(([age, count]) => (
                        <div key={age} className="flex items-center justify-between text-sm">
                          <span className="text-[#151616]/70">{age}</span>
                          <span className="font-bold text-[#151616]">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-instrument-serif">
                <Clock className="w-5 h-5 text-[#f9c80e]" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentActivity.map((activity, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 bg-[#FFFFF4] rounded-xl border border-[#151616]/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#f9c80e] rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-[#151616]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#151616]">{activity.patientName}</p>
                        <p className="text-sm text-[#151616]/70">{activity.diagnosis}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${getUrgencyColor(activity.urgency)} text-white mb-1`}>
                        {activity.urgency}
                      </Badge>
                      <p className="text-xs text-[#151616]/50">
                        {formatDate(activity.date)} • {activity.confidence}% confidence
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
