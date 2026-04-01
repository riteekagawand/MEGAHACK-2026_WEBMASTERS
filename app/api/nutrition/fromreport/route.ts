import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import LabReport from "@/lib/models/LabReport";
import { generateNutritionAnalysisV2 } from "@/lib/services/nutrition-v2";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const additionalContext = body?.additionalContext || "";

    await dbConnect();
    const latestReport = await LabReport.findOne({ userId: session.user.email })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestReport) {
      return NextResponse.json(
        { error: "No saved lab report found. Please analyze a lab report first." },
        { status: 404 }
      );
    }

    const keyFindingsText = (latestReport.keyFindings || [])
      .map(
        (f: any) =>
          `${f.parameter}: ${f.value} (Normal: ${f.normalRange}) [${f.status}] - ${f.significance}`
      )
      .join("\n");

    const reportContext = [
      `Report Type: ${latestReport.reportType || "Unknown"}`,
      `Test Date: ${latestReport.testDate || "Unknown"}`,
      `Overall Assessment: ${latestReport.overallAssessment?.status || "Unknown"}`,
      `Risk Level: ${latestReport.overallAssessment?.riskLevel || "Unknown"}`,
      `Assessment Summary: ${latestReport.overallAssessment?.summary || "N/A"}`,
      `Red Flags: ${(latestReport.redFlags || []).join(", ") || "None"}`,
      `Key Findings:\n${keyFindingsText || "No key findings available"}`,
      `Prior Dietary Recommendations: ${
        (latestReport.recommendations?.dietary || []).join(", ") || "None"
      }`,
      additionalContext ? `Additional User Context: ${additionalContext}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const v2Enabled = process.env.NUTRITION_V2_ENABLED === "true";
    if (!v2Enabled) {
      return NextResponse.json(
        {
          error:
            "Nutrition V2 is disabled. Set NUTRITION_V2_ENABLED=true to run LangChain from saved report.",
        },
        { status: 400 }
      );
    }

    const result = await generateNutritionAnalysisV2(reportContext, additionalContext);
    return NextResponse.json({
      ...result,
      engine: "v2",
      engineReason: "Generated from latest saved lab report via LangChain",
    });
  } catch (error) {
    console.error("Error in nutrition fromreport route:", error);
    return NextResponse.json({ 
      error: "Failed to generate nutrition from saved report",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to generate nutrition from latest saved lab report",
  });
}
