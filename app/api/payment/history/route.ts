import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Payment from "@/lib/models/Payment"
import Appointment from "@/lib/models/Appointment"

export interface PaymentHistory {
  id: string
  patientId: string
  appointmentId: string
  doctorName: string
  amount: number
  paymentId: string
  status: "success" | "failed" | "pending"
  createdAt: string
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await connectDB()

    const payments = await Payment.find({ 
      patientId: session.user.email 
    }).sort({ createdAt: -1 })

    // Get appointment details to include doctor names
    const appointmentIds = payments.map(p => p.appointmentId)
    const appointments = await Appointment.find({
      appointmentId: { $in: appointmentIds }
    })

    const appointmentMap = new Map()
    appointments.forEach(apt => {
      appointmentMap.set(apt.appointmentId, apt)
    })

    const formattedPayments = payments.map(payment => {
      const appointment = appointmentMap.get(payment.appointmentId)
      return {
        id: payment._id.toString(),
        patientId: payment.patientId,
        appointmentId: payment.appointmentId,
        doctorName: appointment?.doctorName || "Unknown Doctor",
        amount: payment.amount,
        paymentId: payment.razorpayPaymentId || payment.paymentId,
        status: payment.status === "completed" ? "success" : payment.status,
        createdAt: payment.createdAt.toISOString()
      }
    })

    return NextResponse.json({ 
      payments: formattedPayments,
      success: true 
    })
  } catch (error) {
    console.error("Failed to fetch payment history:", error)
    return NextResponse.json(
      { error: "Failed to fetch payment history", success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { appointmentId, doctorId, amount, razorpayPaymentId, razorpayOrderId, status } = body

    if (!appointmentId || !doctorId || !amount || !razorpayPaymentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create unique payment ID
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const payment = new Payment({
      paymentId,
      appointmentId,
      patientId: session.user.email,
      doctorId,
      amount,
      currency: "INR",
      status: status || "completed",
      razorpayOrderId,
      razorpayPaymentId
    })

    await payment.save()

    return NextResponse.json({ 
      payment: {
        id: payment._id.toString(),
        paymentId: payment.paymentId,
        appointmentId: payment.appointmentId,
        amount: payment.amount,
        status: payment.status
      },
      success: true 
    })
  } catch (error) {
    console.error("Failed to record payment:", error)
    return NextResponse.json(
      { error: "Failed to record payment", success: false },
      { status: 500 }
    )
  }
}
