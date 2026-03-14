import { NextResponse } from "next/server";
import kb from "@/data/ayush_bilingual_dataset.json";

type KbItem = (typeof kb)[number];

export async function POST(req: Request) {
  try {
    const { symptom } = (await req.json()) as { symptom?: string };
    if (!symptom || typeof symptom !== "string") {
      return NextResponse.json(
        { error: "symptom string is required" },
        { status: 400 }
      );
    }

    const remedy = (kb as KbItem[]).find(
      (item) =>
        (item.disease?.en ?? "").toLowerCase() === symptom.toLowerCase().trim()
    );

    if (!remedy) {
      return NextResponse.json({
        message: "Symptom not found in knowledge base",
      });
    }

    return NextResponse.json({
      remedy: remedy.remedy?.en ?? remedy.remedy,
      dosage: remedy.dosage?.en ?? remedy.dosage,
      consult: remedy.consult_doctor_if,
      dosha: remedy.dosha,
      disease: remedy.disease?.en ?? remedy.disease,
    });
  } catch (error) {
    console.error("AYUSH agent error:", error);
    return NextResponse.json(
      { error: "AYUSH agent failed" },
      { status: 500 }
    );
  }
}
