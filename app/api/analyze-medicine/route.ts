import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const { image, additionalInfo } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare the prompt
    const prompt = `You are a highly advanced pharmaceutical AI assistant. Analyze the medicine image provided and give comprehensive information about the medication.

${additionalInfo ? `Additional patient information: ${additionalInfo}` : ""}

Please analyze the medicine in the image and provide detailed information in the following JSON format:

{
  "medicineName": "Full name of the medicine",
  "activeIngredients": ["list", "of", "active", "ingredients"],
  "whatItHelps": ["condition1", "condition2", "what this medicine treats"],
  "severity": "Low" | "Medium" | "High" (based on potential risks and side effects),
  "doctorConsultationRequired": true | false (whether this medicine requires doctor prescription/consultation),
  "whenToTake": {
    "timing": ["morning", "evening", "specific times"],
    "withFood": "Before" | "After" | "With" | "Doesn't matter",
    "frequency": "how often to take (e.g., twice daily, once daily)"
  },
  "sideEffects": {
    "common": ["common side effects"],
    "serious": ["serious side effects that require immediate medical attention"],
    "patientSpecific": ["side effects specific to patient's mentioned conditions"]
  },
  "precautions": ["important precautions and warnings"],
  "interactions": ["drug interactions to be aware of"],
  "confidence": 85 (confidence level 0-100 in the analysis)
}

Important guidelines:
1. If you cannot clearly identify the medicine, indicate lower confidence
2. Consider the patient's additional information when providing patient-specific advice
3. Always err on the side of caution for safety recommendations
4. Provide practical, actionable information
5. Consider both generic and brand names if visible
6. Be specific about timing and dosage instructions
7. Include relevant warnings based on the medicine type

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

      // Validate required fields
      if (!analysis.medicineName) {
        throw new Error("Could not identify medicine name");
      }

      return NextResponse.json(analysis);
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.log("Raw response:", text);

      // Fallback response if JSON parsing fails
      return NextResponse.json({
        medicineName: "Medicine Analysis Available",
        activeIngredients: ["Analysis available in raw response"],
        whatItHelps: ["Please consult the detailed analysis"],
        severity: "Medium",
        doctorConsultationRequired: true,
        whenToTake: {
          timing: ["As prescribed"],
          withFood: "As directed",
          frequency: "As prescribed by doctor",
        },
        sideEffects: {
          common: ["Please refer to package insert"],
          serious: [
            "Consult doctor immediately if any adverse reactions occur",
          ],
          patientSpecific: ["Individual consultation recommended"],
        },
        precautions: [
          "Always consult healthcare provider",
          "Read package insert carefully",
        ],
        interactions: ["Discuss all medications with your doctor"],
        confidence: 50,
        rawAnalysis: text,
      });
    }
  } catch (error) {
    console.error("Error analyzing medicine:", error);

    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "API configuration error. Please check GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze medicine. Please try again." },
      { status: 500 }
    );
  }
}
