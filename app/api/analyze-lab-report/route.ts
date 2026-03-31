import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_GENERATE_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 800;

function getErrorStatusCode(error: unknown): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  parts: unknown[]
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_GENERATE_RETRIES; attempt++) {
    try {
      return await model.generateContent(parts);
    } catch (error) {
      lastError = error;
      const statusCode = getErrorStatusCode(error);
      const isRetryable =
        statusCode !== null && RETRYABLE_STATUS_CODES.has(statusCode);

      if (!isRetryable || attempt === MAX_GENERATE_RETRIES) {
        throw error;
      }

      const jitterMs = Math.floor(Math.random() * 200);
      const delayMs = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1) + jitterMs;
      await sleep(delayMs);
    }
  }

  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const { image, additionalInfo } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare the comprehensive prompt
    const prompt = `You are an expert medical AI assistant specializing in laboratory report analysis. Analyze the medical lab report image provided and give comprehensive insights.

${additionalInfo ? `Patient Context: ${additionalInfo}` : ""}

Please analyze the lab report and provide detailed information in the following JSON format:

{
  "reportType": "Blood Test/Urine Test/X-Ray/CT Scan/etc.",
  "testDate": "Date of the test if visible",
  "keyFindings": [
    {
      "parameter": "Test parameter name (e.g., Hemoglobin, Glucose, etc.)",
      "value": "Patient's actual value",
      "normalRange": "Normal reference range",
      "status": "Normal" | "High" | "Low" | "Critical",
      "significance": "What this finding means for the patient's health"
    }
  ],
  "overallAssessment": {
    "status": "Normal" | "Attention Needed" | "Urgent Care Required",
    "summary": "Overall summary of the report findings",
    "riskLevel": "Low" | "Medium" | "High"
  },
  "recommendations": {
    "immediate": ["Immediate actions needed if any"],
    "lifestyle": ["Lifestyle modifications"],
    "followUp": ["Follow-up tests or consultations needed"],
    "dietary": ["Dietary recommendations based on findings"]
  },
  "trends": [
    {
      "parameter": "Parameter name",
      "trend": "Improving" | "Stable" | "Worsening",
      "description": "Description of the trend if multiple reports available"
    }
  ],
  "redFlags": ["Critical findings that need immediate attention"],
  "nextSteps": ["Ordered list of next steps for the patient"],
  "confidence": 90
}

Analysis Guidelines:
1. Extract ALL visible test parameters with their values and normal ranges
2. Identify abnormal values and explain their clinical significance
3. Consider the patient's context if provided (age, symptoms, medical history)
4. Provide actionable recommendations based on findings
5. Highlight any critical values that need immediate medical attention
6. Suggest appropriate follow-up tests or consultations
7. Include lifestyle and dietary recommendations relevant to the findings
8. If it's a follow-up report, try to identify trends
9. Always err on the side of caution for patient safety
10. Be specific about urgency levels and timeframes

Critical Value Indicators:
- Extremely high or low values outside normal ranges
- Values indicating organ dysfunction
- Signs of infection, inflammation, or disease
- Diabetic emergency indicators
- Cardiac markers indicating heart problems
- Kidney or liver function abnormalities

Return ONLY the JSON object, no additional text.`;

    // Convert base64 to the format Gemini expects
    const imagePart = {
      inlineData: {
        data: image,
        mimeType: "image/jpeg",
      },
    };

    // Generate content
    const result = await generateWithRetry(model, [prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean the response to extract JSON
      let cleanedResponse = text.trim();

      // Remove any markdown code blocks
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      // Parse the JSON response
      const analysis = JSON.parse(cleanedResponse);

      // Validate required fields
      if (!analysis.reportType) {
        throw new Error("Could not identify report type");
      }

      return NextResponse.json(analysis);
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.log("Raw response:", text);

      // Fallback response if JSON parsing fails
      return NextResponse.json({
        reportType: "Lab Report Analysis Available",
        testDate: "Date not clearly visible",
        keyFindings: [
          {
            parameter: "Analysis Available",
            value: "See detailed analysis",
            normalRange: "Refer to report",
            status: "Normal",
            significance: "Detailed analysis available in raw response",
          },
        ],
        overallAssessment: {
          status: "Attention Needed",
          summary:
            "Lab report has been analyzed. Please consult with your healthcare provider for detailed interpretation.",
          riskLevel: "Medium",
        },
        recommendations: {
          immediate: [
            "Consult your healthcare provider for detailed interpretation",
          ],
          lifestyle: ["Maintain healthy lifestyle habits"],
          followUp: ["Schedule follow-up with your doctor as recommended"],
          dietary: ["Follow balanced diet as advised by healthcare provider"],
        },
        trends: [],
        redFlags: ["Professional medical interpretation recommended"],
        nextSteps: [
          "Share this report with your healthcare provider",
          "Ask specific questions about any abnormal values",
          "Follow recommended follow-up schedule",
        ],
        confidence: 60,
        rawAnalysis: text,
      });
    }
  } catch (error) {
    console.error("Error analyzing lab report:", error);
    const statusCode = getErrorStatusCode(error);

    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "API configuration error. Please check GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    if (statusCode !== null && RETRYABLE_STATUS_CODES.has(statusCode)) {
      return NextResponse.json(
        {
          error:
            "AI service is temporarily busy. Please retry in a few moments.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze lab report. Please try again." },
      { status: 500 }
    );
  }
}
