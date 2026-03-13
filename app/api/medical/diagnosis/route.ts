import { NextRequest, NextResponse } from "next/server";
import { TranslatorAgent } from "@/lib/agents/translatorAgent";
import { SymptomAnalyzerAgent, PatientInput } from "@/lib/agents/symptomAnalyzer";

const translator = new TranslatorAgent();
const symptomAnalyzer = new SymptomAnalyzerAgent();

export async function GET() {
  return NextResponse.json({
    service: "Diagnosis pipeline (Translator + Symptom Analyzer)",
    status: "healthy",
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
      endpoint: "POST /api/diagnosis",
      body: {
        symptoms: "string (required)",
        language: "string (optional, default 'english')",
        age: "number (optional)",
        gender: "string (optional)",
        location: "string (optional)",
        medicalHistory: "string[] (optional)",
      },
    },
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    const patientInput: PatientInput = {
      symptoms: body.symptoms,
      language: body.language || "english",
      age: body.age,
      gender: body.gender,
      location: body.location,
      medicalHistory: body.medicalHistory || [],
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