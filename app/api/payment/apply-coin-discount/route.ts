import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Patient from "@/lib/models/Patient";
import { CoinTransaction } from "@/lib/models/CoinTransaction";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const {
      appointmentId,
      originalAmount,
      discountAmount,
      finalAmount,
      paymentId,
    } = await request.json();

    if (!appointmentId || !originalAmount || !discountAmount || !finalAmount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get patient and verify they have enough coins
    const patient = await Patient.findOne({
      userId: session.user.email,
      role: "patient",
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    if (patient.coins < 100) {
      return NextResponse.json(
        { success: false, error: "Insufficient coins for discount" },
        { status: 400 }
      );
    }

    // Deduct coins from patient account
    const updatedPatient = await Patient.findByIdAndUpdate(
      patient._id,
      {
        $inc: { coins: -100 }, // Deduct 100 coins
      },
      { new: true }
    );

    // Create a coin transaction record for the discount usage
    const discountTransaction = new CoinTransaction({
      userId: patient._id,
      taskId: `discount_${appointmentId}`,
      taskTitle: "Appointment Discount Applied",
      taskCategory: "medical",
      coinsEarned: -100, // Negative because coins were spent
      difficulty: "easy",
      streakAtCompletion: 0,
      bonusCoins: 0,
      totalCoinsAwarded: -100,
      completedAt: new Date(),
    });

    await discountTransaction.save();

    return NextResponse.json({
      success: true,
      transaction: {
        id: discountTransaction._id,
        coinsUsed: 100,
        discountAmount,
        savedAmount: discountAmount,
      },
      userData: {
        coins: updatedPatient.coins,
        level: updatedPatient.level,
        streak: updatedPatient.streak,
        completedTasks: updatedPatient.completedTasks,
        totalEarned: updatedPatient.totalEarned,
      },
      discountDetails: {
        originalAmount,
        discountAmount,
        finalAmount,
        discountPercentage: 20,
        coinsUsed: 100,
      },
    });
  } catch (error) {
    console.error("Error applying coin discount:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to apply coin discount",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
