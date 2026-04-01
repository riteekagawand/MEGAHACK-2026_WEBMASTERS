// lib/agents/nutritionAgent.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface NutritionInput {
  labReportText?: string;
  deficiencies?: string[];
  healthConditions?: string[];
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  dietaryPreference?: "vegetarian" | "non-vegetarian" | "vegan";
  allergies?: string[];
  medications?: string[];
}

export interface NutritionRecommendation {
  reportSummary: {
    reportType: string;
    testDate: string;
    overallHealthStatus: string;
  };
  nutritionalDeficiencies: Array<{
    nutrient: string;
    currentLevel: string;
    normalRange: string;
    status: string;
    severity: string;
    symptoms: string[];
  }>;
  healthMarkers: Array<{
    marker: string;
    value: string;
    normalRange: string;
    status: string;
    dietaryImpact: string;
    foodsToInclude: string[];
    foodsToAvoid: string[];
  }>;
  personalizedDietPlan: {
    dailyCalories: string;
    macros: {
      protein: string;
      carbs: string;
      fats: string;
      fiber: string;
    };
    mealTiming: {
      breakfast: string;
      lunch: string;
      dinner: string;
      snacks: string;
    };
  };
  recommendedFoods: {
    byDeficiency: Array<{
      deficiency: string;
      vegetarian: string[];
      nonVegetarian: string[];
      supplements: string;
    }>;
    superfoods: string[];
    herbs: string[];
  };
  lifestyleRecommendations: {
    exercise: string;
    hydration: string;
    sleep: string;
    stress: string;
  };
  foodsToAvoid: {
    strict: string[];
    moderate: string[];
    occasional: string[];
  };
  supplements: Array<{
    name: string;
    dosage: string;
    timing: string;
    reason: string;
    duration: string;
  }>;
  progressTracking: {
    markers: string[];
    frequency: string;
    targetValues: string[];
  };
  warnings: string[];
  confidence: number;
}

export class NutritionAgent {
  private model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "").getGenerativeModel(
    { model: "gemini-2.5-flash" }
  );

  async analyzeFromLabReport(
    labReportText: string,
    patientContext: Partial<NutritionInput>
  ): Promise<NutritionRecommendation> {
    if (!process.env.GEMINI_API_KEY) {
      return this.fallbackRecommendation(labReportText, patientContext);
    }

    const systemPrompt = `You are an expert clinical nutritionist AI specializing in analyzing lab reports to provide personalized nutrition recommendations.

TASK: Analyze the provided lab report text and generate comprehensive nutrition guidance.

PATIENT CONTEXT:
- Age: ${patientContext.age || "Not specified"}
- Gender: ${patientContext.gender || "Not specified"}
- Weight: ${patientContext.weight || "Not specified"} kg
- Height: ${patientContext.height || "Not specified"} cm
- Dietary Preference: ${patientContext.dietaryPreference || "Not specified"}
- Allergies: ${patientContext.allergies?.join(", ") || "None reported"}
- Current Medications: ${patientContext.medications?.join(", ") || "None reported"}
- Known Deficiencies: ${patientContext.deficiencies?.join(", ") || "None reported"}
- Health Conditions: ${patientContext.healthConditions?.join(", ") || "None reported"}

ANALYSIS FOCUS:
1. Identify all nutritional deficiencies from lab values
2. Map health markers to dietary recommendations
3. Create personalized diet plan with Indian food options
4. Suggest supplements with proper dosage and timing
5. Consider food-drug interactions with current medications
6. Account for allergies and dietary preferences

OUTPUT FORMAT:
Return a valid JSON object with the following structure:
{
  "reportSummary": {
    "reportType": "string",
    "testDate": "string",
    "overallHealthStatus": "Good/Fair/Needs Attention"
  },
  "nutritionalDeficiencies": [...],
  "healthMarkers": [...],
  "personalizedDietPlan": {...},
  "recommendedFoods": {...},
  "lifestyleRecommendations": {...},
  "foodsToAvoid": {...},
  "supplements": [...],
  "progressTracking": {...},
  "warnings": [...],
  "confidence": number (0-100)
}`;

    const userPrompt = `Analyze this lab report and provide personalized nutrition recommendations:

LAB REPORT:
${labReportText}

Provide comprehensive nutrition guidance including:
1. Identified deficiencies and their severity
2. Foods to include for each deficiency (vegetarian and non-vegetarian)
3. Meal plan with Indian diet options
4. Supplements if needed
5. Foods to avoid based on health markers
6. Lifestyle recommendations

Return ONLY valid JSON.`;

    try {
      const result = await this.model.generateContent([systemPrompt, userPrompt]);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAndSanitize(parsed);
      }
    } catch (error) {
      console.error("Nutrition analysis error:", error);
    }

    return this.fallbackRecommendation(labReportText, patientContext);
  }

  async getMealPlan(
    deficiencies: string[],
    healthConditions: string[],
    dietaryPreference: "vegetarian" | "non-vegetarian" | "vegan",
    patientContext: Partial<NutritionInput>
  ): Promise<{
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  }> {
    if (!process.env.GEMINI_API_KEY) {
      return this.getDefaultMealPlan(dietaryPreference);
    }

    const prompt = `Generate a one-day meal plan for someone with:
- Deficiencies: ${deficiencies.join(", ")}
- Health conditions: ${healthConditions.join(", ")}
- Dietary preference: ${dietaryPreference}
- Age: ${patientContext.age || "Not specified"}
- Gender: ${patientContext.gender || "Not specified"}

Return JSON with structure:
{
  "breakfast": ["meal option 1", "meal option 2"],
  "lunch": ["meal option 1", "meal option 2"],
  "dinner": ["meal option 1", "meal option 2"],
  "snacks": ["snack 1", "snack 2"]
}

Focus on Indian cuisine. Return ONLY JSON.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("Meal plan generation error:", error);
    }

    return this.getDefaultMealPlan(dietaryPreference);
  }

  private validateAndSanitize(parsed: any): NutritionRecommendation {
    return {
      reportSummary: {
        reportType: parsed.reportSummary?.reportType || "Lab Report",
        testDate: parsed.reportSummary?.testDate || "Unknown",
        overallHealthStatus: parsed.reportSummary?.overallHealthStatus || "Needs Attention",
      },
      nutritionalDeficiencies: Array.isArray(parsed.nutritionalDeficiencies)
        ? parsed.nutritionalDeficiencies
        : [],
      healthMarkers: Array.isArray(parsed.healthMarkers) ? parsed.healthMarkers : [],
      personalizedDietPlan: {
        dailyCalories: parsed.personalizedDietPlan?.dailyCalories || "2000",
        macros: {
          protein: parsed.personalizedDietPlan?.macros?.protein || "60g",
          carbs: parsed.personalizedDietPlan?.macros?.carbs || "250g",
          fats: parsed.personalizedDietPlan?.macros?.fats || "65g",
          fiber: parsed.personalizedDietPlan?.macros?.fiber || "30g",
        },
        mealTiming: {
          breakfast: parsed.personalizedDietPlan?.mealTiming?.breakfast || "7-8 AM",
          lunch: parsed.personalizedDietPlan?.mealTiming?.lunch || "12-1 PM",
          dinner: parsed.personalizedDietPlan?.mealTiming?.dinner || "7-8 PM",
          snacks: parsed.personalizedDietPlan?.mealTiming?.snacks || "Mid-morning & evening",
        },
      },
      recommendedFoods: {
        byDeficiency: Array.isArray(parsed.recommendedFoods?.byDeficiency)
          ? parsed.recommendedFoods.byDeficiency
          : [],
        superfoods: Array.isArray(parsed.recommendedFoods?.superfoods)
          ? parsed.recommendedFoods.superfoods
          : [],
        herbs: Array.isArray(parsed.recommendedFoods?.herbs) ? parsed.recommendedFoods.herbs : [],
      },
      lifestyleRecommendations: {
        exercise: parsed.lifestyleRecommendations?.exercise || "30 min daily walk",
        hydration: parsed.lifestyleRecommendations?.hydration || "8-10 glasses water",
        sleep: parsed.lifestyleRecommendations?.sleep || "7-8 hours",
        stress: parsed.lifestyleRecommendations?.stress || "Practice meditation",
      },
      foodsToAvoid: {
        strict: Array.isArray(parsed.foodsToAvoid?.strict) ? parsed.foodsToAvoid.strict : [],
        moderate: Array.isArray(parsed.foodsToAvoid?.moderate) ? parsed.foodsToAvoid.moderate : [],
        occasional: Array.isArray(parsed.foodsToAvoid?.occasional)
          ? parsed.foodsToAvoid.occasional
          : [],
      },
      supplements: Array.isArray(parsed.supplements) ? parsed.supplements : [],
      progressTracking: {
        markers: Array.isArray(parsed.progressTracking?.markers) ? parsed.progressTracking.markers : [],
        frequency: parsed.progressTracking?.frequency || "3 months",
        targetValues: Array.isArray(parsed.progressTracking?.targetValues)
          ? parsed.progressTracking.targetValues
          : [],
      },
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : ["Consult a healthcare provider"],
      confidence: Math.min(Math.max(parsed.confidence || 70, 1), 100),
    };
  }

  private fallbackRecommendation(
    labReportText: string,
    patientContext: Partial<NutritionInput>
  ): NutritionRecommendation {
    const deficiencies: Array<{
      nutrient: string;
      currentLevel: string;
      normalRange: string;
      status: string;
      severity: string;
      symptoms: string[];
    }> = [];

    const lowerReport = labReportText.toLowerCase();

    // Check for common deficiencies
    if (lowerReport.includes("hemoglobin") || lowerReport.includes("iron")) {
      deficiencies.push({
        nutrient: "Iron",
        currentLevel: "Low",
        normalRange: "12-16 g/dL (women), 14-18 g/dL (men)",
        status: "Deficient",
        severity: "Moderate",
        symptoms: ["Fatigue", "Weakness", "Pale skin", "Shortness of breath"],
      });
    }

    if (lowerReport.includes("vitamin d") || lowerReport.includes("vit d")) {
      deficiencies.push({
        nutrient: "Vitamin D",
        currentLevel: "Low",
        normalRange: "30-100 ng/mL",
        status: "Deficient",
        severity: "Moderate",
        symptoms: ["Bone pain", "Muscle weakness", "Fatigue", "Mood changes"],
      });
    }

    if (lowerReport.includes("b12") || lowerReport.includes("cobalamin")) {
      deficiencies.push({
        nutrient: "Vitamin B12",
        currentLevel: "Low",
        normalRange: "200-900 pg/mL",
        status: "Deficient",
        severity: "Moderate",
        symptoms: ["Numbness", "Fatigue", "Memory problems", "Mood changes"],
      });
    }

    return {
      reportSummary: {
        reportType: "Lab Report",
        testDate: "Unknown",
        overallHealthStatus: deficiencies.length > 0 ? "Needs Attention" : "Fair",
      },
      nutritionalDeficiencies: deficiencies,
      healthMarkers: [],
      personalizedDietPlan: {
        dailyCalories: "2000",
        macros: { protein: "60g", carbs: "250g", fats: "65g", fiber: "30g" },
        mealTiming: {
          breakfast: "7-8 AM",
          lunch: "12-1 PM",
          dinner: "7-8 PM",
          snacks: "Mid-morning & evening",
        },
      },
      recommendedFoods: {
        byDeficiency: deficiencies.map((d) => ({
          deficiency: `${d.nutrient} Deficiency`,
          vegetarian: d.nutrient === "Iron"
            ? ["Spinach", "Lentils", "Tofu", "Chickpeas"]
            : ["Fortified cereals", "Mushrooms", "Fortified milk"],
          nonVegetarian: d.nutrient === "Iron"
            ? ["Red meat", "Liver", "Chicken", "Fish"]
            : ["Salmon", "Eggs", "Sardines"],
          supplements: `Consult doctor for ${d.nutrient} supplementation`,
        })),
        superfoods: ["Spinach", "Nuts", "Berries", "Yogurt", "Whole grains"],
        herbs: ["Turmeric", "Ginger", "Ashwagandha", "Tulsi"],
      },
      lifestyleRecommendations: {
        exercise: "30 min daily walk",
        hydration: "8-10 glasses water",
        sleep: "7-8 hours",
        stress: "Practice meditation or yoga",
      },
      foodsToAvoid: {
        strict: [],
        moderate: ["Processed foods", "Sugary drinks", "Excessive salt"],
        occasional: ["Fried foods", "Sweets"],
      },
      supplements: [],
      progressTracking: {
        markers: deficiencies.map((d) => d.nutrient),
        frequency: "3 months",
        targetValues: deficiencies.map((d) => `${d.nutrient}: within normal range`),
      },
      warnings: ["Please consult a qualified nutritionist for personalized advice"],
      confidence: 60,
    };
  }

  private getDefaultMealPlan(preference: string): {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  } {
    if (preference === "vegetarian") {
      return {
        breakfast: ["Oats with fruits and nuts", "Vegetable upma with curd"],
        lunch: ["Rice, dal, vegetables, salad", "Roti with paneer curry and greens"],
        dinner: ["Light khichdi with vegetables", "Soup with whole grain bread"],
        snacks: ["Fruits", "Nuts", "Roasted chana"],
      };
    } else {
      return {
        breakfast: ["Eggs with toast", "Oats with fruits"],
        lunch: ["Rice with chicken curry", "Fish with vegetables"],
        dinner: ["Grilled fish/chicken with salad", "Light soup"],
        snacks: ["Fruits", "Nuts", "Yogurt"],
      };
    }
  }
}
