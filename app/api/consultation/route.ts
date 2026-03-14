import { NextResponse } from "next/server";
import kb from "@/data/ayush_bilingual_dataset.json";

type Lang = "en" | "hi" | "mr";
type ConsultationStage =
  | "intro"
  | "language"
  | "feeling"
  | "symptoms"
  | "duration"
  | "age"
  | "remedy"
  | "advice";

export interface ConsultationRequest {
  stage: ConsultationStage;
  userInput: string;
  language?: Lang;
  conversationContext?: {
    symptoms?: string;
    duration?: string;
    age?: string;
    remedy?: unknown;
    remedies?: KbItem[];
  };
}

type KbItem = (typeof kb)[number];

const AMBIGUOUS_WORDS = new Set([
  "common", "low", "bad", "poor", "loss", "water", "eye", "dry", "heat",
  "leg", "neck", "memory", "postpartum", "tension", "menstrual",
]);

/** Localize dosage so Hindi/Marathi conversations never show English phrases */
function localizeDosage(dosageEn: string, lang: Lang): string {
  if (lang === "en") return dosageEn;
  const enToHi: [RegExp, string][] = [
    [/\btwice daily\b/gi, "दिन में दो बार"],
    [/\bafter meals\b/gi, "भोजन के बाद"],
    [/\bbefore meals\b/gi, "भोजन से पहले"],
    [/\bat night\b/gi, "रात को"],
    [/\bwith honey\b/gi, "शहद के साथ"],
    [/\bwith water\b/gi, "पानी के साथ"],
    [/\bwith milk\b/gi, "दूध के साथ"],
    [/\bwith warm water\b/gi, "गुनगुने पानी के साथ"],
    [/\bdaily\b/gi, "रोज़"],
  ];
  const enToMr: [RegExp, string][] = [
    [/\btwice daily\b/gi, "दिवसातून दोन वेळा"],
    [/\bafter meals\b/gi, "जेवणानंतर"],
    [/\bbefore meals\b/gi, "जेवणापूर्वी"],
    [/\bat night\b/gi, "रात्री"],
    [/\bwith honey\b/gi, "मधासह"],
    [/\bwith water\b/gi, "पाण्यात"],
    [/\bwith milk\b/gi, "दुधात"],
    [/\bwith warm water\b/gi, "उबदार पाण्यात"],
    [/\bdaily\b/gi, "दररोज"],
  ];
  let out = dosageEn;
  const map = lang === "hi" ? enToHi : enToMr;
  for (const [re, replacement] of map) out = out.replace(re, replacement);
  return out;
}

/** Aliases so "hairfall", "hair loss" etc. match KB entries */
const SYMPTOM_ALIASES: Record<string, string> = {
  hairfall: "hair fall",
  "hair fall": "hair fall",
  "hair loss": "hair fall",
  cold: "common cold",
};

function searchRemedy(symptomText: string, _lang: Lang = "en"): KbItem | null {
  let normalized = symptomText.toLowerCase().trim().replace(/\s+/g, " ");
  normalized = SYMPTOM_ALIASES[normalized] ?? normalized;
  if (!normalized) return null;
  const terms = normalized.split(/\s+/).filter((t) => t.length >= 2);
  const items = kb as KbItem[];

  for (const item of items) {
    const diseaseEn = (item.disease?.en ?? "").toLowerCase().trim();
    const diseaseHi = (item.disease?.hi ?? "").trim();
    const diseaseMr = (item.disease?.mr ?? "").trim();
    if (!diseaseEn && !diseaseHi && !diseaseMr) continue;
    if (normalized === diseaseEn || normalized === diseaseHi || normalized === diseaseMr) return item;
    if (normalized.includes(diseaseEn) || (diseaseHi && normalized.includes(diseaseHi)) || (diseaseMr && normalized.includes(diseaseMr))) return item;
    const singleTerm = terms.length === 1 ? terms[0] : "";
    if (singleTerm && !AMBIGUOUS_WORDS.has(singleTerm) &&
        (diseaseEn === singleTerm || diseaseEn.includes(singleTerm) || (diseaseHi && diseaseHi.includes(singleTerm)) || (diseaseMr && diseaseMr.includes(singleTerm)))) return item;
    if (terms.length >= 2 && diseaseEn.split(/\s+/).every((w) => normalized.includes(w))) return item;
  }
  return null;
}

/** Search for multiple symptoms; returns unique remedies (e.g. "fever and hair fall" -> [fever remedy, hair fall remedy]). */
function searchRemediesForPhrase(symptomPhrase: string, lang: Lang): KbItem[] {
  const normalized = symptomPhrase.toLowerCase().trim();
  const seenIds = new Set<number>();
  const results: KbItem[] = [];
  const parts = normalized.split(/\s+and\s+|\s*,\s*|\s+या\s+|\s+और\s+|\s+आणि\s+/).map((p) => p.trim()).filter(Boolean);
  const toTry = parts.length > 1 ? parts : [normalized];
  for (const part of toTry) {
    const r = searchRemedy(part, lang);
    if (r && !seenIds.has(r.id)) {
      seenIds.add(r.id);
      results.push(r);
    }
  }
  if (results.length > 0) return results;
  const single = searchRemedy(normalized, lang);
  if (single) return [single];
  return [];
}

/** Detect user's language choice from their reply to "Which language do you prefer?" */
function parseLanguageChoice(userInput: string): Lang {
  const t = userInput.toLowerCase().trim();
  if (/^(english|en|इंग्लिश|इंग्रजी)$/.test(t) || /\benglish\b/.test(t)) return "en";
  if (/^(marathi|mr|मराठी|मराठी)$/.test(t) || /\bmarathi\b/.test(t)) return "mr";
  if (/^(hindi|hi|हिंदी|हिन्दी)$/.test(t) || /\bhindi\b/.test(t)) return "hi";
  if (/[\u0900-\u097F]/.test(t)) return "hi"; // Devanagari default to Hindi if unclear
  return "en";
}

const LANG_STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    feelingQuestion: "How are you feeling today?",
    feelingFine: "Glad to hear that. Is there anything you would like help with today?",
    askSymptoms: "Okay, please tell me what symptoms you are experiencing.",
    noMatch: "I could not find a specific remedy for that. Could you describe your symptoms in more detail? (e.g. fever, cough, headache)",
    thankYouAge: "Thank you. What is your age?",
    doctorAdvice: "If symptoms do not improve within 1-2 days, please consult a doctor. Would you like to consult a doctor now or later?",
    improvementExpected: "Improvement expected in 1-2 days. If symptoms persist, consult a doctor.",
  },
  hi: {
    feelingQuestion: "आज आप कैसे महसूस कर रहे हैं?",
    feelingFine: "बढ़िया। क्या आज आपको किसी चीज़ में मदद चाहिए?",
    askSymptoms: "कृपया बताएं आपको क्या लक्षण हैं।",
    noMatch: "मुझे उस लक्षण के लिए कोई उपाय नहीं मिला। कृपया और विवरण दें (जैसे बुखार, खांसी)।",
    thankYouAge: "धन्यवाद। आपकी उम्र कितनी है?",
    doctorAdvice: "१-२ दिन में सुधार न हो तो डॉक्टर से मिलें। क्या आप अभी या बाद में डॉक्टर से मिलना चाहेंगे?",
    improvementExpected: "१-२ दिन में सुधार अपेक्षित। लक्षण बने रहें तो डॉक्टर से मिलें।",
  },
  mr: {
    feelingQuestion: "आज तुम्हाला कसे वाटत आहे?",
    feelingFine: "छान. आज तुम्हाला कशात मदद हवी आहे?",
    askSymptoms: "कृपया सांगा तुम्हाला काय लक्षण आहेत.",
    noMatch: "मला त्या लक्षणासाठी उपाय सापडला नाही. कृपया अधिक तपशील द्या (उदा. ताप, खोकला, केस गळणे).",
    thankYouAge: "धन्यवाद. तुमचे वय किती आहे?",
    doctorAdvice: "१-२ दिवसांत सुधारणा न झाल्यास डॉक्टरांना भेटा. आता भेटू इच्छिता की नंतर?",
    improvementExpected: "१-२ दिवसांत सुधारणा अपेक्षित. लक्षणे कायम राहिल्यास डॉक्टरांना भेटा.",
  },
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ConsultationRequest;
    const { stage, userInput, language: langParam, conversationContext = {} } = body;
    // Use explicit preferred language from frontend (set after user chooses); no auto-detect mixing
    const lang: Lang = langParam ?? "en";
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    async function callGemini(prompt: string): Promise<string> {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        console.error("Gemini error:", err);
        return "";
      }
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    }

    // Stage: Language preference (after intro)
    if (stage === "language") {
      const preferred = parseLanguageChoice(userInput);
      const strings = LANG_STRINGS[preferred];
      const response = strings.feelingQuestion;
      return NextResponse.json({
        response,
        nextStage: "feeling" as ConsultationStage,
        preferredLanguage: preferred,
      });
    }

    // Stage – Feeling: "How are you feeling today?" → fine vs unwell
    if (stage === "feeling") {
      const classifyPrompt = `You are a health assistant. The user was asked "How are you feeling today?" and they said: "${userInput}"

Reply with ONLY one word:
- "FINE" if they said they are fine, good, okay, or have no problems.
- "UNWELL" if they said they feel bad, sick, or described any symptom (e.g. fever, cough, pain).
- "SYMPTOM" if they directly described a symptom or condition (e.g. "I have fever", "headache").`;
      const classification = (await callGemini(classifyPrompt)).toUpperCase().trim();
      const strings = LANG_STRINGS[lang];

      if (classification === "FINE") {
        return NextResponse.json({ response: strings.feelingFine, nextStage: "feeling" as ConsultationStage });
      }

      if (classification === "SYMPTOM" || classification === "UNWELL") {
        const extractPrompt = `From this health complaint, list ALL symptoms or conditions as comma-separated lowercase phrases (e.g. fever, hair fall, cold). Include every condition mentioned: "${userInput}". Reply ONLY with the list, nothing else.`;
        const extractedList = (await callGemini(extractPrompt))?.toLowerCase().trim() || "";
        const phrases = extractedList.split(/[,;]/).map((p) => p.trim()).filter((p) => p.length > 1);
        const searchPhrases = phrases.length > 0 ? phrases : [userInput.trim()];
        const remedies: KbItem[] = [];
        const seenIds = new Set<number>();
        for (const p of searchPhrases) {
          const r = searchRemedy(p, lang);
          if (r && !seenIds.has(r.id)) {
            seenIds.add(r.id);
            remedies.push(r);
          }
        }
        if (remedies.length === 0) {
          const fallback = searchRemediesForPhrase(userInput.trim(), lang);
          for (const r of fallback) {
            if (!seenIds.has(r.id)) {
              seenIds.add(r.id);
              remedies.push(r);
            }
          }
        }
        if (remedies.length > 0) {
          const langKey = lang === "hi" ? "hi" : lang === "mr" ? "mr" : "en";
          const durationQuestion = lang === "en" ? "How long have you had these symptoms?" : lang === "hi" ? "लक्षण कितने दिन से हैं?" : "या लक्षणांना किती दिवस झाले?";
          const parts: string[] = [];
          for (const remedy of remedies) {
            const remedyText = (remedy.remedy as Record<string, string>)?.[langKey] ?? (remedy.remedy as { en?: string }).en;
            const rawDosage = (remedy.dosage as Record<string, string>)?.[langKey] ?? (remedy.dosage as { en?: string }).en;
            const dosageText = localizeDosage(rawDosage ?? "", lang);
            const diseaseText = (remedy.disease as Record<string, string>)?.[langKey] ?? (remedy.disease as { en?: string }).en;
            if (lang === "en") parts.push(`${diseaseText}: ${remedyText}. Dosage: ${dosageText}.`);
            else parts.push(`${diseaseText}: ${remedyText}. मात्रा: ${dosageText}.`);
          }
          const response = `${parts.join(" ")} ${durationQuestion}`;
          return NextResponse.json({
            response,
            remedy: remedies[0],
            remedies,
            nextStage: "duration" as ConsultationStage,
          });
        }
      }

      return NextResponse.json({ response: strings.askSymptoms, nextStage: "symptoms" as ConsultationStage });
    }

    // Stage – Symptoms: collect symptom(s), search KB (multi-symptom supported)
    if (stage === "symptoms") {
      const extractPrompt = `From this health complaint, list ALL symptoms or conditions as comma-separated lowercase phrases (e.g. fever, hair fall, cold): "${userInput}". Reply ONLY with the list.`;
      const extractedList = (await callGemini(extractPrompt))?.toLowerCase().trim() || "";
      const phrases = extractedList.split(/[,;]/).map((p) => p.trim()).filter((p) => p.length > 1);
      const searchPhrases = phrases.length > 0 ? phrases : [userInput.trim()];
      const remedies: KbItem[] = [];
      const seenIds = new Set<number>();
      for (const p of searchPhrases) {
        const r = searchRemedy(p, lang);
        if (r && !seenIds.has(r.id)) {
          seenIds.add(r.id);
          remedies.push(r);
        }
      }
      if (remedies.length === 0) {
        const fallback = searchRemediesForPhrase(userInput.trim(), lang);
        for (const r of fallback) {
          if (!seenIds.has(r.id)) {
            seenIds.add(r.id);
            remedies.push(r);
          }
        }
      }
      const strings = LANG_STRINGS[lang];
      if (remedies.length > 0) {
        const langKey = lang === "hi" ? "hi" : lang === "mr" ? "mr" : "en";
        const durationQuestion = lang === "en" ? "How long have you had these symptoms?" : lang === "hi" ? "लक्षण कितने दिन से हैं?" : "या लक्षणांना किती दिवस झाले?";
        const parts: string[] = [];
        for (const remedy of remedies) {
          const remedyText = (remedy.remedy as Record<string, string>)?.[langKey] ?? (remedy.remedy as { en?: string }).en;
          const rawDosage = (remedy.dosage as Record<string, string>)?.[langKey] ?? (remedy.dosage as { en?: string }).en;
          const dosageText = localizeDosage(rawDosage ?? "", lang);
          const diseaseText = (remedy.disease as Record<string, string>)?.[langKey] ?? (remedy.disease as { en?: string }).en;
          if (lang === "en") parts.push(`${diseaseText}: ${remedyText}. Dosage: ${dosageText}.`);
          else parts.push(`${diseaseText}: ${remedyText}. मात्रा: ${dosageText}.`);
        }
        const response = `${parts.join(" ")} ${durationQuestion}`;
        return NextResponse.json({ response, remedy: remedies[0], remedies, nextStage: "duration" as ConsultationStage });
      }
      return NextResponse.json({ response: strings.noMatch, nextStage: "symptoms" as ConsultationStage });
    }

    // Stage – Duration: acknowledge, ask age
    if (stage === "duration") {
      const response = LANG_STRINGS[lang].thankYouAge;
      return NextResponse.json({ response, nextStage: "age" as ConsultationStage });
    }

    // Stage – Age: give full remedy/remedies from context (all in chosen language, no English mixing)
    if (stage === "age") {
      const remedies = (conversationContext?.remedies as KbItem[] | undefined) ?? (conversationContext?.remedy ? [conversationContext.remedy as KbItem] : []);
      const strings = LANG_STRINGS[lang];
      const langKey = lang === "hi" ? "hi" : lang === "mr" ? "mr" : "en";
      if (remedies.length > 0) {
        const parts: string[] = [];
        for (const remedy of remedies) {
          const remedyText = (remedy.remedy as Record<string, string>)?.[langKey] ?? (remedy.remedy as { en?: string }).en;
          const rawDosage = (remedy.dosage as Record<string, string>)?.[langKey] ?? (remedy.dosage as { en?: string }).en;
          const dosageText = localizeDosage(rawDosage ?? "", lang);
          if (lang === "en") parts.push(`${remedyText}. Dosage: ${dosageText}. Dosha: ${remedy.dosha}.`);
          else parts.push(`${remedyText}. मात्रा: ${dosageText}. दोष: ${remedy.dosha}.`);
        }
        const response = `${parts.join(" ")} ${strings.improvementExpected}`;
        return NextResponse.json({ response, nextStage: "advice" as ConsultationStage });
      }
      return NextResponse.json({ response: strings.doctorAdvice, nextStage: "advice" as ConsultationStage });
    }

    // Stage – Advice
    if (stage === "advice") {
      const response = LANG_STRINGS[lang].doctorAdvice;
      return NextResponse.json({ response, nextStage: "advice" as ConsultationStage });
    }

    // Default / intro: ask language preference (frontend shows intro then sends stage "language" on first user reply)
    const response = "Which language do you prefer: English, Hindi, or Marathi? (बोलें: English, Hindi, या Marathi)";
    return NextResponse.json({ response, nextStage: "language" as ConsultationStage });
  } catch (error) {
    console.error("Consultation error:", error);
    return NextResponse.json({ error: "Consultation failed" }, { status: 500 });
  }
}
