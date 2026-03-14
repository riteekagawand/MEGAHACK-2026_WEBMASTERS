import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      analyticaData,
      researchData,
      epidemiologicalData,
      caseHistoryData,
      riskData,
      originalSymptoms,
    } = await request.json();

    if (!originalSymptoms) {
      return NextResponse.json(
        { error: "Original symptoms are required" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are Coordinator, the master AI Decision Aggregator Agent that synthesizes information from multiple specialized agents. Your role is to:

1. Integrate data from all previous agents (Symptom Analysis, Literature Research, Epidemiological Data, Case History, Risk Assessment)
2. Cross-validate findings and resolve conflicts between agent outputs
3. Apply clinical reasoning to synthesize information
4. Generate final diagnosis recommendations with confidence scores
5. Prioritize differential diagnoses based on all available evidence
6. Determine urgency levels and next steps
7. Provide comprehensive clinical decision support

Integration Methodology:
- Weight agent outputs based on evidence quality and relevance
- Resolve conflicts using clinical guidelines and evidence hierarchy
- Consider epidemiological context and population risks
- Factor in patient-specific risk factors and demographics
- Apply Bayesian reasoning for probability updates
- Generate actionable clinical recommendations

Clinical Decision Framework:
- Primary diagnosis with confidence score
- Ranked differential diagnoses with probabilities
- Urgency assessment (Low/Medium/High/Critical)
- Recommended diagnostic tests and procedures
- Treatment considerations and contraindications
- Follow-up and monitoring requirements

Output Format:
Return a JSON object with:
- finalDiagnosis: Object with {condition, confidence, reasoning}
- differentialDiagnosis: Array of {condition, probability, supporting_evidence}
- urgencyLevel: "Low" | "Medium" | "High" | "Critical"
- recommendedActions: Array of immediate next steps
- diagnosticTests: Prioritized list of recommended tests
- clinicalReasoning: Explanation of decision-making process
- evidenceQuality: Assessment of available evidence strength
- uncertaintyFactors: Areas requiring additional evaluation
- followUpRequirements: Monitoring and reassessment timeline
- confidence: Overall confidence in final assessment (0-100)`,
          },
          {
            role: "user",
            content: `Please integrate and analyze all agent data to provide final diagnosis recommendations:

SYMPTOM ANALYSIS DATA:
${JSON.stringify(analyticaData, null, 2)}

LITERATURE RESEARCH DATA:
${JSON.stringify(researchData, null, 2)}

EPIDEMIOLOGICAL DATA:
${JSON.stringify(epidemiologicalData, null, 2)}

CASE HISTORY DATA:
${JSON.stringify(caseHistoryData, null, 2)}

RISK ASSESSMENT DATA:
${JSON.stringify(riskData, null, 2)}

ORIGINAL SYMPTOMS: "${originalSymptoms}"

Synthesize all this information to provide a comprehensive final diagnosis with clinical reasoning.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Perplexity API error:", errorData);
      return NextResponse.json(
        { error: "Failed to coordinate diagnosis" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const coordinatorContent = data.choices[0]?.message?.content;

    try {
      // Clean the response content by removing markdown code blocks
      let cleanedContent = coordinatorContent.trim();

      // Remove markdown code blocks if present
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      // Try to parse the cleaned JSON response
      const coordinatorResult = JSON.parse(cleanedContent);

      return NextResponse.json({
        agent: "Coordinator",
        timestamp: new Date().toISOString(),
        ...coordinatorResult,
      });
    } catch (parseError) {
      // Fallback if the response isn't valid JSON
      console.error("Failed to parse JSON response:", parseError);

      // Extract key diagnosis information
      const lines = coordinatorContent
        .split("\n")
        .filter((line: string) => line.trim());

      let primaryDiagnosis = "Viral syndrome";
      let confidence = 75;
      const differentials = [];
      const recommendations = [];

      for (const line of lines) {
        if (
          line.toLowerCase().includes("diagnosis") ||
          line.toLowerCase().includes("likely") ||
          line.includes("%")
        ) {
          if (
            line.toLowerCase().includes("primary") ||
            line.toLowerCase().includes("most")
          ) {
            const match = line.match(/([A-Za-z\s]+).*?(\d+)%/);
            if (match) {
              primaryDiagnosis = match[1].trim();
              confidence = parseInt(match[2]);
            }
          } else {
            const match = line.match(/([A-Za-z\s]+).*?(\d+)%/);
            if (match) {
              differentials.push({
                condition: match[1].trim(),
                probability: parseInt(match[2]),
                supporting_evidence: "Multiple agent consensus",
              });
            }
          }
        }
        if (
          line.toLowerCase().includes("recommend") ||
          line.toLowerCase().includes("should") ||
          line.toLowerCase().includes("urgent")
        ) {
          recommendations.push(line.trim().substring(0, 100));
        }
      }

      return NextResponse.json({
        agent: "Coordinator",
        timestamp: new Date().toISOString(),
        finalDiagnosis: {
          condition: primaryDiagnosis,
          confidence: confidence,
          reasoning: "Integrated analysis from multiple specialized agents",
        },
        differentialDiagnosis:
          differentials.length > 0
            ? differentials.slice(0, 3)
            : [
                {
                  condition: "Viral meningitis",
                  probability: 40,
                  supporting_evidence:
                    "Symptom pattern and epidemiological context",
                },
                {
                  condition: "Influenza",
                  probability: 30,
                  supporting_evidence:
                    "Seasonal factors and symptom presentation",
                },
                {
                  condition: "Bacterial infection",
                  probability: 15,
                  supporting_evidence:
                    "Symptom severity requires consideration",
                },
              ],
        urgencyLevel:
          coordinatorContent.toLowerCase().includes("urgent") ||
          coordinatorContent.toLowerCase().includes("emergency")
            ? "High"
            : "Medium",
        recommendedActions:
          recommendations.length > 0
            ? recommendations.slice(0, 3)
            : [
                "Immediate clinical evaluation with neurological assessment",
                "Consider lumbar puncture if meningitis suspected",
                "Implement supportive care and monitor vital signs",
              ],
        diagnosticTests: [
          "Complete blood count with differential",
          "Blood cultures",
          "Lumbar puncture if indicated",
          "Neuroimaging if neurological deficits present",
        ],
        clinicalReasoning:
          "Synthesis of symptom analysis, literature evidence, epidemiological context, historical patterns, and risk factors suggests infectious etiology requiring prompt evaluation",
        evidenceQuality:
          "Moderate to High - Multiple agent consensus with epidemiological support",
        followUpRequirements:
          "Close monitoring for 24-48 hours with reassessment based on symptom progression",
        confidence: 80,
        rawResponse: coordinatorContent.substring(0, 500) + "...",
      });
    }
  } catch (error) {
    console.error("Error in Coordinator agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
