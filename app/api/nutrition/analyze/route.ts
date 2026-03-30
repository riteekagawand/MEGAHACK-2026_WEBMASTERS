import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const { image, additionalInfo } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "Lab report image is required" }, { status: 400 });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare the nutrition-focused prompt
    const prompt = `You are an expert clinical nutritionist AI specializing in analyzing lab reports to provide personalized nutrition recommendations. Analyze the medical lab report image and provide comprehensive nutrition guidance.

${additionalInfo ? `Patient Context: ${additionalInfo}` : ""}

Analyze the lab report and provide nutrition recommendations in the following JSON format:

{
  "reportSummary": {
    "reportType": "Blood Test/Urine Test/etc.",
    "testDate": "Date if visible",
    "overallHealthStatus": "Good/Fair/Needs Attention"
  },
  "nutritionalDeficiencies": [
    {
      "nutrient": "e.g., Iron, Vitamin D, B12, Calcium",
      "currentLevel": "Value from report",
      "normalRange": "Reference range",
      "status": "Deficient" | "Low" | "Normal" | "High",
      "severity": "Mild" | "Moderate" | "Severe",
      "symptoms": ["Possible symptoms from this deficiency"]
    }
  ],
  "healthMarkers": [
    {
      "marker": "e.g., Cholesterol, Blood Sugar, Uric Acid",
      "value": "Patient's value",
      "normalRange": "Reference range",
      "status": "Normal" | "High" | "Low",
      "dietaryImpact": "How diet affects this marker",
      "foodsToInclude": ["Recommended foods"],
      "foodsToAvoid": ["Foods to limit or avoid"]
    }
  ],
  "personalizedDietPlan": {
    "dailyCalories": "Recommended daily calorie intake",
    "macros": {
      "protein": "grams per day",
      "carbs": "grams per day",
      "fats": "grams per day",
      "fiber": "grams per day"
    },
    "mealTiming": {
      "breakfast": "Suggested time and composition",
      "lunch": "Suggested time and composition",
      "dinner": "Suggested time and composition",
      "snacks": "Suggested snacks if needed"
    }
  },
  "recommendedFoods": {
    "byDeficiency": [
      {
        "deficiency": "e.g., Iron Deficiency",
        "vegetarian": ["Vegetarian food sources"],
        "nonVegetarian": ["Non-vegetarian food sources"],
        "supplements": "Suggested supplements if needed"
      }
    ],
    "superfoods": ["Top 5 superfoods for this patient"],
    "herbs": ["Beneficial herbs/spices for the condition"]
  },
  "mealPlan": {
    "weekDays": [
      {
        "day": "Monday",
        "meals": {
          "breakfast": "Specific meal suggestion",
          "lunch": "Specific meal suggestion",
          "dinner": "Specific meal suggestion",
          "snacks": "Snack suggestions"
        }
      }
    ],
    "notes": "Special preparation notes or timing"
  },
  "lifestyleRecommendations": {
    "exercise": "Recommended physical activity",
    "hydration": "Water intake recommendation",
    "sleep": "Sleep recommendations",
    "stress": "Stress management tips"
  },
  "foodsToAvoid": {
    "strict": ["Must avoid completely"],
    "moderate": ["Limit consumption"],
    "occasional": ["Can have occasionally"]
  },
  "supplements": [
    {
      "name": "Supplement name",
      "dosage": "Recommended dosage",
      "timing": "When to take",
      "reason": "Why needed",
      "duration": "How long to take"
    }
  ],
  "progressTracking": {
    "markers": ["Key markers to monitor"],
    "frequency": "How often to retest",
    "targetValues": ["Target values to aim for"]
  },
  "indianDietOptions": {
    "vegetarian": {
      "breakfast": ["Indian breakfast options"],
      "lunch": ["Indian lunch options"],
      "dinner": ["Indian dinner options"]
    },
    "nonVegetarian": {
      "breakfast": ["Non-veg breakfast options"],
      "lunch": ["Non-veg lunch options"],
      "dinner": ["Non-veg dinner options"]
    }
  },
  "warnings": ["Important dietary warnings or contraindications"],
  "confidence": 90
}

Guidelines:
1. Focus on INDIAN diet options with local foods
2. Include both vegetarian and non-vegetarian options
3. Consider regional food availability
4. Be specific about portion sizes and timing
5. Account for any medical conditions indicated in the report
6. Consider food-drug interactions if medications mentioned
7. Provide practical, affordable food options
8. Include seasonal recommendations
9. Suggest easily available ingredients
10. Always err on the side of caution

Important Markers to Analyze:
- Hemoglobin → Iron deficiency
- Vitamin D3 → Bone health, immunity
- Vitamin B12 → Nerve health, energy
- Calcium → Bone health
- Folate → Cell production
- Cholesterol (LDL, HDL, Triglycerides) → Heart health
- Blood Glucose (Fasting, HbA1c) → Diabetes risk
- Uric Acid → Gout risk
- Liver enzymes (SGPT, SGOT) → Liver health
- Kidney markers (Creatinine, Urea) → Kidney health
- Thyroid (TSH, T3, T4) → Metabolism

Return ONLY the JSON object, no additional text.`;

    // Convert base64 to the format Gemini expects
    const imagePart = {
      inlineData: {
        data: image,
        mimeType: "image/jpeg",
      },
    };

    // Generate content
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean the response to extract JSON
      let cleanedResponse = text.trim();

      // Remove any markdown code blocks
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      // Parse the JSON response
      const analysis = JSON.parse(cleanedResponse);

      return NextResponse.json(analysis);
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.log("Raw response:", text);

      // Fallback response if JSON parsing fails
      return NextResponse.json({
        reportSummary: {
          reportType: "Lab Report",
          testDate: "Date not visible",
          overallHealthStatus: "Needs Attention"
        },
        nutritionalDeficiencies: [],
        healthMarkers: [],
        personalizedDietPlan: {
          dailyCalories: "2000",
          macros: { protein: "60g", carbs: "250g", fats: "65g", fiber: "30g" },
          mealTiming: {}
        },
        recommendedFoods: { byDeficiency: [], superfoods: [], herbs: [] },
        mealPlan: { weekDays: [], notes: "Consult nutritionist for detailed plan" },
        lifestyleRecommendations: { exercise: "", hydration: "", sleep: "", stress: "" },
        foodsToAvoid: { strict: [], moderate: [], occasional: [] },
        supplements: [],
        progressTracking: { markers: [], frequency: "3 months", targetValues: [] },
        indianDietOptions: { vegetarian: {}, nonVegetarian: {} },
        warnings: ["Please consult a qualified nutritionist for personalized advice"],
        confidence: 50,
        rawAnalysis: text,
      });
    }
  } catch (error) {
    console.error("Error analyzing nutrition:", error);

    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "API configuration error. Please check GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze nutrition. Please try again." },
      { status: 500 }
    );
  }
}
