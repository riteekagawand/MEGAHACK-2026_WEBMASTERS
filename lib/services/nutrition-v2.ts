import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

const nutritionSchema = z.object({
  reportSummary: z.object({
    reportType: z.string().default("Lab Report"),
    testDate: z.string().default("Date not visible"),
    overallHealthStatus: z.string().default("Needs Attention"),
  }),
  nutritionalDeficiencies: z.array(
    z.object({
      nutrient: z.string(),
      currentLevel: z.string(),
      normalRange: z.string(),
      status: z.string(),
      severity: z.string(),
      symptoms: z.array(z.string()).default([]),
    })
  ).default([]),
  healthMarkers: z.array(
    z.object({
      marker: z.string(),
      value: z.string(),
      normalRange: z.string(),
      status: z.string(),
      dietaryImpact: z.string(),
      foodsToInclude: z.array(z.string()).default([]),
      foodsToAvoid: z.array(z.string()).default([]),
    })
  ).default([]),
  personalizedDietPlan: z.object({
    dailyCalories: z.string().default("2000"),
    macros: z.object({
      protein: z.string().default("60g"),
      carbs: z.string().default("250g"),
      fats: z.string().default("65g"),
      fiber: z.string().default("30g"),
    }),
    mealTiming: z.object({
      breakfast: z.string().default("8:00 AM"),
      lunch: z.string().default("1:00 PM"),
      dinner: z.string().default("7:30 PM"),
      snacks: z.string().default("2 light snacks"),
    }),
  }),
  recommendedFoods: z.object({
    byDeficiency: z.array(
      z.object({
        deficiency: z.string(),
        vegetarian: z.array(z.string()).default([]),
        nonVegetarian: z.array(z.string()).default([]),
        supplements: z.string().default("Consult physician"),
      })
    ).default([]),
    superfoods: z.array(z.string()).default([]),
    herbs: z.array(z.string()).default([]),
  }),
  mealPlan: z.object({
    weekDays: z.array(
      z.object({
        day: z.string(),
        meals: z.object({
          breakfast: z.string(),
          lunch: z.string(),
          dinner: z.string(),
          snacks: z.string(),
        }),
      })
    ).default([]),
    notes: z.string().default("Adjust portions based on appetite and activity level."),
  }),
  lifestyleRecommendations: z.object({
    exercise: z.string().default("30 minutes daily walking"),
    hydration: z.string().default("2.5-3 liters water daily"),
    sleep: z.string().default("7-8 hours nightly"),
    stress: z.string().default("10-15 minutes mindfulness daily"),
  }),
  foodsToAvoid: z.object({
    strict: z.array(z.string()).default([]),
    moderate: z.array(z.string()).default([]),
    occasional: z.array(z.string()).default([]),
  }),
  supplements: z.array(
    z.object({
      name: z.string(),
      dosage: z.string(),
      timing: z.string(),
      reason: z.string(),
      duration: z.string(),
    })
  ).default([]),
  progressTracking: z.object({
    markers: z.array(z.string()).default([]),
    frequency: z.string().default("Every 8-12 weeks"),
    targetValues: z.array(z.string()).default([]),
  }),
  indianDietOptions: z.object({
    vegetarian: z.object({
      breakfast: z.array(z.string()).default([]),
      lunch: z.array(z.string()).default([]),
      dinner: z.array(z.string()).default([]),
    }),
    nonVegetarian: z.object({
      breakfast: z.array(z.string()).default([]),
      lunch: z.array(z.string()).default([]),
      dinner: z.array(z.string()).default([]),
    }),
  }),
  warnings: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(100).default(80),
});

export type NutritionAnalysisV2 = z.infer<typeof nutritionSchema>;

export async function generateNutritionAnalysisV2(
  extractedLabContext: string,
  additionalInfo?: string
): Promise<NutritionAnalysisV2> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing for nutrition v2");
  }

  const llm = new ChatGoogleGenerativeAI({
    apiKey,
    model: "gemini-2.5-flash",
    temperature: 0,
  });

  const parser = StructuredOutputParser.fromZodSchema(nutritionSchema);
  const formatInstructions = parser.getFormatInstructions();

  const prompt = PromptTemplate.fromTemplate(
    `You are a clinical nutrition specialist for Indian patients.
Use the extracted lab context and patient context to generate a safe, practical nutrition plan.
Prioritize:
- medically safe guidance
- affordable Indian foods
- clear meal timing and portion-minded recommendations
- deficiency and marker-oriented advice

Extracted lab context:
{lab_context}

Patient context:
{patient_context}

Output must follow this schema exactly:
{format_instructions}`
  );

  const chain = RunnableSequence.from([prompt, llm, parser]);

  return chain.invoke({
    lab_context: extractedLabContext,
    patient_context: additionalInfo?.trim() || "No extra patient context provided.",
    format_instructions: formatInstructions,
  });
}

