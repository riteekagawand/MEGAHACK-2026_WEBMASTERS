import { NextResponse } from "next/server";
import kb from "@/data/ayush_bilingual_dataset.json";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { connectDB } from "@/lib/mongodb";
import Doctor from "@/lib/models/Doctor";
import {
  addAIMessage,
  addUserMessage,
  getConversationSession,
  getMessagesForAPI,
} from "@/lib/langchain-utils";

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
  sessionId?: string;
  conversationContext?: {
    symptoms?: string;
    duration?: string;
    age?: string;
    remedy?: unknown;
    remedies?: KbItem[];
  };
}

type KbItem = (typeof kb)[number];
type DoctorLite = {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  yearsOfExperience: number;
};

const KB_DISEASES_EN = Array.from(
  new Set(
    (kb as KbItem[])
      .map((i) => (i.disease?.en ?? "").toLowerCase().trim())
      .filter(Boolean)
  )
).sort();

const AMBIGUOUS_WORDS = new Set([
  "common", "low", "bad", "poor", "loss", "water", "eye", "dry", "heat",
  "leg", "neck", "memory", "postpartum", "tension", "menstrual",
]);

function isCannotTakeIntent(text: string): boolean {
  const t = text.toLowerCase();
  // English intents
  if (/(can't|cannot)\s*(take|drink|eat)/i.test(t)) return true;
  if (/(allergic|allergy|side effect|intolerant|nausea|vomit|stop taking)/i.test(t)) return true;
  if (/(बर्दाश्त|एलर्जी|उल्टी|नहीं\s*ले)\b/.test(text)) return true;
  if (/(घेऊ शकत|नाही\s*घेऊ|अॅलर्जी|दुष्परिणाम|उलटी|थांबवा)/i.test(text)) return true;
  return false;
}

function detectConsultIntent(text: string): "now" | "later" | null {
  const t = text.toLowerCase();
  if (/\b(now|right now|immediately|book now|consult now)\b/.test(t)) return "now";
  if (/\b(later|after|not now|maybe later)\b/.test(t)) return "later";
  if (/(अभी|अबhi|अब|तुरंत|अत्ता|आताच)/i.test(text)) return "now";
  if (/(बाद में|नंतर|पुढे|नंतर करेन|कधी तरी नंतर)/i.test(text)) return "later";
  return null;
}

function isDoctorListRequest(text: string): boolean {
  const t = text.toLowerCase();
  if (/\b(doctor|doctors|physician|specialist)\b/.test(t)) return true;
  if (/(डॉक्टर|doctor)/i.test(text)) return true;
  return false;
}

function parseAgeYears(input: string): number | null {
  const m = input.match(/\d{1,3}/);
  if (!m) return null;
  const age = Number(m[0]);
  if (Number.isNaN(age) || age <= 0 || age > 120) return null;
  return age;
}

function getAgeNote(lang: Lang, age: number | null): string {
  if (age == null) {
    return lang === "en"
      ? "If this is for a child or elderly patient, consult a doctor before starting medicine."
      : lang === "hi"
        ? "यदि यह बच्चा या बुजुर्ग रोगी है, दवा शुरू करने से पहले डॉक्टर से सलाह लें।"
        : "हा रुग्ण लहान मूल किंवा ज्येष्ठ असेल तर औषध सुरू करण्यापूर्वी डॉक्टरांचा सल्ला घ्या.";
  }
  if (age < 5) {
    return lang === "en"
      ? "Age note: under 5 years, do not self-medicate; consult a pediatrician urgently."
      : lang === "hi"
        ? "उम्र नोट: 5 वर्ष से कम आयु में स्वयं दवा न दें; तुरंत बाल रोग विशेषज्ञ से सलाह लें।"
        : "वय नोंद: 5 वर्षांखालील मुलांसाठी स्वतःहून औषध देऊ नका; त्वरित बालरोगतज्ज्ञांचा सल्ला घ्या.";
  }
  if (age < 12) {
    return lang === "en"
      ? "Age note: for 5-12 years, use pediatric dosage only after doctor confirmation."
      : lang === "hi"
        ? "उम्र नोट: 5-12 वर्ष में बाल-डोज़ केवल डॉक्टर की पुष्टि के बाद लें।"
        : "वय नोंद: 5-12 वर्षांसाठी बाल-डोस फक्त डॉक्टरांच्या पुष्टीनेच घ्या.";
  }
  if (age >= 60) {
    return lang === "en"
      ? "Age note: for 60+ years, start cautiously and consult a doctor if any discomfort appears."
      : lang === "hi"
        ? "उम्र नोट: 60+ आयु में सावधानी से शुरू करें; कोई असुविधा हो तो डॉक्टर से मिलें।"
        : "वय नोंद: 60+ वयोगटात सावधपणे सुरू करा; अस्वस्थता वाटल्यास डॉक्टरांना भेटा.";
  }
  return lang === "en"
    ? `Age note: for age ${age}, standard adult dosage can be followed unless contraindicated.`
    : lang === "hi"
      ? `उम्र नोट: ${age} वर्ष में सामान्य वयस्क डोज़ लिया जा सकता है (यदि कोई बाधा न हो)।`
      : `वय नोंद: ${age} वर्षांसाठी सामान्य प्रौढ डोस वापरता येतो (अडचण नसल्यास).`;
}

function cleanDoctorName(name: string): string {
  return name.replace(/^[^a-zA-Z]+/, "").replace(/^\d+[\.\-\s]*/, "").trim();
}

function remediesFromContainsMatch(text: string, lang: Lang): KbItem[] {
  const normalized = text.toLowerCase();
  const seen = new Set<number>();
  const results: KbItem[] = [];
  const items = kb as KbItem[];
  for (const item of items) {
    const diseaseEn = (item.disease?.en ?? "").toLowerCase().trim();
    const diseaseHi = (item.disease?.hi ?? "").trim();
    const diseaseMr = (item.disease?.mr ?? "").trim();
    if (!diseaseEn && !diseaseHi && !diseaseMr) continue;
    if (
      (diseaseEn && normalized.includes(diseaseEn)) ||
      (diseaseHi && text.includes(diseaseHi)) ||
      (diseaseMr && text.includes(diseaseMr))
    ) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        results.push(item);
      }
    }
  }
  return results.slice(0, 3);
}

async function mapToKbDiseasesViaLLM(callGemini: (p: string) => Promise<string>, userText: string): Promise<string[]> {
  // Ask the LLM to map free-text to our canonical KB disease keywords.
  // Return up to 3 disease keywords (English canonical) OR "NONE".
  const prompt = `You are mapping a user's symptom text to a fixed list of canonical disease keywords.

User text: "${userText}"

Canonical keywords (English, choose ONLY from this list):
${KB_DISEASES_EN.join(", ")}

Rules:
- Reply with a comma-separated list of up to 3 keywords from the list that best match the user's text.
- If there is no reasonable match, reply with EXACTLY: NONE
- Do not add any extra words.`;

  const raw = (await callGemini(prompt)).trim();
  if (!raw || raw.toUpperCase() === "NONE") return [];
  return raw
    .split(/[,;]/)
    .map((s) => s.toLowerCase().trim())
    .filter(Boolean)
    .filter((k) => KB_DISEASES_EN.includes(k))
    .slice(0, 3);
}

function inferSpecializationHints(symptoms: string): string[] {
  const t = symptoms.toLowerCase();
  const hints = new Set<string>();
  if (/(fever|cold|cough|infection|flu|viral|बुखार|ताप|खांसी|खोकला)/i.test(t)) hints.add("general");
  if (/(headache|migraine|stress|anxiety|insomnia|सिर|डोके|चिंता|झोप)/i.test(t)) hints.add("neurology");
  if (/(skin|allergy|rash|acne|त्वचा|चर्म|अॅलर्जी)/i.test(t)) hints.add("dermatology");
  if (/(stomach|acidity|digestion|gas|constipation|पेट|अपचन|अम्लता|गॅस)/i.test(t)) hints.add("gastro");
  if (/(hair|hair fall|बाल|केस)/i.test(t)) hints.add("dermatology");
  return [...hints];
}

async function getRecommendedDoctors(symptoms: string): Promise<DoctorLite[]> {
  await connectDB();
  const hints = inferSpecializationHints(symptoms);
  const doctors = await Doctor.find({ isActive: true })
    .select("name specialization rating yearsOfExperience totalConsultations")
    .sort({ rating: -1, totalConsultations: -1, yearsOfExperience: -1 })
    .limit(12)
    .lean();

  const scored = doctors.map((d: any) => {
    const spec = String(d.specialization || "").toLowerCase();
    let score = Number(d.rating || 0) * 10 + Number(d.yearsOfExperience || 0);
    for (const h of hints) {
      if (spec.includes(h)) score += 25;
    }
    if (spec.includes("general")) score += 8;
    return {
      id: String(d._id),
      name: String(d.name || "Doctor"),
      specialization: String(d.specialization || "General"),
      rating: Number(d.rating || 0),
      yearsOfExperience: Number(d.yearsOfExperience || 0),
      score,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ id, name, specialization, rating, yearsOfExperience }) => ({
      id,
      name,
      specialization,
      rating,
      yearsOfExperience,
    }));
}

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
    doctorAdvice: "If symptoms do not improve within 1–2 days, please consult a doctor. Would you like to consult a doctor now or later?",
    improvementExpected: "Improvement is expected in 1–2 days. If symptoms persist, consult a doctor.",
  },
  hi: {
    feelingQuestion: "आज आप कैसे महसूस कर रहे हैं?",
    feelingFine: "बढ़िया। क्या आज आपको किसी चीज़ में मदद चाहिए?",
    askSymptoms: "कृपया बताएं आपको क्या लक्षण हैं।",
    noMatch: "मुझे उस लक्षण के लिए कोई उपाय नहीं मिला। कृपया और विवरण दें (जैसे बुखार, खांसी)।",
    thankYouAge: "धन्यवाद। आपकी उम्र कितनी है?",
    doctorAdvice: "एक से दो दिन में सुधार न हो तो डॉक्टर से मिलें। क्या आप अभी डॉक्टर से मिलना चाहेंगे या बाद में?",
    improvementExpected: "एक से दो दिन में सुधार अपेक्षित है। लक्षण बने रहें तो डॉक्टर से मिलें।",
  },
  mr: {
    feelingQuestion: "आज तुम्हाला कसे वाटत आहे?",
    feelingFine: "छान. आज तुम्हाला कशात मदद हवी आहे?",
    askSymptoms: "कृपया सांगा तुम्हाला काय लक्षण आहेत.",
    noMatch: "मला त्या लक्षणासाठी उपाय सापडला नाही. कृपया अधिक तपशील द्या (उदा. ताप, खोकला, केस गळणे).",
    thankYouAge: "धन्यवाद. तुमचे वय किती आहे?",
    doctorAdvice: "१–२ दिवसांत सुधारणा न झाल्यास डॉक्टरांना भेटा. आता भेटू इच्छिता की नंतर?",
    improvementExpected: "१–२ दिवसांत सुधारणा अपेक्षित आहे. लक्षणे कायम राहिल्यास डॉक्टरांना भेटा.",
  },
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ConsultationRequest;
    const { stage, userInput, language: langParam, conversationContext = {}, sessionId } = body;
    // Use explicit preferred language from frontend (set after user chooses); no auto-detect mixing
    const lang: Lang = langParam ?? "en";
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    async function callGemini(prompt: string): Promise<string> {
      try {
        const llm = new ChatGoogleGenerativeAI({
          apiKey: geminiKey,
          model: "gemini-2.5-flash",
          temperature: 0.3,
        });
        const history = sessionId ? getMessagesForAPI(sessionId) : [];
        const result = await llm.invoke([...history, new HumanMessage(prompt)]);
        const content = (result as { content?: unknown }).content;
        if (typeof content === "string") return content.trim();
        return content ? String(content).trim() : "";
      } catch (err) {
        // Prevent 429/quota/LMM failures from breaking the conversation flow.
        // Returning empty string lets stage-specific fallbacks proceed safely.
        return "";
      }
    }

    // Stage: Language preference (after intro)
    if (stage === "language") {
      const preferred = parseLanguageChoice(userInput);
      const strings = LANG_STRINGS[preferred];
      const response = strings.feelingQuestion;
      if (sessionId) {
        getConversationSession(sessionId, preferred);
        addUserMessage(sessionId, userInput);
        addAIMessage(sessionId, response);
      }
      return NextResponse.json({
        response,
        nextStage: "feeling" as ConsultationStage,
        preferredLanguage: preferred,
      });
    }

    // Conversational override: user cannot take it / side effects
    if (isCannotTakeIntent(userInput)) {
      if (sessionId) {
        getConversationSession(sessionId, lang);
        addUserMessage(sessionId, userInput);
      }

      const strings = LANG_STRINGS[lang];
      const langInstruction =
        lang === "en"
          ? "Respond ONLY in English."
          : lang === "hi"
            ? "Respond ONLY in Hindi. Do not use Marathi."
            : "Respond ONLY in Marathi. Do not use Hindi.";

      const prompt = `You are an empathetic AYUSH health assistant. ${langInstruction}

User preferred language: ${lang}
User said: "${userInput}"

They cannot take the suggested remedy / have side effects or allergy.
Respond with:
- Advise them to stop and consult a doctor.
- Ask a single question: do they have any allergy/side effects or are they currently taking any medicines?
- Keep it short, friendly, and only in the chosen language.`;

      const aiText = await callGemini(prompt);
      const response = aiText || strings.doctorAdvice;
      if (sessionId) addAIMessage(sessionId, response);
      return NextResponse.json({ response, nextStage: "advice" as ConsultationStage });
    }

    // Stage – Feeling: "How are you feeling today?" → fine vs unwell
    if (stage === "feeling") {
      if (sessionId) {
        getConversationSession(sessionId, lang);
        addUserMessage(sessionId, userInput);
      }
      const classifyPrompt = `You are a health assistant. The user was asked "How are you feeling today?" and they said: "${userInput}"

Reply with ONLY one word:
- "FINE" if they said they are fine, good, okay, or have no problems.
- "UNWELL" if they said they feel bad, sick, or described any symptom (e.g. fever, cough, pain).
- "SYMPTOM" if they directly described a symptom or condition (e.g. "I have fever", "headache").`;
      const classification = (await callGemini(classifyPrompt)).toUpperCase().trim();
      const strings = LANG_STRINGS[lang];

      if (classification === "FINE") {
        const response = strings.feelingFine;
        if (sessionId) addAIMessage(sessionId, response);
        return NextResponse.json({ response, nextStage: "feeling" as ConsultationStage });
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
        if (remedies.length === 0) {
          const containsMatch = remediesFromContainsMatch(userInput, lang);
          for (const r of containsMatch) {
            if (!seenIds.has(r.id)) {
              seenIds.add(r.id);
              remedies.push(r);
            }
          }
        }
        if (remedies.length === 0) {
          const mapped = await mapToKbDiseasesViaLLM(callGemini, userInput);
          for (const k of mapped) {
            const r = searchRemedy(k, lang);
            if (r && !seenIds.has(r.id)) {
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
          if (sessionId) addAIMessage(sessionId, response);
          return NextResponse.json({
            response,
            remedy: remedies[0],
            remedies,
            nextStage: "duration" as ConsultationStage,
          });
        }
      }

      const response = strings.askSymptoms;
      if (sessionId) addAIMessage(sessionId, response);
      return NextResponse.json({ response, nextStage: "symptoms" as ConsultationStage });
    }

    // Stage – Symptoms: collect symptom(s), search KB (multi-symptom supported)
    if (stage === "symptoms") {
      if (sessionId) {
        getConversationSession(sessionId, lang);
        addUserMessage(sessionId, userInput);
      }
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
      if (remedies.length === 0) {
        const containsMatch = remediesFromContainsMatch(userInput, lang);
        for (const r of containsMatch) {
          if (!seenIds.has(r.id)) {
            seenIds.add(r.id);
            remedies.push(r);
          }
        }
      }
      if (remedies.length === 0) {
        const mapped = await mapToKbDiseasesViaLLM(callGemini, userInput);
        for (const k of mapped) {
          const r = searchRemedy(k, lang);
          if (r && !seenIds.has(r.id)) {
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
        if (sessionId) addAIMessage(sessionId, response);
        return NextResponse.json({ response, remedy: remedies[0], remedies, nextStage: "duration" as ConsultationStage });
      }
      const response = strings.noMatch;
      if (sessionId) addAIMessage(sessionId, response);
      return NextResponse.json({ response, nextStage: "symptoms" as ConsultationStage });
    }

    // Stage – Duration: acknowledge, ask age
    if (stage === "duration") {
      if (sessionId) {
        getConversationSession(sessionId, lang);
        addUserMessage(sessionId, userInput);
      }
      const response = LANG_STRINGS[lang].thankYouAge;
      if (sessionId) addAIMessage(sessionId, response);
      return NextResponse.json({ response, nextStage: "age" as ConsultationStage });
    }

    // Stage – Age: give full remedy/remedies from context (all in chosen language, no English mixing)
    if (stage === "age") {
      if (sessionId) {
        getConversationSession(sessionId, lang);
        addUserMessage(sessionId, userInput);
      }
      const remedies = (conversationContext?.remedies as KbItem[] | undefined) ?? (conversationContext?.remedy ? [conversationContext.remedy as KbItem] : []);
      const strings = LANG_STRINGS[lang];
      const langKey = lang === "hi" ? "hi" : lang === "mr" ? "mr" : "en";
      const ageYears = parseAgeYears(userInput);
      if (remedies.length > 0) {
        // Don't repeat full remedy details again at age stage; keep it clean and age-aware.
        const response = `${getAgeNote(lang, ageYears)} ${strings.improvementExpected} ${strings.doctorAdvice}`;
        if (sessionId) addAIMessage(sessionId, response);
        return NextResponse.json({ response, nextStage: "advice" as ConsultationStage });
      }
      if (sessionId) addAIMessage(sessionId, strings.doctorAdvice);
      return NextResponse.json({ response: strings.doctorAdvice, nextStage: "advice" as ConsultationStage });
    }

    // Stage – Advice
    if (stage === "advice") {
      if (sessionId) {
        getConversationSession(sessionId, lang);
        addUserMessage(sessionId, userInput);
      }

      const strings = LANG_STRINGS[lang];
      const consultIntent = detectConsultIntent(userInput);
      const appointmentUrl = "/patient/appointments";

      if (consultIntent === "now" || isDoctorListRequest(userInput)) {
        const symptomText =
          (conversationContext?.symptoms as string | undefined) ??
          ((conversationContext?.remedies as KbItem[] | undefined)?.map((r) => r.disease?.en).filter(Boolean).join(", ") || "");
        const doctors = await getRecommendedDoctors(symptomText);
        const doctorLines = doctors
          .map(
            (d, i) =>
              `${i + 1}. Dr. ${cleanDoctorName(d.name)} - ${d.specialization} (${d.rating.toFixed(1)}★, ${d.yearsOfExperience} yrs experience)`
          )
          .join("\n");
        const responseRaw =
          lang === "en"
            ? `Based on your symptom profile, I recommend consulting a doctor now.\n\nRecommended doctors (ranked by rating, experience, and symptom fit):\n${doctorLines || "1. Top-rated General Physician"}\n\nProceed to booking: ${appointmentUrl}\n\nOpen the page, review the listed doctors, and click "Book Appointment" for your preferred doctor.`
            : lang === "hi"
              ? `आपके लक्षणों के आधार पर अभी डॉक्टर से परामर्श करना बेहतर रहेगा।\n\nअनुशंसित डॉक्टर (रेटिंग, अनुभव और लक्षण-मिलान के आधार पर):\n${doctorLines || "1. टॉप-रेटेड जनरल फिज़िशियन"}\n\nबुकिंग के लिए जाएं: ${appointmentUrl}\n\nपेज खोलें, डॉक्टर चुनें और "Book Appointment" पर क्लिक करें।`
              : `तुमच्या लक्षणांनुसार आत्ताच डॉक्टरांचा सल्ला घेणे योग्य ठरेल.\n\nशिफारस केलेले डॉक्टर (रेटिंग, अनुभव आणि लक्षण-जुळणीच्या आधारे):\n${doctorLines || "1. टॉप-रेटेड जनरल फिजिशियन"}\n\nबुकिंगसाठी जा: ${appointmentUrl}\n\nपेज उघडा, डॉक्टर निवडा आणि "Book Appointment" वर क्लिक करा.`;

        const response = responseRaw.replace(/\*/g, "");
        if (sessionId) addAIMessage(sessionId, response);
        return NextResponse.json({
          response,
          nextStage: "advice" as ConsultationStage,
          action: "consult_now",
          appointmentUrl,
          recommendedDoctors: doctors,
          endChat: true,
        });
      }

      if (consultIntent === "later") {
        const response =
          lang === "en"
            ? `No problem. If you want to consult later, open ${appointmentUrl} anytime.\n\nTake care, stay hydrated, and monitor your symptoms. Chat ended.`
            : lang === "hi"
              ? `कोई बात नहीं। बाद में परामर्श लेना हो तो कभी भी ${appointmentUrl} खोलें।\n\nअपना ध्यान रखें, पानी पिएं और लक्षण मॉनिटर करें। चैट समाप्त।`
              : `काही हरकत नाही. नंतर सल्ला घ्यायचा असल्यास कधीही ${appointmentUrl} उघडा.\n\nकाळजी घ्या, पाणी प्या आणि लक्षणे लक्षात ठेवा. चॅट समाप्त.`;
        if (sessionId) addAIMessage(sessionId, response);
        return NextResponse.json({
          response,
          nextStage: "advice" as ConsultationStage,
          action: "consult_later",
          appointmentUrl,
          endChat: true,
        });
      }

      const langInstruction =
        lang === "en"
          ? "Respond ONLY in English."
          : lang === "hi"
            ? "Respond ONLY in Hindi. Do not use Marathi."
            : "Respond ONLY in Marathi. Do not use Hindi.";

      const remedies = (conversationContext?.remedies as KbItem[] | undefined) ?? (conversationContext?.remedy ? [conversationContext.remedy as KbItem] : []);
      const langKey = lang === "hi" ? "hi" : lang === "mr" ? "mr" : "en";

      const remedySummary = remedies.length
        ? remedies
            .map((r) => {
              const remedyText =
                (r.remedy as Record<string, string>)?.[langKey] ??
                (r.remedy as { en?: string }).en ??
                "";
              const rawDosage =
                (r.dosage as Record<string, string>)?.[langKey] ??
                (r.dosage as { en?: string }).en ??
                "";
              const dosageText = localizeDosage(rawDosage, lang);
              const diseaseText =
                (r.disease as Record<string, string>)?.[langKey] ??
                (r.disease as { en?: string }).en ??
                "";
              return `${diseaseText}: ${remedyText}. मात्रा: ${dosageText}.`;
            })
            .join(" ")
        : "";

      const prompt = `You are an empathetic AYUSH health assistant. ${langInstruction}

User language: ${lang}
User just said: "${userInput}"
Previous suggested remedies (localized): ${remedySummary || "(none)"}

Respond helpfully and concisely:
1. If the user says they cannot take it / have difficulty / allergy / side effects, advise them to stop and consult a doctor.
2. If the user asks what to do next, answer with next steps and doctor advice.
3. If the user asks about continuing or changing the plan, reassure and suggest doctor consult.

Do NOT mix any other language. Keep it short.`;

      return (async () => {
        const aiText = await callGemini(prompt);
        const response = aiText || strings.doctorAdvice;
        if (sessionId) addAIMessage(sessionId, response);
        return NextResponse.json({ response, nextStage: "advice" as ConsultationStage });
      })();
    }

    // Default / intro: ask language preference (frontend shows intro then sends stage "language" on first user reply)
    const response = "Which language do you prefer: English, Hindi, or Marathi? (बोलें: English, Hindi, या Marathi)";
    return NextResponse.json({ response, nextStage: "language" as ConsultationStage });
  } catch (error) {
    console.error("Consultation error:", error);
    return NextResponse.json({ error: "Consultation failed" }, { status: 500 });
  }
}
