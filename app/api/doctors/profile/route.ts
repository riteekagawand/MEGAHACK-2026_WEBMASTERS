import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Doctor from "@/lib/models/Doctor"

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
    const {
      name,
      email,
      specialization,
      yearsOfExperience,
      consultationFee,
      description,
      availability
    } = body

    if (!specialization || !yearsOfExperience || !consultationFee || !description || !availability || availability.length === 0) {
      return NextResponse.json(
        { error: "All fields are required and you must set at least one availability day" },
        { status: 400 }
      )
    }

    // Check if doctor profile already exists
    const existingDoctor = await Doctor.findOne({ userId: session.user.email })
    
    if (existingDoctor) {
      return NextResponse.json(
        { error: "Doctor profile already exists" },
        { status: 409 }
      )
    }

    // Create new doctor profile
    const doctor = new Doctor({
      userId: session.user.email,
      name: name || session.user.name,
      email: email || session.user.email,
      specialization,
      yearsOfExperience: parseInt(yearsOfExperience),
      consultationFee: parseInt(consultationFee),
      description,
      availability,
      bookedSlots: [],
      rating: 4.5,
      totalConsultations: 0,
      isActive: true
    })

    await doctor.save()

    return NextResponse.json({
      message: "Doctor profile created successfully",
      doctorId: doctor._id,
      success: true
    })

  } catch (error) {
    console.error("Error creating doctor profile:", error)
    return NextResponse.json(
      { error: "Failed to create doctor profile" },
      { status: 500 }
    )
  }
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

    const doctor = await Doctor.findOne({ userId: session.user.email })
    
    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      doctor,
      success: true
    })

  } catch (error) {
    console.error("Error fetching doctor profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch doctor profile" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const updates = body

    const doctor = await Doctor.findOneAndUpdate(
      { userId: session.user.email },
      { $set: updates },
      { new: true }
    )

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: "Doctor profile updated successfully",
      doctor,
      success: true
    })

  } catch (error) {
    console.error("Error updating doctor profile:", error)
    return NextResponse.json(
      { error: "Failed to update doctor profile" },
      { status: 500 }
    )
  }
}
