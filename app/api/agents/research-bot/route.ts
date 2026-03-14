import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { structuredSymptoms, originalSymptoms } = await request.json();

    if (!structuredSymptoms && !originalSymptoms) {
      return NextResponse.json(
        { error: "Symptoms are required" },
        { status: 400 }
      );
    }

    const symptomsToAnalyze = structuredSymptoms || [originalSymptoms];

    // Use comprehensive mock data (no API key required)
    {
      // Generate contextual mock data based on the query
      const query = originalSymptoms.toLowerCase();
      
      let mockResponse: any = {
        agent: "ResearchBot",
        timestamp: new Date().toISOString(),
        possibleConditions: [
          {
            name: "Condition Analysis",
            likelihood: "Moderate (65%)",
            reasoning: "Based on the symptoms provided, further clinical evaluation is recommended.",
            symptoms_matched: ["symptom analysis"]
          }
        ],
        differentialDiagnosis: ["Condition A", "Condition B", "Condition C"],
        recommendedTests: ["Blood work", "Physical examination", "Imaging if indicated"],
        epidemiologicalNotes: "Prevalence varies by demographic factors. Consult local health data.",
        confidence: 65,
        literatureSources: "Based on general medical knowledge. For detailed research, configure PERPLEXITY_API_KEY."
      };

      // Context-aware mock responses
      if (query.includes("chest pain") || query.includes("heart")) {
        mockResponse = {
          agent: "ResearchBot",
          timestamp: new Date().toISOString(),
          possibleConditions: [
            {
              name: "Acute Coronary Syndrome",
              likelihood: "High (85%)",
              reasoning: "Chest pain with radiation to arm/jaw is classic for cardiac ischemia",
              symptoms_matched: ["chest pain", "shortness of breath", "sweating"]
            },
            {
              name: "Stable Angina",
              likelihood: "Moderate (70%)",
              reasoning: "Exertional chest pain relieved by rest suggests stable angina",
              symptoms_matched: ["chest pain", "exertional symptoms"]
            },
            {
              name: "Costochondritis",
              likelihood: "Low (30%)",
              reasoning: "Musculoskeletal chest pain, typically reproducible on palpation",
              symptoms_matched: ["localized chest pain"]
            }
          ],
          differentialDiagnosis: ["Myocardial Infarction", "Unstable Angina", "Pericarditis", "Aortic Dissection"],
          recommendedTests: ["ECG", "Troponin levels", "Chest X-ray", "Echocardiogram"],
          epidemiologicalNotes: "Cardiovascular disease is leading cause of death globally. Risk increases with age, smoking, diabetes.",
          confidence: 82,
          literatureSources: "ACC/AHA Guidelines for Management of Chest Pain (2021), ESC Guidelines"
        };
      } else if (query.includes("headache") || query.includes("migraine")) {
        mockResponse = {
          agent: "ResearchBot",
          timestamp: new Date().toISOString(),
          possibleConditions: [
            {
              name: "Tension Headache",
              likelihood: "High (80%)",
              reasoning: "Bilateral pressure-like pain, often stress-related",
              symptoms_matched: ["headache", "stress", "bilateral pain"]
            },
            {
              name: "Migraine without Aura",
              likelihood: "Moderate (60%)",
              reasoning: "Unilateral throbbing pain with photophobia/phonophobia",
              symptoms_matched: ["headache", "nausea", "light sensitivity"]
            }
          ],
          differentialDiagnosis: ["Cluster Headache", "Sinusitis", "Intracranial Mass"],
          recommendedTests: ["Neurological exam", "CT/MRI if red flags", "Vision assessment"],
          epidemiologicalNotes: "Headaches affect 50% of adults annually. Migraine prevalence: 15% globally.",
          confidence: 75,
          literatureSources: "International Classification of Headache Disorders (ICHD-3)"
        };
      } else if (query.includes("diabetes") || query.includes("sugar")) {
        mockResponse = {
          agent: "ResearchBot",
          timestamp: new Date().toISOString(),
          possibleConditions: [
            {
              name: "Type 2 Diabetes Mellitus",
              likelihood: "High (90%)",
              reasoning: "Adult onset with insulin resistance, often associated with obesity",
              symptoms_matched: ["polyuria", "polydipsia", "fatigue"]
            }
          ],
          differentialDiagnosis: ["Type 1 Diabetes", "MODY", "Secondary Diabetes"],
          recommendedTests: ["Fasting glucose", "HbA1c", "Oral glucose tolerance test"],
          epidemiologicalNotes: "422 million adults have diabetes worldwide. Type 2 comprises 90% of cases.",
          confidence: 88,
          literatureSources: "ADA Standards of Medical Care in Diabetes 2024, WHO Diabetes Guidelines"
        };
      }

      return NextResponse.json(mockResponse);
    }
  } catch (error) {
    console.error("Error in ResearchBot agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
