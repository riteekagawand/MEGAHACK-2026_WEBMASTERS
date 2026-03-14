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

// Convert fallback data to OutbreakPoint format
function getFallbackData(): OutbreakPoint[] {
  return fallbackOutbreakData.map(item => {
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
}

// Fetch real outbreak data using Gemini API
async function fetchGeminiOutbreakData(): Promise<OutbreakPoint[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured, using fallback data");
      return getFallbackData();
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
              text: `Search for current disease outbreaks in India. Return a JSON array with outbreak objects.

Each object must have:
- disease: name of the disease (e.g., Dengue, Malaria, Chikungunya, H1N1, Japanese Encephalitis, COVID-19)
- state: Indian state name
- severity: "high", "medium", or "low" based on number of cases and deaths
- cases: approximate number of cases reported
- deaths: approximate number of deaths (if any)

Focus on CURRENT outbreaks from the last 3 months. Include data from NVBDCP, WHO, and Indian health ministry reports.
Only return the JSON array, no other text.

Example format:
[
  {"disease": "Dengue", "state": "Kerala", "severity": "high", "cases": 4500, "deaths": 12},
  {"disease": "Malaria", "state": "Odisha", "severity": "high", "cases": 5200, "deaths": 3}
]`,
            }],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status}`, errorText);
      console.log("Using fallback data...");
      return getFallbackData();
    }

    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data, null, 2));
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!text) {
      console.error("Empty response from Gemini, using fallback data");
      return getFallbackData();
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
      console.log("Using fallback data...");
      return getFallbackData();
    }
    
    if (!Array.isArray(outbreaks) || outbreaks.length === 0) {
      console.error("Invalid or empty outbreaks array from Gemini");
      return getFallbackData();
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

    return result;
  } catch (error) {
    console.error("Gemini fetch error:", error);
    console.log("Using fallback data...");
    return getFallbackData();
  }
}

export async function GET() {
  try {
    const outbreaks = await fetchGeminiOutbreakData();
    const isFallback = outbreaks.length > 0 && outbreaks[0].source === "NVBDCP (Fallback)";
    
    return NextResponse.json({
      outbreaks,
      lastUpdated: new Date().toISOString(),
      sources: isFallback ? ["NVBDCP (Fallback)"] : ["Gemini AI (NVBDCP/WHO data)"],
      total: outbreaks.length,
      isFallback,
    });
  } catch (error) {
    console.error("Error fetching outbreak data:", error);
    // Even if everything fails, return fallback data
    const fallbackData = getFallbackData();
    return NextResponse.json({
      outbreaks: fallbackData,
      lastUpdated: new Date().toISOString(),
      sources: ["NVBDCP (Emergency Fallback)"],
      total: fallbackData.length,
      isFallback: true,
    });
  }
}
