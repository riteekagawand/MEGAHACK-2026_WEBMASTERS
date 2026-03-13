import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Doctor from "@/lib/models/Doctor"

export interface Doctor {
  id: string
  name: string
  specialization: string
  experience: string
  rating: number
  consultationFee: number
  image: string
  bio: string
  availability: {
    day: string
    slots: string[]
  }[]
}

export async function GET() {
  try {
    await connectDB()
    
    const doctors = await Doctor.find({ isActive: true }).select(
      'name specialization yearsOfExperience rating consultationFee description availability totalConsultations'
    )

    const formattedDoctors = doctors.map(doctor => ({
      id: doctor._id.toString(),
      name: doctor.name,
      specialization: doctor.specialization,
      experience: `${doctor.yearsOfExperience} years`,
      rating: doctor.rating,
      consultationFee: doctor.consultationFee,
      image: "/api/placeholder/doctor",
      bio: doctor.description,
      availability: doctor.availability
    }))

    return NextResponse.json({ 
      doctors: formattedDoctors,
      success: true 
    })
  } catch (error) {
    console.error("Error fetching doctors:", error)
    return NextResponse.json(
      { error: "Failed to fetch doctors", success: false },
      { status: 500 }
    )
  }
}
