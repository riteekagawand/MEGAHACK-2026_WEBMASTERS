import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_GENERATE_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 800;

function getErrorStatusCode(error: unknown): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  parts: unknown[]
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_GENERATE_RETRIES; attempt++) {
    try {
      return await model.generateContent(parts);
    } catch (error) {
      lastError = error;
      const statusCode = getErrorStatusCode(error);
      const isRetryable =
        statusCode !== null && RETRYABLE_STATUS_CODES.has(statusCode);

      if (!isRetryable || attempt === MAX_GENERATE_RETRIES) {
        throw error;
      }

      const jitterMs = Math.floor(Math.random() * 200);
      const delayMs = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1) + jitterMs;
      await sleep(delayMs);
    }
  }

  throw lastError;
}

// Comprehensive lab report analysis with actionable insights
export async function POST(request: NextRequest) {
  try {
    const { image, additionalInfo } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare the comprehensive prompt
    const prompt = `You are an expert medical AI assistant specializing in laboratory report analysis. Analyze the medical lab report image provided and give comprehensive insights.

${additionalInfo ? `Patient Context: ${additionalInfo}` : ""}

Please analyze the lab report and provide detailed information in the following JSON format:

{
  "reportType": "Blood Test/Urine Test/X-Ray/CT Scan/etc.",
  "testDate": "Date of the test if visible",
  "keyFindings": [
    {
      "parameter": "Test parameter name (e.g., Hemoglobin, Glucose, etc.)",
      "value": "Patient's actual value",
      "normalRange": "Normal reference range",
      "status": "Normal" | "High" | "Low" | "Critical",
      "significance": "What this finding means for the patient's health"
    }
  ],
  "overallAssessment": {
    "status": "Normal" | "Attention Needed" | "Urgent Care Required",
    "summary": "Overall summary of the report findings",
    "riskLevel": "Low" | "Medium" | "High"
  },
  "recommendations": {
    "immediate": ["Immediate actions needed if any"],
    "lifestyle": ["Lifestyle modifications"],
    "followUp": ["Follow-up tests or consultations needed"],
    "dietary": ["Dietary recommendations based on findings"]
  },
  "trends": [
    {
      "parameter": "Parameter name",
      "trend": "Improving" | "Stable" | "Worsening",
      "description": "Description of the trend if multiple reports available"
    }
  ],
  "redFlags": ["Critical findings that need immediate attention"],
  "nextSteps": ["Ordered list of next steps for the patient"],
  "confidence": 90
}

Analysis Guidelines:
1. Extract ALL visible test parameters with their values and normal ranges
2. Identify abnormal values and explain their clinical significance
3. Consider the patient's context if provided (age, symptoms, medical history)
4. Provide actionable recommendations based on findings
5. Highlight any critical values that need immediate medical attention
6. Suggest appropriate follow-up tests or consultations
7. Include lifestyle and dietary recommendations relevant to the findings
8. If it's a follow-up report, try to identify trends
9. Always err on the side of caution for patient safety
10. Be specific about urgency levels and timeframes

Critical Value Indicators:
- Extremely high or low values outside normal ranges
- Values indicating organ dysfunction
- Signs of infection, inflammation, or disease
- Diabetic emergency indicators
- Cardiac markers indicating heart problems
- Kidney or liver function abnormalities

Return ONLY the JSON object, no additional text.`;

    // Convert base64 to the format Gemini expects
    const imagePart = {
      inlineData: {
        data: image,
        mimeType: "image/jpeg",
      },
    };

    // Generate content
    const result = await generateWithRetry(model, [prompt, imagePart]);
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

      // Validate required fields
      if (!analysis.reportType) {
        throw new Error("Could not identify report type");
      }

    return NextResponse.json(analysis);

  } catch (error) {
    console.error("Error analyzing lab report:", error);
    const statusCode = getErrorStatusCode(error);

    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "API configuration error. Please check GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    if (statusCode !== null && RETRYABLE_STATUS_CODES.has(statusCode)) {
      return NextResponse.json(
        {
          error:
            "AI service is temporarily busy. Please retry in a few moments.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze lab report. Please try again." },
      { status: 500 }
    );
  }
}

function generateLabAnalysis(type: string, context: string) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const analyses: Record<string, any> = {
    blood: generateBloodAnalysis(dateStr),
    urine: generateUrineAnalysis(dateStr),
    xray: generateXrayAnalysis(dateStr),
    diabetes: generateDiabetesAnalysis(dateStr),
    thyroid: generateThyroidAnalysis(dateStr),
    lipid: generateLipidAnalysis(dateStr),
    liver: generateLiverAnalysis(dateStr),
    kidney: generateKidneyAnalysis(dateStr),
    cbc: generateCBCAnalysis(dateStr),
  };

  return analyses[type] || analyses.blood;
}

function generateBloodAnalysis(dateStr: string) {
  return {
    reportType: "Complete Blood Count (CBC)",
    testDate: dateStr,
    keyFindings: [
      {
        parameter: "Hemoglobin",
        value: "12.8 g/dL",
        normalRange: "13.5 - 17.5 g/dL (Male), 12.0 - 15.5 g/dL (Female)",
        status: "Low",
        significance: "Slightly below normal range indicating mild anemia. May cause fatigue and weakness."
      },
      {
        parameter: "White Blood Cell Count",
        value: "7,200 /μL",
        normalRange: "4,500 - 11,000 /μL",
        status: "Normal",
        significance: "Within normal range indicating healthy immune function."
      },
      {
        parameter: "Platelet Count",
        value: "245,000 /μL",
        normalRange: "150,000 - 450,000 /μL",
        status: "Normal",
        significance: "Normal clotting function. No bleeding risk detected."
      },
      {
        parameter: "Red Blood Cell Count",
        value: "4.2 million/μL",
        normalRange: "4.7 - 6.1 million/μL (Male), 4.2 - 5.4 million/μL (Female)",
        status: "Low",
        significance: "Lower than optimal, consistent with mild anemia."
      }
    ],
    overallAssessment: {
      status: "Attention Needed",
      summary: "Mild anemia detected with slightly low hemoglobin and RBC counts. Other blood parameters are within normal range. This is a common finding and usually correctable with dietary changes and supplements.",
      riskLevel: "Low"
    },
    recommendations: {
      immediate: [
        "Start iron-rich diet immediately - include spinach, red meat, lentils",
        "Take Vitamin C with iron meals to enhance absorption",
        "Avoid tea or coffee within 2 hours of iron-rich meals",
        "Consider iron supplement (consult doctor for dosage)"
      ],
      lifestyle: [
        "Get 7-8 hours of quality sleep daily",
        "Moderate exercise 30 minutes daily (avoid overexertion)",
        "Stay hydrated - drink 8-10 glasses of water",
        "Manage stress through meditation or yoga",
        "Avoid smoking and limit alcohol consumption"
      ],
      followUp: [
        "Repeat CBC test in 3 months to monitor improvement",
        "Consult hematologist if symptoms persist",
        "Check ferritin and vitamin B12 levels",
        "Rule out internal bleeding if anemia is unexplained"
      ],
      dietary: [
        "Increase iron-rich foods: spinach, kale, red meat, beans, fortified cereals",
        "Add Vitamin C sources: oranges, strawberries, bell peppers, tomatoes",
        "Include folate-rich foods: leafy greens, legumes, asparagus",
        "Consume vitamin B12: eggs, dairy, fish, poultry",
        "Avoid calcium-rich foods with iron meals (separate by 2 hours)"
      ]
    },
    trends: [
      {
        parameter: "Hemoglobin",
        trend: "Stable",
        description: "Values consistent with previous reports. Monitor for improvement with dietary changes."
      }
    ],
    redFlags: [
      "Hemoglobin below normal range - requires attention but not urgent",
      "Monitor for symptoms: dizziness, fatigue, pale skin, shortness of breath"
    ],
    nextSteps: [
      "Start iron and vitamin-rich diet immediately",
      "Schedule follow-up CBC in 3 months",
      "Consult doctor if you experience severe fatigue or dizziness",
      "Consider iron supplements after consulting healthcare provider",
      "Track energy levels and any symptoms daily"
    ],
    confidence: 85
  };
}

function generateDiabetesAnalysis(dateStr: string) {
  return {
    reportType: "Diabetes Screening Panel",
    testDate: dateStr,
    keyFindings: [
      {
        parameter: "Fasting Blood Glucose",
        value: "142 mg/dL",
        normalRange: "70 - 100 mg/dL",
        status: "High",
        significance: "Elevated fasting glucose indicates impaired glucose metabolism. Consistent with pre-diabetes or early diabetes."
      },
      {
        parameter: "HbA1c",
        value: "6.8%",
        normalRange: "Below 5.7%",
        status: "High",
        significance: "HbA1c of 6.8% indicates average blood sugar has been elevated over past 2-3 months. Pre-diabetes range."
      },
      {
        parameter: "Post-Prandial Glucose",
        value: "180 mg/dL",
        normalRange: "Below 140 mg/dL",
        status: "High",
        significance: "Elevated after-meal glucose suggests reduced insulin sensitivity."
      }
    ],
    overallAssessment: {
      status: "Attention Needed",
      summary: "Pre-diabetes condition detected. Blood sugar levels are elevated but not in diabetic range yet. Immediate lifestyle intervention can prevent or delay progression to Type 2 diabetes.",
      riskLevel: "Medium"
    },
    recommendations: {
      immediate: [
        "Reduce sugar intake immediately - eliminate sugary drinks and desserts",
        "Start monitoring blood glucose daily (fasting and 2 hours after meals)",
        "Begin 30-minute brisk walking daily",
        "Reduce carbohydrate portion sizes by 25%",
        "Increase fiber intake to 25-30g daily"
      ],
      lifestyle: [
        "Exercise 150 minutes per week (moderate intensity)",
        "Lose 5-7% body weight if overweight (significant impact on glucose)",
        "Sleep 7-8 hours nightly (poor sleep affects insulin sensitivity)",
        "Manage stress (cortisol raises blood sugar)",
        "Stand and move every 30 minutes if sedentary"
      ],
      followUp: [
        "Repeat HbA1c in 3 months to track progress",
        "Consult endocrinologist if levels don't improve",
        "Annual eye examination (diabetes affects retina)",
        "Annual kidney function test",
        "Check blood pressure regularly"
      ],
      dietary: [
        "Choose low glycemic index foods: oats, quinoa, legumes, non-starchy vegetables",
        "Eat protein with every meal: fish, chicken, tofu, eggs",
        "Increase fiber: vegetables, whole grains, nuts, seeds",
        "Healthy fats: avocado, olive oil, nuts (in moderation)",
        "Avoid: white bread, white rice, sugary drinks, processed foods",
        "Portion control: Use smaller plates, eat slowly, stop when 80% full"
      ]
    },
    trends: [
      {
        parameter: "Blood Glucose",
        trend: "Stable",
        description: "Consistently elevated but stable. Good candidate for lifestyle intervention."
      }
    ],
    redFlags: [
      "Fasting glucose > 126 mg/dL on repeat tests indicates diabetes",
      "Watch for symptoms: excessive thirst, frequent urination, blurred vision, slow healing wounds"
    ],
    nextSteps: [
      "Start diabetes prevention diet immediately",
      "Begin daily exercise routine (30 min walking)",
      "Monitor blood glucose at home if possible",
      "Schedule follow-up with doctor in 1 month",
      "Join diabetes prevention program if available",
      "Get support from family for lifestyle changes"
    ],
    confidence: 88
  };
}

function generateLipidAnalysis(dateStr: string) {
  return {
    reportType: "Lipid Profile",
    testDate: dateStr,
    keyFindings: [
      {
        parameter: "Total Cholesterol",
        value: "220 mg/dL",
        normalRange: "Below 200 mg/dL",
        status: "High",
        significance: "Borderline high. Increased risk of cardiovascular disease if not managed."
      },
      {
        parameter: "LDL (Bad Cholesterol)",
        value: "145 mg/dL",
        normalRange: "Below 100 mg/dL",
        status: "High",
        significance: "Elevated LDL increases risk of plaque buildup in arteries."
      },
      {
        parameter: "HDL (Good Cholesterol)",
        value: "42 mg/dL",
        normalRange: "Above 40 mg/dL (Male), Above 50 mg/dL (Female)",
        status: "Low",
        significance: "HDL is protective but on the lower side. Should be improved."
      },
      {
        parameter: "Triglycerides",
        value: "165 mg/dL",
        normalRange: "Below 150 mg/dL",
        status: "High",
        significance: "Mildly elevated. Associated with heart disease risk and metabolic syndrome."
      }
    ],
    overallAssessment: {
      status: "Attention Needed",
      summary: "Dyslipidemia detected with elevated total cholesterol, LDL, and triglycerides. HDL is borderline low. Cardiovascular risk is elevated but manageable with lifestyle changes.",
      riskLevel: "Medium"
    },
    recommendations: {
      immediate: [
        "Eliminate trans fats completely (avoid processed foods, fried items)",
        "Reduce saturated fat: limit red meat, full-fat dairy, butter",
        "Add 2 tablespoons of nuts daily (almonds, walnuts)",
        "Start 30-minute cardio exercise 5 days a week",
        "Increase soluble fiber: oats, beans, apples, flaxseeds"
      ],
      lifestyle: [
        "Aerobic exercise 150 minutes/week (brisk walking, cycling, swimming)",
        "Quit smoking if applicable (major impact on HDL)",
        "Limit alcohol (raises triglycerides)",
        "Maintain healthy weight (BMI 18.5-24.9)",
        "Manage stress (affects cholesterol levels)"
      ],
      followUp: [
        "Repeat lipid profile in 3 months",
        "Consider statin therapy if no improvement (consult doctor)",
        "Annual cardiovascular risk assessment",
        "Check blood pressure and blood sugar"
      ],
      dietary: [
        "Eat fatty fish 2x/week: salmon, mackerel, sardines (omega-3)",
        "Use olive oil instead of butter or ghee",
        "Increase soluble fiber: oatmeal, beans, lentils, Brussels sprouts",
        "Add plant sterols: nuts, seeds, whole grains",
        "Limit: egg yolks (3/week max), organ meats, shellfish",
        "Cook with: steaming, grilling, baking (avoid frying)"
      ]
    },
    trends: [
      {
        parameter: "LDL Cholesterol",
        trend: "Stable",
        description: "Consistently elevated. Lifestyle intervention strongly recommended."
      }
    ],
    redFlags: [
      "LDL > 160 mg/dL significantly increases heart disease risk",
      "Combined high LDL + low HDL = elevated cardiovascular risk"
    ],
    nextSteps: [
      "Implement heart-healthy diet immediately",
      "Start regular exercise program",
      "Schedule follow-up lipid test in 3 months",
      "Consult cardiologist if family history of heart disease",
      "Monitor blood pressure regularly",
      "Consider medication if levels don't improve with lifestyle"
    ],
    confidence: 90
  };
}

function generateThyroidAnalysis(dateStr: string) {
  return {
    reportType: "Thyroid Function Test",
    testDate: dateStr,
    keyFindings: [
      {
        parameter: "TSH (Thyroid Stimulating Hormone)",
        value: "5.8 mIU/L",
        normalRange: "0.4 - 4.0 mIU/L",
        status: "High",
        significance: "Elevated TSH suggests hypothyroidism (underactive thyroid). Thyroid is not producing enough hormones."
      },
      {
        parameter: "T4 (Thyroxine)",
        value: "6.2 μg/dL",
        normalRange: "4.5 - 12.0 μg/dL",
        status: "Normal",
        significance: "Currently in normal range but may decline as condition progresses."
      },
      {
        parameter: "T3 (Triiodothyronine)",
        value: "95 ng/dL",
        normalRange: "80 - 200 ng/dL",
        status: "Normal",
        significance: "Within normal range. Body is compensating currently."
      }
    ],
    overallAssessment: {
      status: "Attention Needed",
      summary: "Subclinical hypothyroidism detected. TSH is elevated but thyroid hormones (T3, T4) are still normal. This is an early stage that may progress to overt hypothyroidism. Treatment decision depends on symptoms and TSH level.",
      riskLevel: "Low"
    },
    recommendations: {
      immediate: [
        "Consult endocrinologist for treatment decision",
        "Start selenium-rich foods: Brazil nuts (2-3/day), seafood, eggs",
        "Ensure adequate iodine: use iodized salt, seaweed",
        "Avoid excessive raw goitrogens: cabbage, broccoli, cauliflower (cook them)",
        "Check for symptoms: fatigue, weight gain, cold intolerance, dry skin"
      ],
      lifestyle: [
        "Regular exercise to boost metabolism",
        "Stress management (cortisol affects thyroid)",
        "Adequate sleep (7-8 hours)",
        "Maintain healthy weight",
        "Avoid smoking"
      ],
      followUp: [
        "Repeat thyroid panel in 6 weeks",
        "Test thyroid antibodies (TPO, TG) to check for autoimmune cause",
        "Annual thyroid ultrasound if nodules suspected",
        "Monitor cholesterol (hypothyroidism raises LDL)"
      ],
      dietary: [
        "Selenium sources: Brazil nuts, tuna, sardines, eggs, legumes",
        "Iodine sources: iodized salt, fish, dairy, seaweed (in moderation)",
        "Zinc sources: oysters, beef, pumpkin seeds, chickpeas",
        "Vitamin D: fatty fish, fortified foods, sunlight exposure",
        "Limit: excessive soy products, raw cruciferous vegetables",
        "Cook goitrogenic vegetables: broccoli, cauliflower, cabbage, kale"
      ]
    },
    trends: [
      {
        parameter: "TSH",
        trend: "Worsening",
        description: "TSH has been rising gradually. Early intervention can prevent progression."
      }
    ],
    redFlags: [
      "TSH > 10 mIU/L usually requires medication",
      "Symptoms like severe fatigue, depression, or goiter need immediate attention"
    ],
    nextSteps: [
      "Schedule endocrinologist consultation",
      "Start thyroid-supporting diet",
      "Monitor for hypothyroid symptoms",
      "Repeat tests in 6 weeks",
      "Check for autoimmune thyroiditis (Hashimoto's)"
    ],
    confidence: 87
  };
}

function generateLiverAnalysis(dateStr: string) {
  return {
    reportType: "Liver Function Test (LFT)",
    testDate: dateStr,
    keyFindings: [
      {
        parameter: "SGPT (ALT)",
        value: "52 U/L",
        normalRange: "7 - 56 U/L",
        status: "Normal",
        significance: "Within normal range. No significant liver cell damage detected."
      },
      {
        parameter: "SGOT (AST)",
        value: "38 U/L",
        normalRange: "5 - 40 U/L",
        status: "Normal",
        significance: "Normal level indicating healthy liver function."
      },
      {
        parameter: "Bilirubin (Total)",
        value: "1.3 mg/dL",
        normalRange: "0.1 - 1.2 mg/dL",
        status: "High",
        significance: "Slightly elevated. May indicate mild stress on liver or Gilbert's syndrome."
      },
      {
        parameter: "Alkaline Phosphatase",
        value: "95 U/L",
        normalRange: "44 - 147 U/L",
        status: "Normal",
        significance: "Normal bile duct function."
      }
    ],
    overallAssessment: {
      status: "Attention Needed",
      summary: "Mildly elevated bilirubin with otherwise normal liver enzymes. This is often benign (Gilbert's syndrome) but should be monitored. Liver function is generally good.",
      riskLevel: "Low"
    },
    recommendations: {
      immediate: [
        "Avoid alcohol completely for 2 weeks",
        "Reduce fatty and fried foods",
        "Stay well hydrated (3 liters water daily)",
        "Avoid unnecessary medications and supplements"
      ],
      lifestyle: [
        "Limit alcohol consumption long-term",
        "Regular exercise to reduce fatty liver risk",
        "Maintain healthy weight",
        "Avoid exposure to hepatotoxins"
      ],
      followUp: [
        "Repeat LFT in 3 months",
        "Test for hepatitis B and C if not done",
        "Liver ultrasound if bilirubin remains elevated",
        "Check for Gilbert's syndrome (genetic, benign condition)"
      ],
      dietary: [
        "Liver-friendly foods: coffee (2 cups/day), green tea, berries, grapes",
        "Cruciferous vegetables: broccoli, Brussels sprouts, cauliflower",
        "Healthy fats: olive oil, avocados, nuts",
        "Avoid: alcohol, excessive sugar, processed foods",
        "Limit: red meat, high-fat dairy"
      ]
    },
    trends: [
      {
        parameter: "Bilirubin",
        trend: "Stable",
        description: "Consistently mildly elevated. Likely benign but monitor."
      }
    ],
    redFlags: [
      "Bilirubin > 3 mg/dL requires immediate attention",
      "Yellowing of eyes/skin, dark urine, pale stools need urgent care"
    ],
    nextSteps: [
      "Avoid alcohol for 2 weeks and repeat test",
      "Maintain liver-healthy diet",
      "Consult doctor if bilirubin increases",
      "Rule out Gilbert's syndrome (harmless genetic condition)"
    ],
    confidence: 82
  };
}

function generateKidneyAnalysis(dateStr: string) {
  return {
    reportType: "Kidney Function Test",
    testDate: dateStr,
    keyFindings: [
      {
        parameter: "Creatinine",
        value: "1.1 mg/dL",
        normalRange: "0.7 - 1.3 mg/dL (Male), 0.6 - 1.1 mg/dL (Female)",
        status: "Normal",
        significance: "Normal kidney filtration function."
      },
      {
        parameter: "Blood Urea Nitrogen (BUN)",
        value: "18 mg/dL",
        normalRange: "7 - 20 mg/dL",
        status: "Normal",
        significance: "Normal protein metabolism and kidney function."
      },
      {
        parameter: "eGFR",
        value: "88 mL/min/1.73m²",
        normalRange: "Above 90",
        status: "Low",
        significance: "Slightly reduced but still in normal range (Stage 1-2 kidney function)."
      },
      {
        parameter: "Uric Acid",
        value: "7.2 mg/dL",
        normalRange: "3.5 - 7.2 mg/dL (Male), 2.6 - 6.0 mg/dL (Female)",
        status: "High",
        significance: "Borderline high. Risk of gout and kidney stones if increases further."
      }
    ],
    overallAssessment: {
      status: "Attention Needed",
      summary: "Mildly elevated uric acid with good overall kidney function. eGFR is slightly reduced but acceptable. Preventive measures recommended to protect kidney health.",
      riskLevel: "Low"
    },
    recommendations: {
      immediate: [
        "Increase water intake to 3+ liters daily",
        "Reduce purine-rich foods: red meat, organ meats, seafood",
        "Limit alcohol (especially beer)",
        "Avoid high-fructose corn syrup",
        "Maintain healthy blood pressure"
      ],
      lifestyle: [
        "Stay well hydrated throughout the day",
        "Regular exercise (avoid dehydration)",
        "Maintain healthy weight",
        "Control blood pressure and blood sugar",
        "Avoid nephrotoxic medications (NSAIDs)"
      ],
      followUp: [
        "Repeat kidney function test in 6 months",
        "Monitor blood pressure regularly",
        "Annual urine microalbumin test",
        "Kidney ultrasound if symptoms develop"
      ],
      dietary: [
        "Low-purine diet: limit meat, seafood, alcohol",
        "Increase: cherries, berries, celery, cucumber (help lower uric acid)",
        "Vitamin C rich foods (moderate uric acid)",
        "Coffee (2-3 cups) may lower gout risk",
        "Avoid: sugary drinks, excessive protein",
        "Moderate: spinach, cauliflower, mushrooms (moderate purines)"
      ]
    },
    trends: [
      {
        parameter: "Uric Acid",
        trend: "Stable",
        description: "Borderline elevated. Lifestyle changes can prevent gout."
      }
    ],
    redFlags: [
      "Uric acid > 9 mg/dL significantly increases gout risk",
      "Severe joint pain, swelling, or kidney stone symptoms need urgent care"
    ],
    nextSteps: [
      "Increase daily water intake significantly",
      "Modify diet to reduce purines",
      "Monitor for gout symptoms (joint pain)",
      "Repeat tests in 6 months",
      "Maintain healthy blood pressure"
    ],
    confidence: 85
  };
}

function generateUrineAnalysis(dateStr: string) {
  return {
    reportType: "Complete Urine Examination",
    testDate: dateStr,
    keyFindings: [
      {
        parameter: "pH",
        value: "6.0",
        normalRange: "4.5 - 8.0",
        status: "Normal",
        significance: "Normal urine acidity."
      },
      {
        parameter: "Specific Gravity",
        value: "1.025",
        normalRange: "1.005 - 1.030",
        status: "Normal",
        significance: "Normal urine concentration ability."
      },
      {
        parameter: "Protein",
        value: "Trace",
        normalRange: "Negative",
        status: "High",
        significance: "Trace protein may be temporary but should be monitored."
      },
      {
        parameter: "Glucose",
        value: "Negative",
        normalRange: "Negative",
        status: "Normal",
        significance: "No glucose in urine rules out severe diabetes."
      }
    ],
    overallAssessment: {
      status: "Attention Needed",
      summary: "Trace protein detected in urine. This may be temporary due to exercise, dehydration, or mild infection. Otherwise normal urine analysis.",
      riskLevel: "Low"
    },
    recommendations: {
      immediate: [
        "Increase water intake to ensure good hydration",
        "Avoid strenuous exercise before repeat test",
        "Maintain genital hygiene",
        "Repeat urine test in 1 week"
      ],
      lifestyle: [
        "Stay well hydrated",
        "Maintain good personal hygiene",
        "Avoid holding urine for long periods",
        "Cranberry juice may help prevent UTIs"
      ],
      followUp: [
        "Repeat urine analysis in 1 week",
        "If protein persists: 24-hour urine protein test",
        "Check blood pressure (proteinuria linked to hypertension)",
        "Kidney function tests if protein continues"
      ],
      dietary: [
        "Drink 8-10 glasses of water daily",
        "Cranberry juice (unsweetened) for urinary health",
        "Avoid excessive salt",
        "Limit caffeine and alcohol",
        "Protein in moderation (if proteinuria confirmed)"
      ]
    },
    trends: [
      {
        parameter: "Protein",
        trend: "Stable",
        description: "Trace amounts detected. Likely benign but verify with repeat test."
      }
    ],
    redFlags: [
      "Persistent proteinuria may indicate kidney disease",
      "Blood in urine, pain, or burning needs immediate attention"
    ],
    nextSteps: [
      "Ensure good hydration",
      "Repeat urine test in 1 week",
      "Consult doctor if protein persists",
      "Monitor blood pressure"
    ],
    confidence: 80
  };
}

function generateXrayAnalysis(dateStr: string) {
  return {
    reportType: "Chest X-Ray",
    testDate: dateStr,
    keyFindings: [
      {
        parameter: "Lung Fields",
        value: "Clear",
        normalRange: "Clear",
        status: "Normal",
        significance: "No infiltrates, masses, or fluid detected."
      },
      {
        parameter: "Heart Size",
        value: "Normal",
        normalRange: "Cardiothoracic ratio < 50%",
        status: "Normal",
        significance: "Heart size within normal limits."
      },
      {
        parameter: "Bony Thorax",
        value: "Intact",
        normalRange: "No fractures or lesions",
        status: "Normal",
        significance: "Ribs, clavicles, and spine appear normal."
      },
      {
        parameter: "Diaphragm",
        value: "Normal contour",
        normalRange: "Smooth, well-defined",
        status: "Normal",
        significance: "No elevation or abnormalities."
      }
    ],
    overallAssessment: {
      status: "Normal",
      summary: "Normal chest X-ray. No acute cardiopulmonary abnormalities detected. Lungs are clear, heart size is normal, and bony structures are intact.",
      riskLevel: "Low"
    },
    recommendations: {
      immediate: [
        "No immediate action required",
        "Continue regular health maintenance"
      ],
      lifestyle: [
        "Maintain healthy lifestyle",
        "Regular exercise for cardiovascular health",
        "Avoid smoking",
        "Maintain healthy weight"
      ],
      followUp: [
        "Routine follow-up as per age guidelines",
        "Annual health check-up",
        "Repeat X-ray only if symptoms develop"
      ],
      dietary: [
        "Balanced diet for overall health",
        "Foods rich in antioxidants for lung health",
        "Omega-3 fatty acids for heart health"
      ]
    },
    trends: [],
    redFlags: [
      "Seek immediate care if chest pain, shortness of breath, or cough develops"
    ],
    nextSteps: [
      "No follow-up needed for this X-ray",
      "Continue routine health screenings",
      "Report any respiratory symptoms to doctor"
    ],
    confidence: 90
  };
}

function generateCBCAnalysis(dateStr: string) {
  // Similar to blood analysis but more comprehensive
  return generateBloodAnalysis(dateStr);
}
