import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LabReport from "@/lib/models/LabReport";
import dbConnect from "@/lib/mongodb";

const FINDING_STATUS_VALUES = ["Normal", "High", "Low", "Critical"] as const;
const ASSESSMENT_STATUS_VALUES = [
  "Normal",
  "Attention Needed",
  "Urgent Care Required",
] as const;
const RISK_LEVEL_VALUES = ["Low", "Medium", "High"] as const;

function normalizeEnumValue<T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
  fallback: T[number]
): T[number] {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  const exactMatch = allowedValues.find(
    (option) => option.toLowerCase() === normalized
  );
  if (exactMatch) {
    return exactMatch;
  }

  const containsMatch = allowedValues.find((option) =>
    normalized.includes(option.toLowerCase())
  );
  return containsMatch ?? fallback;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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
    const session = await getServerSession(authOptions);
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

    const normalizedKeyFindings = Array.isArray(keyFindings)
      ? keyFindings.map((finding: any) => ({
          parameter: finding?.parameter || "Unknown",
          value: finding?.value || "N/A",
          normalRange: finding?.normalRange || "N/A",
          status: normalizeEnumValue(
            finding?.status,
            FINDING_STATUS_VALUES,
            "Normal"
          ),
          significance: finding?.significance || "Not specified",
        }))
      : [];

    const normalizedOverallAssessment = {
      status: normalizeEnumValue(
        overallAssessment?.status,
        ASSESSMENT_STATUS_VALUES,
        "Attention Needed"
      ),
      summary: overallAssessment?.summary || "Assessment available",
      riskLevel: normalizeEnumValue(
        overallAssessment?.riskLevel,
        RISK_LEVEL_VALUES,
        "Medium"
      ),
    };

    const labReport = await LabReport.create({
      userId: session.user.email,
      reportType: reportType || "Lab Report",
      testDate: testDate || "Unknown",
      keyFindings: normalizedKeyFindings,
      overallAssessment: normalizedOverallAssessment,
      recommendations: {
        immediate: Array.isArray(recommendations?.immediate)
          ? recommendations.immediate
          : [],
        lifestyle: Array.isArray(recommendations?.lifestyle)
          ? recommendations.lifestyle
          : [],
        followUp: Array.isArray(recommendations?.followUp)
          ? recommendations.followUp
          : [],
        dietary: Array.isArray(recommendations?.dietary)
          ? recommendations.dietary
          : [],
      },
      redFlags: Array.isArray(redFlags) ? redFlags : [],
      confidence:
        typeof confidence === "number" && Number.isFinite(confidence)
          ? confidence
          : 80,
      additionalInfo:
        typeof additionalInfo === "string" ? additionalInfo : undefined,
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
