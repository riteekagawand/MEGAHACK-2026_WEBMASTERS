"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CreditCard,
  Calendar,
  IndianRupee,
  Download,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"

interface PaymentHistory {
  id: string
  patientId: string
  appointmentId: string
  doctorName: string
  amount: number
  paymentId: string
  status: "success" | "failed" | "pending"
  createdAt: string
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaymentHistory()
  }, [])

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch("/api/payment/history")
      const data = await response.json()
      setPayments(data.payments || [])
    } catch (error) {
      console.error("Failed to fetch payment history:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
    <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
      <CardHeader>
        <CardTitle className="font-instrument-serif font-bold text-[#151616] flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-purple-600" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-[#151616]/30 mx-auto mb-4" />
            <p className="text-[#151616]/70 font-poppins">No payment history found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white rounded-xl border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(payment.status)}
                      <h4 className="font-poppins font-bold text-[#151616]">
                        {payment.doctorName}
                      </h4>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#151616]/70">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(payment.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">Payment ID:</span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {payment.paymentId}
                        </code>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-2">
                      <IndianRupee className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-[#151616] text-lg">
                        ₹{payment.amount.toLocaleString()}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-white text-[#151616] border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Receipt
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {payments.length > 0 && (
              <div className="mt-6 p-4 bg-[#D6F32F]/20 rounded-xl border-2 border-[#151616]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-poppins font-bold text-[#151616]">Total Spent</h4>
                    <p className="text-sm text-[#151616]/70">
                      Across {payments.length} transactions
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <IndianRupee className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-[#151616] text-xl">
                      ₹{payments.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
