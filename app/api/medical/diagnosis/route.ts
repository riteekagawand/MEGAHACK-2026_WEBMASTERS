import { NextRequest, NextResponse } from "next/server";
import { TranslatorAgent } from "@/lib/agents/translatorAgent";
import { SymptomAnalyzerAgent, PatientInput } from "@/lib/agents/symptomAnalyzer";

const translator = new TranslatorAgent();
const symptomAnalyzer = new SymptomAnalyzerAgent();

export async function GET() {
  return NextResponse.json({
    service: "Diagnosis pipeline (Translator + Symptom Analyzer)",
    status: "healthy",
    endpoint: "/api/medical/diagnosis",
    modelProvider: "Google Gemini 2.5 Flash",
    env: {
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      envVar: "GEMINI_API_KEY",
    },
    agents: {
      translator: {
        id: "translator",
        name: "Bhasha - Language Translator Agent",
        description:
          "Translates patient symptoms from Indian languages to medical English with emergency keyword detection",
      },
      symptomAnalyzer: {
        id: "symptomAnalyzer",
        name: "Lakshan - Symptom Analyzer Agent",
        description:
          "Analyzes and structures patient symptoms, detects red flags and urgency",
      },
    },
    usage: {
      endpoint: "POST /api/medical/diagnosis",
      body: {
        name: "string (required - patient name)",
        age: "string or number (optional - patient age)",
        gender: "string (optional - 'male' | 'female' | 'other')",
        medicalHistory: "string (optional - free text medical history)",
        symptoms: "string (required - current symptoms)",
        language: "string (optional, default 'english')",
        location: "string (optional - patient location)"
      },
    },
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Support both frontend-style fields (name/age string) and direct API calls
    const patientName: string | undefined = body.name || body.patientName;
    const rawAge: string | number | undefined = body.age ?? body.patientAge;
    const ageNumber =
      typeof rawAge === "string"
        ? (parseInt(rawAge, 10) || undefined)
        : typeof rawAge === "number"
        ? rawAge
        : undefined;

    const gender: string | undefined = body.gender || body.patientGender;
    const medicalHistoryText: string = body.medicalHistory || "";

    const patientInput: PatientInput = {
      symptoms: body.symptoms,
      language: body.language || "english",
      age: ageNumber,
      gender,
      location: body.location,
      // Convert free-text history into an array for the agents
      medicalHistory: medicalHistoryText
        ? medicalHistoryText.split(",").map((item: string) => item.trim()).filter(Boolean)
        : [],
      uploadedFiles: [],
    };

    if (!patientInput.symptoms || typeof patientInput.symptoms !== "string") {
      return NextResponse.json(
        { success: false, error: "Symptoms are required and must be a string" },
        { status: 400 }
      );
    }

    const translationResult = await translator.translateSymptoms(
      patientInput.symptoms,
      patientInput.language || "english"
    );

    const analysisResult = await symptomAnalyzer.analyzeSymptoms(
      translationResult.translatedSymptoms,
      patientInput
    );

    const durationMs = Date.now() - startTime;

    const responsePayload = {
      success: true,
      diagnosis: {
        patient: {
          name: patientName || null,
          age: rawAge ?? null,
          gender: gender || null,
          medicalHistoryText: medicalHistoryText || "",
        },
        pipeline: {
          steps: [
            "Received raw symptoms from user",
            "Translated symptoms with Bhasha (TranslatorAgent)",
            "Analyzed symptoms with Lakshan (SymptomAnalyzerAgent)",
          ],
          timing: {
            duration: durationMs,
            unit: "ms",
          },
        },
        input: {
          originalSymptoms: patientInput.symptoms,
          language: patientInput.language,
          age: patientInput.age,
          gender: patientInput.gender,
          location: patientInput.location,
          medicalHistory: patientInput.medicalHistory,
        },
        translator: {
          translatedSymptoms: translationResult.translatedSymptoms,
          emergencyKeywords: translationResult.emergencyKeywords,
          culturalContext: translationResult.culturalContext,
        },
        symptomAnalysis: analysisResult,
        timestamp: new Date().toISOString(),
        meta: {
          provider: "Google Gemini 2.5 Flash",
          geminiConfigured: !!process.env.GEMINI_API_KEY,
        },
      },
    };

    console.log("Diagnosis pipeline completed", {
      durationMs,
      hasEmergencyKeywords: translationResult.emergencyKeywords.length > 0,
      urgencyScore: analysisResult.urgencyScore,
      redFlags: analysisResult.redFlags,
    });

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error("Diagnosis API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message:
          "Unable to process diagnosis pipeline. Please try again or consult a physician.",
      },
      { status: 500 }
    );
  }
}