"use client"

import React from "react"
import { motion } from "framer-motion"
import { PaymentHistory } from "@/components/patient/payment-history"
import { AppointmentHistory } from "@/components/patient/appointment-history"

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-[#FFFFF4] p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-instrument-serif font-bold text-[#151616] mb-2">
            Medical History
          </h1>
          <p className="text-[#151616]/70 font-poppins">
            View your appointment history and payment transactions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AppointmentHistory />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PaymentHistory />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
