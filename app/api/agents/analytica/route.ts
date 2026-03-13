import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { symptoms } = await request.json();

    if (!symptoms) {
      return NextResponse.json(
        { error: "Symptoms are required" },
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
            content: `You are Analytica, an advanced AI Symptom Analysis Agent specialized in medical symptom processing. Your role is to:

1. Analyze raw patient symptom descriptions
2. Extract and structure individual symptoms into a standardized format
3. Identify key symptom patterns and relationships
4. Provide preliminary symptom categorization

Guidelines:
- Extract each distinct symptom mentioned
- Standardize medical terminology (e.g., "body ache" → "myalgia")
- Note symptom duration, severity, and temporal patterns if mentioned
- Identify symptom clusters that commonly occur together
- Be precise and medical terminology focused
- Maintain objectivity without making diagnostic assumptions

Output Format:
Return a JSON object with:
- structuredSymptoms: Array of standardized symptom terms
- analysis: Brief analysis of symptom patterns and relationships
- severity: Assessment if severity indicators are present
- duration: Timeline information if available
- categories: Symptom categories (e.g., "constitutional", "neurological", "respiratory")`,
          },
          {
            role: "user",
            content: `Please analyze these patient symptoms and structure them:

Symptoms: "${symptoms}"

Provide a structured analysis following the specified format.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Perplexity API error:", errorData);
      return NextResponse.json(
        { error: "Failed to analyze symptoms" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const analysisContent = data.choices[0]?.message?.content;

    try {
      // Clean the response content by removing markdown code blocks
      let cleanedContent = analysisContent.trim();

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
      const analysisResult = JSON.parse(cleanedContent);

      return NextResponse.json({
        agent: "Analytica",
        timestamp: new Date().toISOString(),
        ...analysisResult,
      });
    } catch (parseError) {
      // Fallback if the response isn't valid JSON
      console.error("Failed to parse JSON response:", parseError);

      // Extract structured symptoms using regex as fallback
      const symptomMatches = analysisContent.match(/["']([^"']+)["']/g);
      const structuredSymptoms = symptomMatches
        ? symptomMatches.map((match: string) => match.replace(/["']/g, ""))
        : [symptoms];

      return NextResponse.json({
        agent: "Analytica",
        timestamp: new Date().toISOString(),
        structuredSymptoms,
        analysis: analysisContent,
        rawResponse: analysisContent,
      });
    }
  } catch (error) {
    console.error("Error in Analytica agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
