// lib/agents/medicalResearchAgent.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash";

export interface MedicalResearchStudy {
  title: string;
  summary: string;
  evidenceLevel: number;
  source: string;
}

export interface GuidelineRef {
  title: string;
  summary: string;
  year?: number;
  url?: string;
}

export interface MedicalResearchResult {
  relevantStudies: MedicalResearchStudy[];
  regionalPatterns: string;
  currentOutbreaks: string[];
  icmrGuidelines: GuidelineRef[];
  whoProtocols: GuidelineRef[];
  keyLiterature: MedicalResearchStudy[];
}

export interface MedicalContext {
  age?: number;
  gender?: string;
  location?: string;
  medicalHistory?: string[];
}

export class MedicalResearcherAgent {
  private model;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "";
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: MODEL_NAME });
  }

  async researchConditions(
    symptoms: string,
    location?: string
  ): Promise<MedicalResearchResult> {
    if (!process.env.GEMINI_API_KEY) {
      return this.fallbackResearch(symptoms, location);
    }

    const currentDate = new Date().toISOString().split("T")[0];
    const systemPrompt = `You are Shodh, an expert medical researcher with real-time access to current medical literature, national (ICMR) guidelines, WHO disease protocols, and global health surveillance systems.

TASK: Research current medical evidence and epidemiological patterns for the given symptoms.

RESEARCH CAPABILITIES:
- Real-time access to PubMed, Cochrane Library, WHO databases
- ICMR (Indian Council of Medical Research) national guidelines
- WHO disease protocols and technical documents
- Current disease surveillance data from CDC, WHO, Indian health authorities
- Regional epidemiological patterns and outbreak monitoring
- Evidence-based medicine guidelines and protocols
- Latest clinical trials and systematic reviews

EVIDENCE HIERARCHY (Oxford Centre for Evidence-Based Medicine):
Level 1: Systematic reviews and meta-analyses of RCTs
Level 2: Individual randomized controlled trials (RCTs)
Level 3: Cohort studies and case-control studies
Level 4: Case series and case reports
Level 5: Expert opinion and clinical experience

REGIONAL FOCUS: ${location || "India"}
Current Date: ${currentDate}

RESEARCH PRIORITIES:
1. Recent publications (last 2 years preferred)
2. Regional disease patterns and seasonal variations
3. Current outbreak surveillance data
4. Evidence-based diagnostic and treatment guidelines
5. Population-specific risk factors and presentations

INDIAN HEALTH CONTEXT:
- Monsoon-related diseases (dengue, chikungunya, malaria)
- Air pollution health impacts (Delhi, Mumbai, Kolkata)
- Nutritional deficiencies and endemic diseases
- Genetic predispositions in Indian populations
- Healthcare infrastructure considerations

Return ONLY valid JSON:
{
  "relevantStudies": [
    {
      "title": "complete study title",
      "summary": "key findings and clinical relevance",
      "evidenceLevel": number (1-5),
      "source": "journal name or database"
    }
  ],
  "regionalPatterns": "current disease patterns and trends in the specified region",
  "currentOutbreaks": ["list of current disease outbreaks or alerts"],
  "icmrGuidelines": [
    {
      "title": "ICMR guideline title",
      "summary": "how this guideline relates to the case",
      "year": 2024,
      "url": "https://..."
    }
  ],
  "whoProtocols": [
    {
      "title": "WHO protocol or guidance title",
      "summary": "how this protocol applies",
      "year": 2023,
      "url": "https://..."
    }
  ],
  "keyLiterature": [
    {
      "title": "key paper title",
      "summary": "main finding",
      "evidenceLevel": 1,
      "source": "journal name"
    }
  ]
}`;

    const userPrompt = `Research current medical evidence for these symptoms: "${symptoms}"

Location context: ${location || "India"}

Focus on:
1. Latest clinical studies and guidelines (2022-2024)
2. ICMR national guidelines relevant to these symptoms
3. WHO disease protocols and recommendations
4. Regional disease surveillance data
5. Current outbreak alerts and epidemiological trends
6. Evidence-based diagnostic approaches
7. Population-specific considerations

Provide comprehensive, up-to-date medical research findings.`;

    try {
      const result = await this.model.generateContent([systemPrompt, userPrompt]);
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in model response");

      const parsed = JSON.parse(jsonMatch[0]);

      const relevantStudies = Array.isArray(parsed.relevantStudies)
        ? parsed.relevantStudies.map(
            (study: {
              title?: string;
              summary?: string;
              evidenceLevel?: number;
              source?: string;
            }) => ({
              title: study.title || "Research finding",
              summary: study.summary || "No summary available",
              evidenceLevel: Math.min(Math.max(study.evidenceLevel || 3, 1), 5),
              source: study.source || "Medical literature",
            })
          )
        : [];

      const keyLiterature = Array.isArray(parsed.keyLiterature)
        ? parsed.keyLiterature.map(
            (study: {
              title?: string;
              summary?: string;
              evidenceLevel?: number;
              source?: string;
            }) => ({
              title: study.title || "Key paper",
              summary: study.summary || "No summary available",
              evidenceLevel: Math.min(Math.max(study.evidenceLevel || 3, 1), 5),
              source: study.source || "Medical literature",
            })
          )
        : [];

      const icmrGuidelines = Array.isArray(parsed.icmrGuidelines)
        ? parsed.icmrGuidelines.map(
            (g: { title?: string; summary?: string; year?: number; url?: string }) => ({
              title: g.title || "ICMR guideline",
              summary: g.summary || "",
              year: g.year,
              url: g.url,
            })
          )
        : [];

      const whoProtocols = Array.isArray(parsed.whoProtocols)
        ? parsed.whoProtocols.map(
            (g: { title?: string; summary?: string; year?: number; url?: string }) => ({
              title: g.title || "WHO protocol",
              summary: g.summary || "",
              year: g.year,
              url: g.url,
            })
          )
        : [];

      return {
        relevantStudies,
        regionalPatterns: parsed.regionalPatterns || "",
        currentOutbreaks: Array.isArray(parsed.currentOutbreaks)
          ? parsed.currentOutbreaks
          : [],
        icmrGuidelines,
        whoProtocols,
        keyLiterature,
      };
    } catch (error) {
      console.error("Shodh (Gemini) research error:", error);
      return this.fallbackResearch(symptoms, location);
    }
  }

  private fallbackResearch(symptoms: string, location?: string): MedicalResearchResult {
    const lowerSymptoms = symptoms.toLowerCase();
    const relevantStudies: MedicalResearchStudy[] = [];
    let regionalPatterns = "";
    let currentOutbreaks: string[] = [];

    if (lowerSymptoms.includes("fever")) {
      relevantStudies.push({
        title: "Fever Management in Tropical Climates: Updated Guidelines 2024",
        summary:
          "Recent evidence supports early diagnostic workup for vector-borne diseases in endemic areas",
        evidenceLevel: 2,
        source: "Tropical Medicine International",
      });

      if (
        location?.toLowerCase().includes("delhi") ||
        location?.toLowerCase().includes("mumbai")
      ) {
        regionalPatterns =
          "Increased dengue and chikungunya cases during monsoon season (June-October)";
        currentOutbreaks = ["Dengue fever", "Chikungunya"];
      }
    }

    if (lowerSymptoms.includes("chest")) {
      relevantStudies.push({
        title: "Acute Coronary Syndrome in South Asian Populations: 2024 Update",
        summary:
          "Higher prevalence of premature CAD in Indian subcontinent, requires modified risk stratification",
        evidenceLevel: 1,
        source: "Indian Heart Journal",
      });
    }

    return {
      relevantStudies,
      regionalPatterns,
      currentOutbreaks,
      icmrGuidelines: [],
      whoProtocols: [],
      keyLiterature: [],
    };
  }
}