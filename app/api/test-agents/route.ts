// /app/api/test-agents/route.ts
// API endpoint for testing agents

import { TranslatorAgent } from "@/lib/agents/translatorAgent";
import { SymptomAnalyzerAgent, PatientInput } from "@/lib/agents/symptomAnalyzer";
import { MedicalResearcherAgent } from "@/lib/agents/medicalResearchAgent";
import { RiskAssessmentAgent } from "@/lib/agents/riskAssessmentAgent";

// Agent registry for easy access
const agents = {
  translator: new TranslatorAgent(),
  symptomAnalyzer: new SymptomAnalyzerAgent(),
  medicalResearch: new MedicalResearcherAgent(),
  riskAssessment: new RiskAssessmentAgent(),
};

// Test scenarios for quick testing
const testScenarios = {
  translator: {
    hindi: {
      symptoms: "मुझे छाती में दर्द और सांस लेने में तकलीफ हो रही है",
      language: "hindi",
    },
    tamil: {
      symptoms: "எனக்கு நெஞ்சு வலி மற்றும் மூச்சு திணறல் உள்ளது",
      language: "tamil",
    },
    telugu: {
      symptoms: "నాకు గుండె నొప్పి మరియు శ్వాస కష్టం ఉంది",
      language: "telugu",
    },
    english: {
      symptoms: "I have chest pain and difficulty breathing",
      language: "english",
    },
  },
  symptomAnalyzer: {
    chestPain: {
      symptoms: "Severe chest pain radiating to left arm, sweating, nausea",
      patientInfo: {
        age: 55,
        gender: "male",
        location: "Mumbai",
        medicalHistory: ["hypertension", "diabetes"],
      },
    },
    fever: {
      symptoms: "High fever for 3 days, headache, body aches, fatigue",
      patientInfo: {
        age: 28,
        gender: "female",
        location: "Delhi",
        medicalHistory: [],
      },
    },
    neurological: {
      symptoms: "Sudden severe headache, confusion, weakness on left side",
      patientInfo: {
        age: 65,
        gender: "male",
        location: "Bangalore",
        medicalHistory: ["high blood pressure"],
      },
    },
  },
  medicalResearch: {
    chestPain: {
      symptoms: "Chest pain, shortness of breath, fatigue",
      location: "Mumbai",
    },
    fever: {
      symptoms: "High fever, chills, body aches",
      location: "Delhi",
    },
  },
  riskAssessment: {
    cardiacRisk: {
      symptoms: "Chest pain radiating to arm, sweating, nausea",
      context: {
        age: 60,
        gender: "male",
        location: "Chennai",
        medicalHistory: ["high cholesterol", "smoking"],
        familyHistory: ["heart disease", "stroke"],
        lifestyle: "sedentary, smoker",
      },
    },
    diabetesRisk: {
      symptoms: "Frequent urination, excessive thirst, unexplained weight loss",
      context: {
        age: 45,
        gender: "female",
        location: "Hyderabad",
        medicalHistory: ["gestational diabetes"],
        familyHistory: ["type 2 diabetes"],
        lifestyle: "overweight, desk job",
      },
    },
  },
};

// Health check endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Return available agents and test scenarios
  if (action === "info") {
    return Response.json({
      agents: [
        {
          id: "translator",
          name: "Bhasha - Language Translator Agent",
          description: "Translates patient symptoms from Indian languages to medical English",
          model: "Google Gemini 2.5 Flash",
          envVar: "GEMINI_API_KEY",
          capabilities: [
            "Supports 10+ Indian languages",
            "Medical terminology preservation",
            "Emergency keyword detection",
            "Cultural context understanding",
          ],
          testScenarios: Object.keys(testScenarios.translator),
        },
        {
          id: "symptomAnalyzer",
          name: "Lakshan - Symptom Analyzer Agent",
          description: "Analyzes and structures patient symptoms with clinical precision",
          model: "Google Gemini 2.5 Flash",
          envVar: "GEMINI_API_KEY",
          capabilities: [
            "Structured symptom analysis",
            "Body system classification",
            "Red flag detection",
            "Urgency scoring",
          ],
          testScenarios: Object.keys(testScenarios.symptomAnalyzer),
        },
        {
          id: "medicalResearch",
          name: "Medical Researcher Agent",
          description: "Finds relevant medical studies, guidelines, and regional health patterns",
          model: "Google Gemini 2.5 Flash",
          envVar: "GEMINI_API_KEY",
          capabilities: [
            "Medical literature search",
            "ICMR guidelines lookup",
            "WHO protocols reference",
            "Regional disease pattern analysis",
          ],
          testScenarios: Object.keys(testScenarios.medicalResearch),
        },
        {
          id: "riskAssessment",
          name: "Risk Assessment Agent",
          description: "Comprehensive risk stratification with lifestyle and family history",
          model: "Google Gemini 2.5 Flash",
          envVar: "GEMINI_API_KEY",
          capabilities: [
            "Risk factor identification",
            "Family history analysis",
            "Lifestyle risk assessment",
            "Disease probability ranking",
          ],
          testScenarios: Object.keys(testScenarios.riskAssessment),
        },
      ],
      usage: {
        testTranslator: "POST /api/test-agents with { agent: 'translator', symptoms: '...', language: '...' }",
        testAnalyzer: "POST /api/test-agents with { agent: 'symptomAnalyzer', symptoms: '...', patientInfo: {...} }",
        runScenario: "POST /api/test-agents with { agent: 'translator', scenario: 'hindi' }",
      },
    });
  }

  // Simple health check
  return Response.json({
    status: "ok",
    message: "Agent testing API is running",
    provider: "Google Gemini",
    model: "gemini-2.5-flash",
    requiredEnvVar: "GEMINI_API_KEY",
    availableAgents: ["translator", "symptomAnalyzer", "medicalResearch", "riskAssessment"],
    endpoints: {
      info: "GET /api/test-agents?action=info",
      test: "POST /api/test-agents",
    },
  });
}

// Main testing endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agent, scenario, ...params } = body;

    // Validate agent selection
    if (!agent || !agents[agent as keyof typeof agents]) {
      return Response.json(
        {
          error: "Invalid or missing agent",
          availableAgents: ["translator", "symptomAnalyzer", "medicalResearch", "riskAssessment"],
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    let result;

    // Test Translator Agent
    if (agent === "translator") {
      // Use predefined scenario or custom parameters
      let testParams;
      if (scenario && testScenarios.translator[scenario as keyof typeof testScenarios.translator]) {
        testParams = testScenarios.translator[scenario as keyof typeof testScenarios.translator];
      } else {
        testParams = {
          symptoms: params.symptoms || "No symptoms provided",
          language: params.language || "english",
        };
      }

      result = await agents.translator.translateSymptoms(
        testParams.symptoms,
        testParams.language
      );

      return Response.json({
        success: true,
        agent: "translator",
        agentName: "Bhasha",
        testInput: testParams,
        result,
        timing: {
          duration: Date.now() - startTime,
          unit: "ms",
        },
      });
    }

    // Test Symptom Analyzer Agent
    if (agent === "symptomAnalyzer") {
      // Use predefined scenario or custom parameters
      let testParams;
      if (scenario && testScenarios.symptomAnalyzer[scenario as keyof typeof testScenarios.symptomAnalyzer]) {
        testParams = testScenarios.symptomAnalyzer[scenario as keyof typeof testScenarios.symptomAnalyzer];
      } else {
        testParams = {
          symptoms: params.symptoms || "No symptoms provided",
          patientInfo: params.patientInfo || {},
        };
      }

      result = await agents.symptomAnalyzer.analyzeSymptoms(
        testParams.symptoms,
        testParams.patientInfo
      );

      return Response.json({
        success: true,
        agent: "symptomAnalyzer",
        agentName: "Lakshan",
        testInput: testParams,
        result,
        timing: {
          duration: Date.now() - startTime,
          unit: "ms",
        },
      });
    }

    // Test Medical Research Agent
    if (agent === "medicalResearch") {
      let testParams;
      if (scenario && testScenarios.medicalResearch[scenario as keyof typeof testScenarios.medicalResearch]) {
        testParams = testScenarios.medicalResearch[scenario as keyof typeof testScenarios.medicalResearch];
      } else {
        testParams = {
          symptoms: params.symptoms || "No symptoms provided",
          location: params.location || params.context?.location || "",
        };
      }

      result = await agents.medicalResearch.researchConditions(
        testParams.symptoms,
        testParams.location
      );

      return Response.json({
        success: true,
        agent: "medicalResearch",
        agentName: "Medical Researcher Agent",
        testInput: testParams,
        result,
        timing: {
          duration: Date.now() - startTime,
          unit: "ms",
        },
      });
    }

    // Test Risk Assessment Agent
    if (agent === "riskAssessment") {
      let testParams;
      if (scenario && testScenarios.riskAssessment[scenario as keyof typeof testScenarios.riskAssessment]) {
        testParams = testScenarios.riskAssessment[scenario as keyof typeof testScenarios.riskAssessment];
      } else {
        testParams = {
          symptoms: params.symptoms || "No symptoms provided",
          context: params.context || {},
        };
      }

      result = await agents.riskAssessment.assessRisk(
        testParams.context,
        testParams.symptoms
      );

      return Response.json({
        success: true,
        agent: "riskAssessment",
        agentName: "Risk Assessment Agent",
        testInput: testParams,
        result,
        timing: {
          duration: Date.now() - startTime,
          unit: "ms",
        },
      });
    }

    return Response.json(
      { error: "Agent execution failed" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Agent testing error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
