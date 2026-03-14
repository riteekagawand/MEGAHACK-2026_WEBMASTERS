// lib/agents/symptomAnalyzer.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface PatientInput {
  symptoms: string;
  language: string;
  age?: number;
  gender?: string;
  location?: string;
  medicalHistory?: string[];
  uploadedFiles?: File[];
}

export class SymptomAnalyzerAgent {
  private model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "").getGenerativeModel(
    { model: "gemini-2.5-flash" }
  );

  async analyzeSymptoms(
    symptoms: string,
    patientInfo: Partial<PatientInput>
  ): Promise<{
    structuredSymptoms: Array<{
      symptom: string;
      severity: number;
      duration: string;
      bodySystem: string;
    }>;
    redFlags: string[];
    urgencyScore: number;
  }> {
    if (!process.env.GEMINI_API_KEY) {
      return this.fallbackAnalysis(symptoms);
    }

    const systemPrompt = `You are Lakshan, an expert clinical symptom analyzer with deep knowledge of medical semiology and pathophysiology.

TASK: Analyze and structure patient symptoms using clinical methodology.

BODY SYSTEMS CLASSIFICATION:
1. Cardiovascular
2. Respiratory
3. Gastrointestinal
4. Neurological
5. Musculoskeletal
6. Genitourinary
7. Dermatological
8. Endocrine
9. Hematological
10. Psychiatric
11. ENT

SEVERITY ASSESSMENT (1-10 scale):
- 1-3: Mild
- 4-6: Moderate
- 7-8: Severe
- 9-10: Critical

RED FLAGS:
- Chest pain with radiation
- Severe dyspnea or respiratory distress
- Altered mental status/consciousness
- Severe abdominal pain
- Signs of stroke (FAST)
- Severe allergic reactions
- Uncontrolled bleeding
- High fever with altered mental status

URGENCY SCORING (1-10):
- 1-2: Routine
- 3-4: Semi-urgent
- 5-6: Urgent
- 7-8: Very urgent
- 9-10: Emergency

PATIENT CONTEXT:
- Age: ${patientInfo.age || "Not specified"}
- Gender: ${patientInfo.gender || "Not specified"}
- Location: ${patientInfo.location || "Not specified"}
- Medical History: ${patientInfo.medicalHistory?.join(", ") || "None provided"}

Return ONLY valid JSON:
{
  "structuredSymptoms": [
    {
      "symptom": "specific symptom name",
      "severity": 1,
      "duration": "time period or onset pattern",
      "bodySystem": "primary system affected"
    }
  ],
  "redFlags": ["..."],
  "urgencyScore": 1
}`;

    const userPrompt = `Analyze these symptoms with clinical precision:

SYMPTOMS: "${symptoms}"

Provide structured analysis considering:
1. Symptom severity and clinical significance
2. Body system involvement
3. Temporal patterns and duration
4. Red flag identification
5. Overall urgency assessment

Focus on clinical accuracy and patient safety.`;

    try {
      const result = await this.model.generateContent([systemPrompt, userPrompt]);
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (Array.isArray(parsed.structuredSymptoms) && Array.isArray(parsed.redFlags)) {
          return {
            structuredSymptoms: parsed.structuredSymptoms.map(
              (s: { symptom?: string; severity?: number; duration?: string; bodySystem?: string }) => ({
                symptom: s.symptom || "Unknown symptom",
                severity: Math.min(Math.max(s.severity || 5, 1), 10),
                duration: s.duration || "Unknown duration",
                bodySystem: s.bodySystem || "General",
              })
            ),
            redFlags: parsed.redFlags || [],
            urgencyScore: Math.min(Math.max(parsed.urgencyScore || 5, 1), 10),
          };
        }
      }
    } catch {
      // fall through to fallback
    }

    return this.fallbackAnalysis(symptoms);
  }

  private fallbackAnalysis(symptoms: string) {
    const lower = symptoms.toLowerCase();
    const structuredSymptoms: Array<{
      symptom: string;
      severity: number;
      duration: string;
      bodySystem: string;
    }> = [];
    const redFlags: string[] = [];
    let urgencyScore = 3;

    if (lower.includes("chest pain")) {
      structuredSymptoms.push({
        symptom: "Chest Pain",
        severity: 8,
        duration: "Acute onset",
        bodySystem: "Cardiovascular",
      });
      redFlags.push("Chest pain - possible cardiac event");
      urgencyScore = 9;
    }

    if (lower.includes("fever")) {
      structuredSymptoms.push({
        symptom: "Fever",
        severity: 6,
        duration: "Recent onset",
        bodySystem: "General",
      });
      urgencyScore = Math.max(urgencyScore, 5);
    }

    if (lower.includes("headache")) {
      structuredSymptoms.push({
        symptom: "Headache",
        severity: 5,
        duration: "Variable",
        bodySystem: "Neurological",
      });
    }

    return { structuredSymptoms, redFlags, urgencyScore };
  }
}