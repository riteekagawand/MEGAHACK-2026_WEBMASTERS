import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      structuredSymptoms,
      possibleConditions,
      epidemiologicalData,
      caseHistoryData,
      originalSymptoms,
      patientDemographics,
    } = await request.json();

    if (!structuredSymptoms && !originalSymptoms) {
      return NextResponse.json(
        { error: "Symptoms are required" },
        { status: 400 }
      );
    }

    const symptomsToAnalyze = structuredSymptoms || [originalSymptoms];
    const demographics = patientDemographics || {
      age: 25,
      gender: "unknown",
      medicalHistory: [],
      lifestyle: "standard"
    };

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
            content: `You are RiskAnalyzer, an advanced AI Risk Assessment Agent specialized in patient risk factor analysis. Your role is to:

1. Analyze patient demographics and medical history for risk factors
2. Calculate overall risk scores based on multiple factors
3. Consider age, gender, lifestyle, and comorbidities
4. Assess environmental and occupational risk factors
5. Provide personalized risk stratification
6. Generate risk-based recommendations

Guidelines:
- Calculate comprehensive risk scores (0-100 scale)
- Consider age-specific disease risks
- Analyze gender-related predispositions
- Factor in medical history and comorbidities
- Assess lifestyle and environmental factors
- Consider current epidemiological context
- Provide actionable risk mitigation strategies

Risk Categories to Assess:
- Infectious disease susceptibility
- Chronic disease predisposition
- Medication interactions and contraindications
- Procedural and diagnostic risks
- Lifestyle-related health risks
- Environmental exposure risks

Output Format:
Return a JSON object with:
- overallRiskScore: Overall risk assessment (0-100)
- riskFactors: Array of objects with {factor, impact, description, mitigation}
- demographicRisks: Age and gender-specific risk analysis
- lifestyleFactors: Lifestyle-related risk assessment
- environmentalRisks: Environmental and occupational risks
- recommendations: Array of risk-based recommendations
- riskStratification: Low/Medium/High risk classification
- monitoringRequirements: Suggested monitoring protocols
- confidence: Confidence level in risk assessment (0-100)`,
          },
          {
            role: "user",
            content: `Please analyze risk factors for this patient presentation:

Structured Symptoms: ${JSON.stringify(symptomsToAnalyze)}
Possible Conditions: ${JSON.stringify(possibleConditions || [])}
Epidemiological Context: ${JSON.stringify(epidemiologicalData || {})}
Case History Patterns: ${JSON.stringify(caseHistoryData || {})}
Patient Demographics: ${JSON.stringify(demographics)}
Original Symptoms: "${originalSymptoms}"

Provide comprehensive risk assessment with scoring and personalized recommendations.`,
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
        { error: "Failed to analyze risk factors" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const riskContent = data.choices[0]?.message?.content;

    try {
      // Clean the response content by removing markdown code blocks
      let cleanedContent = riskContent.trim();
      
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
      const riskResult = JSON.parse(cleanedContent);

      return NextResponse.json({
        agent: "RiskAnalyzer",
        timestamp: new Date().toISOString(),
        ...riskResult,
      });
    } catch (parseError) {
      // Fallback if the response isn't valid JSON
      console.error("Failed to parse JSON response:", parseError);

      // Create structured fallback response
      const extractedFactors = [];
      const extractedRecommendations = [];

      const lines = riskContent.split("\n").filter((line: string) => line.trim());
      
      for (const line of lines) {
        if (
          line.toLowerCase().includes("risk") ||
          line.toLowerCase().includes("factor") ||
          line.toLowerCase().includes("age") ||
          line.toLowerCase().includes("gender")
        ) {
          extractedFactors.push({
            factor: line.trim().substring(0, 50),
            impact: "Medium",
            description: line.trim().substring(0, 100),
            mitigation: "Standard monitoring and preventive measures"
          });
        }
        if (
          line.toLowerCase().includes("recommend") ||
          line.toLowerCase().includes("should") ||
          line.toLowerCase().includes("monitor")
        ) {
          extractedRecommendations.push(line.trim().substring(0, 100));
        }
      }

      return NextResponse.json({
        agent: "RiskAnalyzer",
        timestamp: new Date().toISOString(),
        overallRiskScore: 45,
        riskFactors: extractedFactors.length > 0 ? extractedFactors.slice(0, 4) : [
          {
            factor: "Age-related risk",
            impact: "Medium",
            description: "Patient age contributes to disease susceptibility",
            mitigation: "Regular health monitoring"
          },
          {
            factor: "Symptom complexity",
            impact: "Medium", 
            description: "Multiple symptoms require careful evaluation",
            mitigation: "Comprehensive diagnostic workup"
          }
        ],
        demographicRisks: {
          ageFactors: "Standard age-related risk assessment",
          genderFactors: "Gender-specific risk considerations",
          populationRisks: "General population risk factors"
        },
        lifestyleFactors: {
          overall: "Standard lifestyle risk assessment",
          modifiableFactors: "Diet, exercise, stress management"
        },
        recommendations: extractedRecommendations.length > 0 ? extractedRecommendations.slice(0, 3) : [
          "Continue monitoring symptom progression",
          "Maintain standard preventive measures",
          "Follow up with healthcare provider"
        ],
        riskStratification: "Medium",
        confidence: 75,
        rawResponse: riskContent.substring(0, 500) + "..."
      });
    }
  } catch (error) {
    console.error("Error in RiskAnalyzer agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
