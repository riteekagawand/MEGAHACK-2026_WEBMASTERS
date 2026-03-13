import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Doctor from "@/lib/models/Doctor"
import mongoose from "mongoose"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid doctor ID" },
        { status: 400 }
      )
    }
    
    const doctor = await Doctor.findById(params.id)
    
    if (!doctor || !doctor.isActive) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      )
    }

    const formattedDoctor = {
      id: doctor._id.toString(),
      name: doctor.name,
      specialization: doctor.specialization,
      experience: `${doctor.yearsOfExperience} years`,
      rating: doctor.rating,
      consultationFee: doctor.consultationFee,
      image: "/api/placeholder/doctor",
      bio: doctor.description,
      availability: doctor.availability
    }

    return NextResponse.json({ 
      doctor: formattedDoctor,
      success: true 
    })
  } catch (error) {
    console.error("Error fetching doctor:", error)
    return NextResponse.json(
      { error: "Failed to fetch doctor", success: false },
      { status: 500 }
    )
  }
}
