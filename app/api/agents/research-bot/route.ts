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
            content: `You are ResearchBot, an advanced AI Medical Literature Research Agent specialized in evidence-based medical research. Your role is to:

1. Search through medical literature and databases for symptom patterns
2. Identify possible medical conditions that match the given symptoms
3. Provide likelihood assessments based on symptom clusters
4. Reference current medical knowledge and epidemiological data
5. Consider differential diagnoses and common co-occurrences

Guidelines:
- Focus on evidence-based medicine and peer-reviewed sources
- Consider both common and rare conditions that fit the symptom profile
- Provide likelihood percentages based on symptom matching
- Include reasoning for each potential condition
- Consider demographic factors, geographical prevalence, and seasonal patterns
- Maintain medical accuracy and avoid definitive diagnoses

Output Format:
Return a JSON object with:
- possibleConditions: Array of objects with {name, likelihood, reasoning, symptoms_matched}
- differentialDiagnosis: Key conditions to consider or rule out
- recommendedTests: Suggested diagnostic tests or examinations
- epidemiologicalNotes: Relevant current trends or geographical considerations
- confidence: Overall confidence level in the analysis (0-100)
- literatureSources: Brief mention of medical knowledge basis`,
          },
          {
            role: "user",
            content: `Please research medical literature for conditions matching these symptoms:

Structured Symptoms: ${JSON.stringify(symptomsToAnalyze)}
Original Description: "${originalSymptoms}"

Provide evidence-based possible conditions with likelihood assessments and medical reasoning.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Perplexity API error:", errorData);
      return NextResponse.json(
        { error: "Failed to research medical literature" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const researchContent = data.choices[0]?.message?.content;

    try {
      // Clean the response content by removing markdown code blocks
      let cleanedContent = researchContent.trim();

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
      const researchResult = JSON.parse(cleanedContent);

      return NextResponse.json({
        agent: "ResearchBot",
        timestamp: new Date().toISOString(),
        ...researchResult,
      });
    } catch (parseError) {
      // Fallback if the response isn't valid JSON
      console.error("Failed to parse JSON response:", parseError);

      // Create a fallback structure
      const lines = researchContent
        .split("\n")
        .filter((line: string) => line.trim());
      const possibleConditions = [];

      // Simple extraction of conditions mentioned
      for (const line of lines) {
        if (
          line.includes("%") ||
          line.toLowerCase().includes("likely") ||
          line.toLowerCase().includes("possible")
        ) {
          const condition = line.replace(/[^a-zA-Z\s%]/g, "").trim();
          if (condition.length > 3) {
            possibleConditions.push({
              name: condition.substring(0, 50),
              likelihood: "Unknown",
              reasoning: line.trim(),
            });
          }
        }
      }

      return NextResponse.json({
        agent: "ResearchBot",
        timestamp: new Date().toISOString(),
        possibleConditions:
          possibleConditions.length > 0
            ? possibleConditions
            : [
                {
                  name: "Analysis Available",
                  likelihood: "See Details",
                  reasoning: "Detailed medical literature analysis provided",
                },
              ],
        analysis: researchContent,
        rawResponse: researchContent,
      });
    }
  } catch (error) {
    console.error("Error in ResearchBot agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
