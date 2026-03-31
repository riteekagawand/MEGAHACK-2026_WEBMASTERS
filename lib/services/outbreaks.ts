import connectToDatabase from "@/lib/mongodb";
import OutbreakSnapshot from "@/lib/models/OutbreakSnapshot";
import Outbreak from "@/lib/models/Outbreak";

export type RiskLevel = "low" | "medium" | "high";

export interface OutbreakPoint {
  disease: string;
  state: string;
  district: string;
  lat: number;
  lng: number;
  riskScore: number;
  riskLevel: RiskLevel;
  cases?: number;
  deaths?: number;
  lastUpdated: string;
  source: string;
}

const SNAPSHOT_SOURCE = "Gemini AI (NVBDCP/WHO data)";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const stateCoordinates: Record<string, { lat: number; lng: number }> = {
  Kerala: { lat: 10.8505, lng: 76.2711 },
  Maharashtra: { lat: 19.7515, lng: 75.7139 },
  Karnataka: { lat: 15.3173, lng: 75.7139 },
  "Tamil Nadu": { lat: 11.1271, lng: 78.6569 },
  "Uttar Pradesh": { lat: 26.8467, lng: 80.9462 },
  "West Bengal": { lat: 22.9868, lng: 87.855 },
  Odisha: { lat: 20.9517, lng: 85.0985 },
  Rajasthan: { lat: 27.0238, lng: 74.2179 },
  Gujarat: { lat: 22.2587, lng: 71.1924 },
  "Madhya Pradesh": { lat: 22.9734, lng: 78.6569 },
  "Andhra Pradesh": { lat: 15.9129, lng: 79.74 },
  Telangana: { lat: 18.1124, lng: 79.0193 },
  Bihar: { lat: 25.0961, lng: 85.3131 },
  Punjab: { lat: 31.1471, lng: 75.3412 },
  Haryana: { lat: 29.0588, lng: 76.0856 },
  Delhi: { lat: 28.7041, lng: 77.1025 },
  Assam: { lat: 26.2006, lng: 92.9376 },
  Jharkhand: { lat: 23.6102, lng: 85.2799 },
  Chhattisgarh: { lat: 21.2787, lng: 81.8661 },
  "Himachal Pradesh": { lat: 31.1048, lng: 77.1734 },
  Uttarakhand: { lat: 30.0668, lng: 79.0193 },
  Goa: { lat: 15.2993, lng: 74.124 },
  Tripura: { lat: 23.9408, lng: 91.9882 },
  Meghalaya: { lat: 25.467, lng: 91.3662 },
  Manipur: { lat: 24.6637, lng: 93.9063 },
  Nagaland: { lat: 26.1584, lng: 94.5624 },
  "Arunachal Pradesh": { lat: 28.218, lng: 94.7278 },
  Mizoram: { lat: 23.1645, lng: 92.9376 },
  Sikkim: { lat: 27.533, lng: 88.5122 },
  "Jammu and Kashmir": { lat: 33.2778, lng: 75.3412 },
  Ladakh: { lat: 34.1526, lng: 77.577 },
};

export async function getLatestSnapshot() {
  await connectToDatabase();
  return OutbreakSnapshot.findOne().sort({ fetchedAt: -1 }).lean();
}

export function isSnapshotFresh(snapshot: { fetchedAt: Date } | null) {
  if (!snapshot) return false;
  return Date.now() - new Date(snapshot.fetchedAt).getTime() < CACHE_TTL_MS;
}

export async function saveSnapshot(outbreaks: OutbreakPoint[]) {
  await connectToDatabase();
  return OutbreakSnapshot.create({
    outbreaks,
    source: SNAPSHOT_SOURCE,
    fetchedAt: new Date(),
  });
}

export async function fetchGeminiOutbreakData(): Promise<OutbreakPoint[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Return ONLY a valid JSON array of at most 10 outbreak objects for India.
Each object must have disease, state, severity ("high"|"medium"|"low"), cases, deaths.
Focus on current outbreaks from last 3 months.
Return JSON only. No markdown.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const text = (candidate?.content?.parts || [])
    .map((part: { text?: string }) => part.text || "")
    .join("");

  if (!text) throw new Error("Empty response from Gemini");
  if (finishReason === "MAX_TOKENS") throw new Error("Gemini response truncated (MAX_TOKENS)");

  let outbreaksRaw: Array<{
    disease?: string;
    state?: string;
    district?: string;
    severity?: string;
    cases?: number;
    deaths?: number;
  }> = [];

  try {
    outbreaksRaw = JSON.parse(text.trim());
  } catch {
    throw new Error("Failed to parse Gemini response");
  }

  if (!Array.isArray(outbreaksRaw) || outbreaksRaw.length === 0) {
    throw new Error("Invalid or empty outbreaks array from Gemini");
  }

  const result: OutbreakPoint[] = [];
  for (const item of outbreaksRaw) {
    const state = (item.state || "").trim();
    const disease = (item.disease || "").trim();
    const coords = stateCoordinates[state];
    if (!state || !disease || !coords) continue;

    const severity = (item.severity || "medium").toLowerCase();
    const riskLevel: RiskLevel =
      severity === "high" ? "high" : severity === "low" ? "low" : "medium";
    const riskScore = riskLevel === "high" ? 85 : riskLevel === "medium" ? 55 : 25;

    result.push({
      disease,
      state,
      district: item.district || "Unknown",
      lat: coords.lat + (Math.random() - 0.5) * 1.5,
      lng: coords.lng + (Math.random() - 0.5) * 1.5,
      riskScore,
      riskLevel,
      cases: typeof item.cases === "number" ? item.cases : undefined,
      deaths: typeof item.deaths === "number" ? item.deaths : undefined,
      lastUpdated: new Date().toISOString(),
      source: SNAPSHOT_SOURCE,
    });
  }

  if (result.length === 0) {
    throw new Error("No usable outbreaks returned from Gemini");
  }

  return result;
}

export async function refreshAndStoreSnapshot() {
  const outbreaks = await fetchGeminiOutbreakData();
  await saveSnapshot(outbreaks);
  return outbreaks;
}

export async function getLegacyOutbreakFallback(): Promise<OutbreakPoint[]> {
  await connectToDatabase();
  const docs = await Outbreak.find().sort({ updatedAt: -1 }).limit(100).lean();

  if (!docs.length) return [];

  return docs.map((doc: any) => ({
    disease: doc.disease,
    state: doc.state,
    district: doc.district || "Unknown",
    lat: doc.lat,
    lng: doc.lng,
    riskScore: doc.riskScore,
    riskLevel: doc.riskLevel,
    cases: undefined,
    deaths: undefined,
    lastUpdated: new Date(doc.lastUpdated || doc.updatedAt || Date.now()).toISOString(),
    source: SNAPSHOT_SOURCE,
  }));
}

export { SNAPSHOT_SOURCE, CACHE_TTL_MS };

