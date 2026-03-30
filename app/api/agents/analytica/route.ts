import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const { symptoms } = await request.json();

    if (!symptoms) {
      return NextResponse.json(
        { error: "Symptoms are required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are Analytica, an advanced AI Symptom Analysis Agent specialized in medical symptom processing. Your role is to:

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
- categories: Symptom categories (e.g., "constitutional", "neurological", "respiratory")`;

    const userPrompt = `Please analyze these patient symptoms and structure them:

Symptoms: "${symptoms}"

Provide a structured analysis following the specified format. Return ONLY valid JSON.`;

    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = await result.response;
    const analysisContent = response.text();

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
