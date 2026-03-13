// /app/api/test-agents/route.ts
// API endpoint for testing agents

import { TranslatorAgent } from "@/lib/agents/translatorAgent";
import { SymptomAnalyzerAgent, PatientInput } from "@/lib/agents/symptomAnalyzer";

// Agent registry for easy access
const agents = {
  translator: new TranslatorAgent(),
  symptomAnalyzer: new SymptomAnalyzerAgent(),
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
    availableAgents: ["translator", "symptomAnalyzer"],
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
          availableAgents: ["translator", "symptomAnalyzer"],
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
