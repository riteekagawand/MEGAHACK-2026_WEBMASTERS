import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Patient from "@/lib/models/Patient";
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

    const { originalAmount, useCoinDiscount } = await request.json();

    if (!originalAmount || originalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid amount is required" },
        { status: 400 }
      );
    }

    // Get patient's current coin balance
    const patient = await Patient.findOne({
      userId: session.user.email,
      role: "patient",
    }).select("coins");

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    const response = {
      originalAmount,
      discountAmount: 0,
      finalAmount: originalAmount,
      coinsUsed: 0,
      coinsRequired: 100,
      discountPercentage: 20,
      canUseDiscount: patient.coins >= 100,
      currentCoins: patient.coins,
      remainingCoins: patient.coins,
    };

    // Apply discount if requested and user has enough coins
    if (useCoinDiscount && patient.coins >= 100) {
      const discountAmount = Math.floor(originalAmount * 0.2); // 20% discount
      response.discountAmount = discountAmount;
      response.finalAmount = originalAmount - discountAmount;
      response.coinsUsed = 100;
      response.remainingCoins = patient.coins - 100;
    }

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error("Error calculating discount:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate discount",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const patient = await Patient.findOne({
      userId: session.user.email,
      role: "patient",
    }).select("coins");

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      currentCoins: patient.coins,
      coinsRequired: 100,
      discountPercentage: 20,
      canUseDiscount: patient.coins >= 100,
    });
  } catch (error) {
    console.error("Error fetching discount info:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch discount information",
      },
      { status: 500 }
    );
  }
}
