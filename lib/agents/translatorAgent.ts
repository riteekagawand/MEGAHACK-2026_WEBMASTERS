// lib/agents/translatorAgent.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export class TranslatorAgent {
  private model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "").getGenerativeModel(
    { model: "gemini-2.5-flash" }
  );

  async translateSymptoms(
    symptoms: string,
    language: string
  ): Promise<{
    translatedSymptoms: string;
    emergencyKeywords: string[];
    culturalContext: string;
  }> {
    if (!process.env.GEMINI_API_KEY) {
      // Fallback if key missing
      return {
        translatedSymptoms:
          language.toLowerCase() === "english" ? symptoms : `Translated from ${language}: ${symptoms}`,
        emergencyKeywords: this.detectEmergencyKeywords(symptoms),
        culturalContext: language.toLowerCase() !== "english" ? `Patient communicated in ${language}` : "",
      };
    }

    const systemPrompt = `You are Bhasha, an expert medical translator specializing in Indian languages and medical terminology.

TASK: Translate patient symptoms from ${language} to precise medical English while preserving clinical context.

CAPABILITIES:
- Expert in 10+ Indian languages: Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Punjabi, Urdu
- Medical terminology preservation
- Emergency keyword detection
- Cultural medical expression understanding
- Regional dialect recognition

EMERGENCY KEYWORDS TO DETECT:
- Chest pain: छाती में दर्द, நெஞ்சு வலி, గుండె నొప్పి
- Breathing difficulty: सांस लेने में तकलीफ, மூச்சு திணறல், శ్వాస కష్టం
- Severe headache: तेज़ सिर दर्द, கடுமையான தலைவலி, తీవ్రమైన తలనొప్పి
- Loss of consciousness: बेहोशी, மயக்கம், స్పృహ కోల్పోవడం
- High fever: तेज़ बुखार, அதிக காய்ச்சல், అధिक ज्वరం

CULTURAL CONTEXT:
- Traditional medicine references (Ayurveda, Unani, Siddha)
- Regional disease patterns
- Local symptom descriptions
- Family medicine practices

Return ONLY valid JSON:
{
  "translatedSymptoms": "precise medical English translation",
  "emergencyKeywords": ["detected emergency terms"],
  "culturalContext": "relevant cultural medical context"
}`;

    const userPrompt = `Patient symptoms in ${language}: "${symptoms}"

Analyze and translate with medical precision. Detect any emergency indicators.`;

    try {
      const result = await this.model.generateContent([systemPrompt, userPrompt]);
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.translatedSymptoms && Array.isArray(parsed.emergencyKeywords)) {
          return {
            translatedSymptoms: parsed.translatedSymptoms,
            emergencyKeywords: parsed.emergencyKeywords || [],
            culturalContext: parsed.culturalContext || "",
          };
        }
      }
    } catch {
      // fall through to fallback
    }

    return {
      translatedSymptoms:
        language.toLowerCase() === "english" ? symptoms : `Translated from ${language}: ${symptoms}`,
      emergencyKeywords: this.detectEmergencyKeywords(symptoms),
      culturalContext: language.toLowerCase() !== "english" ? `Patient communicated in ${language}` : "",
    };
  }

  private detectEmergencyKeywords(symptoms: string): string[] {
    const emergencyTerms = [
      "chest pain",
      "छाती",
      "நெஞ்சு",
      "గుండె",
      "breathing",
      "सांस",
      "மூச்சு",
      "శ్వాస",
      "unconscious",
      "बेहोश",
      "மயக்கம்",
      "స్పృహ",
      "severe",
      "तेज़",
      "கடுமையான",
      "తీవ్రమైన",
    ];

    return emergencyTerms.filter((term) =>
      symptoms.toLowerCase().includes(term.toLowerCase())
    );
  }
}