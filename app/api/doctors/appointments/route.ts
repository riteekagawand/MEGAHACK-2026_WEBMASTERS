import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Appointment from "@/lib/models/Appointment"
import Doctor from "@/lib/models/Doctor"

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

    // Get doctor's ID from their profile
    const doctor = await Doctor.findOne({ userId: session.user.email })
    
    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor profile not found. Please complete your profile setup." },
        { status: 404 }
      )
    }

    // Get all appointments for this doctor
    const appointments = await Appointment.find({ 
      doctorId: doctor._id.toString() 
    }).sort({ date: 1, time: 1 })

    const formattedAppointments = appointments.map(apt => ({
      id: apt._id.toString(),
      appointmentId: apt.appointmentId,
      patientId: apt.patientId,
      patientName: apt.patientName,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      consultationFee: apt.consultationFee,
      paymentStatus: apt.paymentStatus,
      notes: apt.notes,
      prescription: apt.prescription,
      createdAt: apt.createdAt.toISOString()
    }))

    return NextResponse.json({ 
      appointments: formattedAppointments,
      doctorInfo: {
        name: doctor.name,
        specialization: doctor.specialization,
        totalConsultations: doctor.totalConsultations
      },
      success: true 
    })
  } catch (error) {
    console.error("Failed to fetch doctor appointments:", error)
    return NextResponse.json(
      { error: "Failed to fetch appointments", success: false },
      { status: 500 }
    )
  }
}
