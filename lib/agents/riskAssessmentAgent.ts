// lib/agents/riskAssessmentAgent.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash";

export interface PatientInput {
  symptoms: string;
  language: string;
  age?: number;
  gender?: string;
  location?: string;
  medicalHistory?: string[];
  lifestyle?: string;          // NEW
  familyHistory?: string[];    // NEW
}

export interface RiskFactor {
  factor: string;
  impact: "low" | "medium" | "high";
  description: string;
}

export interface RiskAssessmentResult {
  riskFactors: RiskFactor[];
  overallRisk: "low" | "medium" | "high" | "critical";
  recommendations: string[];
}

export class RiskAssessmentAgent {
  private model;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "";
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: MODEL_NAME });
  }

  async assessRisk(
    patientInfo: PatientInput,
    symptoms: string
  ): Promise<RiskAssessmentResult> {
    if (!process.env.GEMINI_API_KEY) {
      return this.fallbackRiskAssessment(patientInfo, symptoms);
    }

    const systemPrompt = `You are Suraksha, an expert clinical risk assessment specialist with comprehensive knowledge of patient safety, epidemiology, and preventive medicine.

TASK: Conduct comprehensive risk stratification for the patient based on multiple risk domains.

RISK ASSESSMENT DOMAINS:

1. DEMOGRAPHIC RISK FACTORS:
   - Age-related risks (pediatric, geriatric considerations)
   - Gender-specific health risks
   - Genetic predispositions in Indian populations

2. MEDICAL & FAMILY HISTORY RISK FACTORS:
   - Comorbidities and their interactions
   - Previous hospitalizations
   - Medication history and interactions
   - Allergies and adverse reactions
   - Family history of cardiovascular, metabolic, or hereditary diseases

3. ENVIRONMENTAL RISK FACTORS:
   - Geographic location-specific risks
   - Air quality and pollution exposure
   - Water quality and sanitation
   - Occupational hazards
   - Seasonal disease patterns

4. LIFESTYLE RISK FACTORS:
   - Dietary patterns and nutritional status
   - Physical activity levels
   - Substance use (tobacco, alcohol)
   - Sleep patterns and stress levels

5. SOCIOECONOMIC RISK FACTORS:
   - Healthcare access and compliance
   - Economic barriers to treatment
   - Health literacy levels
   - Social support systems

INDIAN HEALTH CONTEXT:
- High prevalence of diabetes and cardiovascular disease
- Nutritional deficiencies (iron, B12, vitamin D)
- Vector-borne disease risks (malaria, dengue, chikungunya)
- Air pollution health impacts in major cities
- Healthcare infrastructure variations

RISK IMPACT LEVELS:
- LOW: Minimal impact on health outcomes, routine monitoring
- MEDIUM: Moderate impact, requires attention and monitoring
- HIGH: Significant impact, needs active management and intervention

OVERALL RISK STRATIFICATION:
- LOW: Routine care, standard follow-up
- MEDIUM: Enhanced monitoring, preventive measures
- HIGH: Active management, frequent monitoring
- CRITICAL: Immediate intervention required, intensive monitoring

Return ONLY valid JSON:
{
  "riskFactors": [
    {
      "factor": "specific risk factor name",
      "impact": "low|medium|high",
      "description": "detailed explanation of risk and clinical significance"
    }
  ],
  "overallRisk": "low|medium|high|critical",
  "recommendations": ["specific actionable risk mitigation strategies"]
}`;

    const patientData = `
PATIENT PROFILE:
- Age: ${patientInfo.age || "Not specified"}
- Gender: ${patientInfo.gender || "Not specified"}
- Location: ${patientInfo.location || "Not specified"}
- Medical History: ${patientInfo.medicalHistory?.join(", ") || "None provided"}
- Family History: ${patientInfo.familyHistory?.join(", ") || "None provided"}
- Lifestyle: ${patientInfo.lifestyle || "Not specified"}

CURRENT SYMPTOMS: "${symptoms}"

ASSESSMENT REQUEST:
- Explicitly consider AGE, LIFESTYLE, FAMILY HISTORY, and LOCATION in the risk analysis.
- Map each risk factor to one of the defined risk domains.
- Provide specific, actionable recommendations for risk mitigation.`;

    try {
      const result = await this.model.generateContent([systemPrompt, patientData]);
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in model response");

      const parsed = JSON.parse(jsonMatch[0]);

      if (Array.isArray(parsed.riskFactors) && Array.isArray(parsed.recommendations)) {
        return {
          riskFactors: parsed.riskFactors.map(
            (rf: { factor?: string; impact?: string; description?: string }) => ({
              factor: rf.factor || "Unknown risk factor",
              impact: (["low", "medium", "high"].includes(rf.impact)
                ? rf.impact
                : "medium") as RiskFactor["impact"],
              description: rf.description || "No description available",
            })
          ),
          overallRisk: (["low", "medium", "high", "critical"].includes(parsed.overallRisk)
            ? parsed.overallRisk
            : "medium") as RiskAssessmentResult["overallRisk"],
          recommendations: parsed.recommendations || [],
        };
      }
    } catch (error) {
      console.error("Suraksha (Gemini) risk assessment error:", error);
      return this.fallbackRiskAssessment(patientInfo, symptoms);
    }

    return this.fallbackRiskAssessment(patientInfo, symptoms);
  }

  private fallbackRiskAssessment(
    patientInfo: PatientInput,
    symptoms: string
  ): RiskAssessmentResult {
    const riskFactors: RiskFactor[] = [];
    let overallRisk: RiskAssessmentResult["overallRisk"] = "low";
    const recommendations: string[] = [];

    if (patientInfo.age) {
      if (patientInfo.age > 65) {
        riskFactors.push({
          factor: "Advanced Age",
          impact: "high",
          description:
            "Increased risk for multiple comorbidities and medication interactions",
        });
        overallRisk = "high";
      } else if (patientInfo.age > 45) {
        riskFactors.push({
          factor: "Middle Age",
          impact: "medium",
          description:
            "Increased risk for cardiovascular and metabolic conditions",
        });
        if (overallRisk === "low") overallRisk = "medium";
      }
    }

    if (patientInfo.gender === "male" && patientInfo.age && patientInfo.age > 40) {
      riskFactors.push({
        factor: "Male Gender with Age",
        impact: "medium",
        description: "Higher cardiovascular risk in middle-aged males",
      });
    }

    if (patientInfo.location) {
      const loc = patientInfo.location.toLowerCase();
      if (loc.includes("delhi") || loc.includes("mumbai") || loc.includes("kolkata")) {
        riskFactors.push({
          factor: "High Air Pollution Exposure",
          impact: "medium",
          description:
            "Living in high air pollution area increases respiratory and cardiovascular risks",
        });
      }
    }

    if (patientInfo.lifestyle) {
      riskFactors.push({
        factor: "Lifestyle pattern",
        impact: "medium",
        description:
          "Lifestyle factors (diet, activity, stress, substance use) may contribute to long-term risk",
      });
    }

    if (patientInfo.familyHistory && patientInfo.familyHistory.length > 0) {
      riskFactors.push({
        factor: "Family history",
        impact: "medium",
        description:
          "Family history suggests possible genetic or shared environmental risk factors",
      });
    }

    const lowerSymptoms = symptoms.toLowerCase();
    if (lowerSymptoms.includes("chest pain") || lowerSymptoms.includes("chest")) {
      overallRisk = "critical";
      recommendations.push(
        "Immediate cardiac evaluation with ECG and cardiac enzymes"
      );
      recommendations.push("Consider emergency department evaluation");
    }

    if (lowerSymptoms.includes("breathing") || lowerSymptoms.includes("dyspnea")) {
      overallRisk = overallRisk === "low" ? "high" : "critical";
      recommendations.push("Oxygen saturation monitoring");
      recommendations.push("Chest imaging if respiratory symptoms persist");
    }

    if (recommendations.length === 0) {
      recommendations.push("Regular vital signs monitoring");
      recommendations.push("Follow-up within 24-48 hours if symptoms worsen");
      recommendations.push("Maintain adequate hydration and rest");
    }

    return { riskFactors, overallRisk, recommendations };
  }
}