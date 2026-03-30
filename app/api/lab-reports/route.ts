import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import LabReport from "@/lib/models/LabReport";
import dbConnect from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const reports = await LabReport.find({ userId: session.user.email })
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching lab reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      reportType,
      testDate,
      keyFindings,
      overallAssessment,
      recommendations,
      redFlags,
      confidence,
      additionalInfo,
    } = body;

    const labReport = await LabReport.create({
      userId: session.user.email,
      reportType,
      testDate,
      keyFindings,
      overallAssessment,
      recommendations,
      redFlags,
      confidence,
      additionalInfo,
    });

    return NextResponse.json({
      success: true,
      reportId: labReport._id,
      message: "Lab report saved successfully",
    });
  } catch (error) {
    console.error("Error saving lab report:", error);
    return NextResponse.json(
      { error: "Failed to save lab report" },
      { status: 500 }
    );
  }
}
