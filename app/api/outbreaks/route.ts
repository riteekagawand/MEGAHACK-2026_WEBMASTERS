import { NextResponse } from "next/server";

type RiskLevel = "low" | "medium" | "high";

interface OutbreakPoint {
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

// Indian state coordinates
const stateCoordinates: Record<string, { lat: number; lng: number }> = {
  "Kerala": { lat: 10.8505, lng: 76.2711 },
  "Maharashtra": { lat: 19.7515, lng: 75.7139 },
  "Karnataka": { lat: 15.3173, lng: 75.7139 },
  "Tamil Nadu": { lat: 11.1271, lng: 78.6569 },
  "Uttar Pradesh": { lat: 26.8467, lng: 80.9462 },
  "West Bengal": { lat: 22.9868, lng: 87.8550 },
  "Odisha": { lat: 20.9517, lng: 85.0985 },
  "Rajasthan": { lat: 27.0238, lng: 74.2179 },
  "Gujarat": { lat: 22.2587, lng: 71.1924 },
  "Madhya Pradesh": { lat: 22.9734, lng: 78.6569 },
  "Andhra Pradesh": { lat: 15.9129, lng: 79.7400 },
  "Telangana": { lat: 18.1124, lng: 79.0193 },
  "Bihar": { lat: 25.0961, lng: 85.3131 },
  "Punjab": { lat: 31.1471, lng: 75.3412 },
  "Haryana": { lat: 29.0588, lng: 76.0856 },
  "Delhi": { lat: 28.7041, lng: 77.1025 },
  "Assam": { lat: 26.2006, lng: 92.9376 },
  "Jharkhand": { lat: 23.6102, lng: 85.2799 },
  "Chhattisgarh": { lat: 21.2787, lng: 81.8661 },
  "Himachal Pradesh": { lat: 31.1048, lng: 77.1734 },
  "Uttarakhand": { lat: 30.0668, lng: 79.0193 },
  "Goa": { lat: 15.2993, lng: 74.1240 },
  "Tripura": { lat: 23.9408, lng: 91.9882 },
  "Meghalaya": { lat: 25.4670, lng: 91.3662 },
  "Manipur": { lat: 24.6637, lng: 93.9063 },
  "Nagaland": { lat: 26.1584, lng: 94.5624 },
  "Arunachal Pradesh": { lat: 28.2180, lng: 94.7278 },
  "Mizoram": { lat: 23.1645, lng: 92.9376 },
  "Sikkim": { lat: 27.5330, lng: 88.5122 },
  "Jammu and Kashmir": { lat: 33.2778, lng: 75.3412 },
  "Ladakh": { lat: 34.1526, lng: 77.5770 },
};

// Fallback outbreak data (based on NVBDCP reports)
const fallbackOutbreakData = [
  { disease: "Dengue", state: "Kerala", severity: "high", cases: 4523, deaths: 12 },
  { disease: "Dengue", state: "Karnataka", severity: "high", cases: 3892, deaths: 8 },
  { disease: "Dengue", state: "Tamil Nadu", severity: "high", cases: 3241, deaths: 6 },
  { disease: "Dengue", state: "Maharashtra", severity: "high", cases: 2876, deaths: 5 },
  { disease: "Malaria", state: "Odisha", severity: "high", cases: 5234, deaths: 3 },
  { disease: "Malaria", state: "Chhattisgarh", severity: "high", cases: 4123, deaths: 2 },
  { disease: "Japanese Encephalitis", state: "Uttar Pradesh", severity: "high", cases: 234, deaths: 45 },
  { disease: "Japanese Encephalitis", state: "Bihar", severity: "high", cases: 187, deaths: 32 },
  { disease: "Chikungunya", state: "Karnataka", severity: "medium", cases: 1234, deaths: 0 },
  { disease: "H1N1", state: "Maharashtra", severity: "medium", cases: 567, deaths: 23 },
  { disease: "Typhoid", state: "West Bengal", severity: "medium", cases: 2156, deaths: 4 },
  { disease: "None reported", state: "Himachal Pradesh", severity: "low", cases: 0, deaths: 0 },
  { disease: "None reported", state: "Sikkim", severity: "low", cases: 0, deaths: 0 },
  { disease: "None reported", state: "Goa", severity: "low", cases: 0, deaths: 0 },
];

// Palghar area outbreak data - Various risk zones (Red, Orange, Yellow, Green)
const palgharOutbreakData = [
  // RED ZONE (Severe - 85+ risk score)
  { disease: "Dengue", place: "Virar", district: "Palghar", severity: "severe", cases: 523, deaths: 8, lat: 19.4558, lng: 72.8118 },
  
  // ORANGE ZONE (High - 70-85 risk score)
  { disease: "Malaria", place: "Palghar Town", district: "Palghar", severity: "high", cases: 289, deaths: 3, lat: 19.6966, lng: 72.7695 },
  
  // YELLOW ZONE (Medium - 40-70 risk score)
  { disease: "Chikungunya", place: "Boisar", district: "Palghar", severity: "medium", cases: 87, deaths: 1, lat: 19.8000, lng: 72.7500 },
  
  // GREEN ZONE (Low - 0-40 risk score)
  { disease: "Viral Fever", place: "Jawhar", district: "Palghar", severity: "low", cases: 34, deaths: 0, lat: 19.9167, lng: 73.2167 },
];

// Convert fallback data to OutbreakPoint format
function getFallbackData(): OutbreakPoint[] {
  const stateOutbreaks = fallbackOutbreakData.map(item => {
    const coords = stateCoordinates[item.state];
    if (!coords) return null;
    
    const severity = item.severity as RiskLevel;
    const riskScore = severity === "high" ? 85 : severity === "medium" ? 55 : 15;
    
    return {
      disease: item.disease,
      state: item.state,
      district: "Unknown",
      lat: coords.lat + (Math.random() - 0.5) * 1.5,
      lng: coords.lng + (Math.random() - 0.5) * 1.5,
      riskScore,
      riskLevel: severity,
      cases: item.cases,
      deaths: item.deaths,
      lastUpdated: new Date().toISOString(),
      source: "NVBDCP (Fallback)",
    };
  }).filter(Boolean) as OutbreakPoint[];

  // Add Palghar area outbreaks with different risk zones
  const palgharOutbreaks: OutbreakPoint[] = palgharOutbreakData.map(item => {
    // Calculate risk score based on severity
    let riskScore: number;
    let riskLevel: RiskLevel;
    
    switch (item.severity) {
      case "severe": // Red zone
        riskScore = 88 + Math.random() * 7; // 88-95
        riskLevel = "high";
        break;
      case "high": // Orange zone
        riskScore = 72 + Math.random() * 8; // 72-80
        riskLevel = "high";
        break;
      case "medium": // Yellow zone
        riskScore = 45 + Math.random() * 20; // 45-65
        riskLevel = "medium";
        break;
      case "low": // Green zone
      default:
        riskScore = 15 + Math.random() * 20; // 15-35
        riskLevel = "low";
        break;
    }
    
    return {
      disease: item.disease,
      state: item.place + ", Palghar",
      district: item.district,
      lat: item.lat + (Math.random() - 0.5) * 0.02,
      lng: item.lng + (Math.random() - 0.5) * 0.02,
      riskScore,
      riskLevel,
      cases: item.cases,
      deaths: item.deaths,
      lastUpdated: new Date().toISOString(),
      source: "NVBDCP (Palghar District)",
    };
  });

  return [...stateOutbreaks, ...palgharOutbreaks];
}

// Fetch real outbreak data using Gemini API
async function fetchGeminiOutbreakData(): Promise<OutbreakPoint[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Hardcoded fallback disabled: Gemini-only mode.
      // return getFallbackData();
      throw new Error("GEMINI_API_KEY not configured");
    }

    console.log("Calling Gemini API...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Return ONLY a valid JSON array of at most 10 outbreak objects for India.

Each object must have:
- disease: name of the disease (e.g., Dengue, Malaria, Chikungunya, H1N1, Japanese Encephalitis, COVID-19)
- state: Indian state name
- severity: "high", "medium", or "low" based on number of cases and deaths
- cases: approximate number of cases reported
- deaths: approximate number of deaths (if any)

Focus on CURRENT outbreaks from the last 3 months. Include data from NVBDCP, WHO, and Indian health ministry reports.
Return JSON only. No markdown. No code fences. No explanation text.

Example format:
[
  {"disease": "Dengue", "state": "Kerala", "severity": "high", "cases": 4500, "deaths": 12},
  {"disease": "Malaria", "state": "Odisha", "severity": "high", "cases": 5200, "deaths": 3}
]`,
            }],
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status}`, errorText);
      // Hardcoded fallback disabled: Gemini-only mode.
      // return getFallbackData();
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const finishReason = candidate?.finishReason;
    const text = (candidate?.content?.parts || [])
      .map((part: { text?: string }) => part.text || "")
      .join("");
    
    if (!text) {
      // Hardcoded fallback disabled: Gemini-only mode.
      // return getFallbackData();
      throw new Error("Empty response from Gemini");
    }

    if (finishReason === "MAX_TOKENS") {
      throw new Error("Gemini response truncated (MAX_TOKENS)");
    }

    // Extract JSON from response
    let jsonStr = text;
    if (text.includes("```json")) {
      jsonStr = text.split("```json")[1].split("```")[0];
    } else if (text.includes("```")) {
      jsonStr = text.split("```")[1].split("```")[0];
    }

    let outbreaks;
    try {
      outbreaks = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      console.log("Raw response:", text);
      // Hardcoded fallback disabled: Gemini-only mode.
      // return getFallbackData();
      throw new Error("Failed to parse Gemini response");
    }
    
    if (!Array.isArray(outbreaks) || outbreaks.length === 0) {
      throw new Error("Invalid or empty outbreaks array from Gemini");
    }
    
    const result: OutbreakPoint[] = [];

    for (const outbreak of outbreaks) {
      const coords = stateCoordinates[outbreak.state];
      if (!coords) {
        console.warn(`No coordinates for state: ${outbreak.state}`);
        continue;
      }

      const severity = outbreak.severity?.toLowerCase() || "medium";
      const riskScore = severity === "high" ? 85 : severity === "medium" ? 55 : 25;
      const riskLevel: RiskLevel = severity as RiskLevel;

      result.push({
        disease: outbreak.disease,
        state: outbreak.state,
        district: outbreak.district || "Unknown",
        lat: coords.lat + (Math.random() - 0.5) * 1.5,
        lng: coords.lng + (Math.random() - 0.5) * 1.5,
        riskScore,
        riskLevel,
        cases: outbreak.cases,
        deaths: outbreak.deaths,
        lastUpdated: new Date().toISOString(),
        source: "Gemini AI (NVBDCP/WHO data)",
      });
    }

    // Hardcoded Palghar seed data disabled: Gemini-only mode.
    // const palgharOutbreaks: OutbreakPoint[] = ...
    // return [...result, ...palgharOutbreaks];
    return result;
  } catch (error) {
    console.error("Gemini fetch error:", error);
    // Hardcoded fallback disabled: Gemini-only mode.
    // return getFallbackData();
    throw error;
  }
}

export async function GET() {
  try {
    const outbreaks = await fetchGeminiOutbreakData();
    
    return NextResponse.json({
      outbreaks,
      lastUpdated: new Date().toISOString(),
      sources: ["Gemini AI (NVBDCP/WHO data)"],
      total: outbreaks.length,
      isFallback: false,
    });
  } catch (error) {
    console.error("Error fetching outbreak data:", error);
    return NextResponse.json(
      {
        outbreaks: [],
        lastUpdated: new Date().toISOString(),
        sources: ["Gemini AI (NVBDCP/WHO data)"],
        total: 0,
        isFallback: false,
        error: "Unable to fetch outbreak data from Gemini",
      },
      { status: 502 }
    );
  }
}
