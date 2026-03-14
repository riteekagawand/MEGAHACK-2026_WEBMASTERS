import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Appointment from "@/lib/models/Appointment"
import Doctor from "@/lib/models/Doctor"
import Payment from "@/lib/models/Payment"

export interface Appointment {
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
    
    const appointments = await Appointment.find({ 
      patientId: session.user.email 
    }).sort({ createdAt: -1 })

    const formattedAppointments = appointments.map(apt => ({
      id: apt._id.toString(),
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      doctorName: apt.doctorName,
      specialization: apt.specialization,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      consultationFee: apt.consultationFee,
      paymentId: apt.paymentId,
      createdAt: apt.createdAt.toISOString()
    }))

    return NextResponse.json({ 
      appointments: formattedAppointments,
      success: true 
    })
  } catch (error) {
    console.error("Failed to fetch appointments:", error)
    return NextResponse.json(
      { error: "Failed to fetch appointments", success: false },
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
    const { doctorId, doctorName, specialization, date, time, consultationFee, paymentId } = body

    if (!doctorId || !doctorName || !date || !time || !consultationFee) {
      return NextResponse.json(
        { error: "Missing required fields", success: false },
        { status: 400 }
      )
    }

    // Check if the slot is still available
    const doctor = await Doctor.findById(doctorId)
    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found", success: false },
        { status: 404 }
      )
    }

    // Check if slot is already booked
    if (!doctor.isSlotAvailable(date, time)) {
      return NextResponse.json(
        { error: "This time slot is no longer available", success: false },
        { status: 409 }
      )
    }

    // Create unique appointment ID
    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create the appointment
    const appointment = new Appointment({
      appointmentId,
      patientId: session.user.email,
      doctorId,
      patientName: session.user.name || "",
      doctorName,
      specialization,
      date,
      time,
      consultationFee,
      status: "scheduled",
      paymentId,
      paymentStatus: paymentId ? "completed" : "pending"
    })

    await appointment.save()

    // Book the slot with the doctor
    await doctor.bookSlot(date, time, session.user.email)

    console.log("New appointment created:", appointment.appointmentId)

    return NextResponse.json({ 
      appointment: {
        id: appointment._id.toString(),
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        specialization: appointment.specialization,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        consultationFee: appointment.consultationFee,
        paymentId: appointment.paymentId,
        createdAt: appointment.createdAt.toISOString()
      },
      success: true 
    })
  } catch (error) {
    console.error("Failed to create appointment:", error)
    return NextResponse.json(
      { error: "Failed to create appointment", success: false },
      { status: 500 }
    )
  }
}
