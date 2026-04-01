"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Map as MapIcon,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  Activity,
  Users,
  Skull,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then((m) => m.Circle),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

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
}

// Get heatmap color based on risk score
const getHeatmapColor = (score: number): string => {
  if (score < 40) {
    const ratio = score / 40;
    const r = Math.round(255 * ratio);
    const g = 255;
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  } else if (score < 70) {
    const ratio = (score - 40) / 30;
    const r = 255;
    const g = Math.round(255 * (1 - ratio * 0.5));
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const ratio = (score - 70) / 30;
    const r = 255;
    const g = Math.round(127 * (1 - ratio));
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  }
};

const getRiskBadgeStyles = (riskLevel: RiskLevel) => {
  if (riskLevel === "high") {
    return { backgroundColor: "#f97316", color: "white" };
  }
  if (riskLevel === "medium") {
    return { backgroundColor: "#facc15", color: "#151616" };
  }
  return { backgroundColor: "#22c55e", color: "white" };
};

// Generate predictive alert based on risk level and cases
const getPredictiveAlert = (o: OutbreakPoint): string => {
  const riskScore = o.riskScore;
  const cases = o.cases || 0;

  if (riskScore >= 85) {
    return `Critical: Expect ${Math.round(cases * 0.3)}+ new ${o.disease} cases this week. Prepare emergency resources.`;
  } else if (riskScore >= 70) {
    return `High Alert: ${o.disease} spreading. Stock up on ${o.disease.toLowerCase()} medications and test kits.`;
  } else if (riskScore >= 40) {
    return `Moderate Risk: Monitor ${o.disease} trends. Consider preventive patient counseling.`;
  } else {
    return `Low Risk: ${o.disease} activity minimal. Maintain standard precautions.`;
  }
};

export default function OutbreakRadarPage() {
  const [outbreaks, setOutbreaks] = useState<OutbreakPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLatLng, setUserLatLng] = useState<[number, number] | null>(null);
  const [locationPermission, setLocationPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [userCity, setUserCity] = useState<string>("");

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLatLng([lat, lng]);
          setLocationPermission("granted");
          
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            const data = await res.json();
            setUserCity(data.city || data.locality || "Your Location");
          } catch {
            setUserCity("Your Location");
          }
        },
        () => {
          setLocationPermission("denied");
        }
      );
    } else {
      setLocationPermission("denied");
    }
  };

  const goToPanIndia = () => {
    setUserLatLng(null);
    setUserCity("");
    setLocationPermission("prompt");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/outbreaks");
        const data = await res.json();
        setOutbreaks(data.outbreaks || []);
      } catch (e) {
        console.error("Failed to load outbreaks", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const nearbyOutbreaks = userLatLng
    ? outbreaks.filter(o => {
        const dist = Math.sqrt(
          Math.pow(o.lat - userLatLng[0], 2) + Math.pow(o.lng - userLatLng[1], 2)
        );
        return dist < 2;
      })
    : [];

  const displayOutbreaks = userLatLng ? nearbyOutbreaks : outbreaks;

  // Calculate statistics
  const totalCases = displayOutbreaks.reduce((sum, o) => sum + (o.cases || 0), 0);
  const totalDeaths = displayOutbreaks.reduce((sum, o) => sum + (o.deaths || 0), 0);
  const highRiskCount = displayOutbreaks.filter(o => o.riskScore >= 70).length;
  const lowRiskCount = displayOutbreaks.filter(o => o.riskScore < 40).length;

  // Map center and zoom
  const center: [number, number] = userLatLng || [22.5, 80];
  const zoom = userLatLng ? 11 : 5;

  // Smaller radius for city view to prevent oversized circles
  const circleRadius = userLatLng ? 2000 + 20 : 15000 + 200;

  return (
    <div className="h-[calc(100vh-7rem)] px-4 pt-1 pb-3 overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full gap-2">
        {/* Compact Header */}
        <div className="flex items-center justify-between bg-white border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] rounded-xl px-4 py-1.5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f9c80e] rounded-lg border-2 border-[#151616] flex items-center justify-center shadow-[2px_2px_0px_0px_#151616]">
              <Activity className="w-5 h-5 text-[#151616]" />
            </div>
            <div>
              <h1 className="font-instrument-serif text-lg text-[#151616] leading-tight">
                Epi‑Watch Radar
              </h1>
              <p className="text-xs font-poppins text-[#151616]/60">
                {userLatLng ? `Near ${userCity}` : "Pan India View"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-poppins text-green-700 font-medium">LIVE</span>
            </div>

            {/* Location Button */}
            {locationPermission === "prompt" ? (
              <Button
                onClick={requestLocation}
                size="sm"
                className="bg-[#151616] text-white hover:bg-[#151616]/90 font-poppins text-xs font-medium px-3 py-1.5 h-auto"
              >
                <MapPin className="w-3 h-3 mr-1" />
                My Location
              </Button>
            ) : locationPermission === "granted" ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-[#f9c80e] text-[#151616] border-[#151616] font-poppins text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {userCity}
                </Badge>
                <Button
                  onClick={goToPanIndia}
                  size="sm"
                  className="bg-[#151616] text-white hover:bg-[#151616]/90 font-poppins text-xs font-medium px-3 py-1.5 h-auto"
                >
                  Pan India View
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Compact Stats Row */}
        <div className="grid grid-cols-4 gap-1.5 flex-shrink-0">
          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] bg-white">
            <CardContent className="p-1.5 flex items-center gap-2">
              <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Skull className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] font-poppins text-[#151616]/60">Deaths</p>
                <p className="text-lg font-bold font-poppins text-[#151616] leading-tight">{totalDeaths}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] bg-white">
            <CardContent className="p-1.5 flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-[10px] font-poppins text-[#151616]/60">Cases</p>
                <p className="text-lg font-bold font-poppins text-[#151616] leading-tight">{totalCases.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] bg-white">
            <CardContent className="p-1.5 flex items-center gap-2">
              <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] font-poppins text-[#151616]/60">High Risk</p>
                <p className="text-lg font-bold font-poppins text-red-600 leading-tight">{highRiskCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] bg-white">
            <CardContent className="p-1.5 flex items-center gap-2">
              <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] font-poppins text-[#151616]/60">Low Risk</p>
                <p className="text-lg font-bold font-poppins text-green-600 leading-tight">{lowRiskCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 flex-1 min-h-0">
          {/* Map */}
          <div className="lg:col-span-2 h-full min-h-0">
            <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] overflow-hidden h-full flex flex-col">
              <div className="bg-[#151616] px-3 py-1.5 flex items-center justify-between flex-shrink-0">
                <span className="text-xs font-poppins text-white/80 flex items-center gap-2">
                  <MapIcon className="w-3 h-3" />
                  {userLatLng ? `Zoomed to ${userCity}` : "India Overview"}
                </span>
                <span className="text-xs font-poppins text-white/60">
                  {displayOutbreaks.length} Outbreaks
                </span>
              </div>
              <div className="flex-1 relative min-h-0">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#f9c80e] mx-auto mb-2" />
                      <p className="text-xs font-poppins text-[#151616]/60">Loading...</p>
                    </div>
                  </div>
                ) : (
                  <MapContainer
                    key={`${center[0]}-${center[1]}-${zoom}`}
                    center={center}
                    zoom={zoom}
                    scrollWheelZoom={true}
                    style={{
                      height: "100%",
                      width: "100%",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    {displayOutbreaks.map((o, idx) => (
                      <Circle
                        key={idx}
                        center={[o.lat, o.lng]}
                        radius={circleRadius * (o.riskScore / 50)}
                        pathOptions={{
                          color: getHeatmapColor(o.riskScore),
                          fillColor: getHeatmapColor(o.riskScore),
                          fillOpacity: 0.6,
                          weight: 2,
                        }}
                      >
                        <Popup>
                          <div className="min-w-[180px] p-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getHeatmapColor(o.riskScore) }}
                              />
                              <span className="font-bold text-sm text-gray-900">{o.disease}</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Location:</span>
                                <span className="font-medium text-gray-900">{o.state}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Cases:</span>
                                <span className="font-medium text-gray-900">{o.cases ?? "N/A"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Deaths:</span>
                                <span className="font-medium text-gray-900">{o.deaths ?? "N/A"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Risk Score:</span>
                                <span className="font-medium text-gray-900">{Math.round(o.riskScore)}/100</span>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Circle>
                    ))}

                    {userLatLng && (
                      <>
                        <Circle
                          center={userLatLng}
                          radius={300}
                          pathOptions={{
                            color: "#151616",
                            fillColor: "#f9c80e",
                            fillOpacity: 1,
                            weight: 3,
                          }}
                        />
                        <Circle
                          center={userLatLng}
                          radius={800}
                          pathOptions={{
                            color: "#f9c80e",
                            fillColor: "#f9c80e",
                            fillOpacity: 0.2,
                            weight: 2,
                            dashArray: "5, 5",
                          }}
                        />
                      </>
                    )}
                  </MapContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-1.5 h-full min-h-0">
            {/* Legend */}
            <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] bg-white flex-shrink-0">
              <CardContent className="p-2">
                <div className="grid grid-cols-4 gap-1">
                  <div className="flex flex-col items-center p-1 rounded bg-green-50 border border-green-200">
                    <div className="w-3 h-3 rounded-sm" style={{ background: "rgb(0, 255, 0)" }}></div>
                    <span className="text-[9px] font-poppins text-green-800 mt-0.5">Low</span>
                  </div>
                  <div className="flex flex-col items-center p-1 rounded bg-yellow-50 border border-yellow-200">
                    <div className="w-3 h-3 rounded-sm" style={{ background: "rgb(255, 255, 0)" }}></div>
                    <span className="text-[9px] font-poppins text-yellow-800 mt-0.5">Med</span>
                  </div>
                  <div className="flex flex-col items-center p-1 rounded bg-orange-50 border border-orange-200">
                    <div className="w-3 h-3 rounded-sm" style={{ background: "rgb(255, 128, 0)" }}></div>
                    <span className="text-[9px] font-poppins text-orange-800 mt-0.5">High</span>
                  </div>
                  <div className="flex flex-col items-center p-1 rounded bg-red-50 border border-red-200">
                    <div className="w-3 h-3 rounded-sm" style={{ background: "rgb(255, 0, 0)" }}></div>
                    <span className="text-[9px] font-poppins text-red-800 mt-0.5">Severe</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Outbreaks List or Predictive Alerts */}
            <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] bg-white flex-1 min-h-0 flex flex-col">
              <CardHeader className="py-1.5 px-3 border-b border-[#151616]/10 flex-shrink-0">
                <CardTitle className="font-poppins text-xs text-[#151616] flex items-center gap-2">
                  {userLatLng ? (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      Predictive Alerts for {userCity}
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3" />
                      India Hotspots
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1.5 overflow-y-auto flex-1">
                {!userLatLng ? (
                  // Country view - simple list
                  outbreaks.slice(0, 8).map((o, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-gray-50 border border-[#151616]/10 hover:border-[#151616]/30 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getHeatmapColor(o.riskScore) }}
                        />
                        <div>
                          <div className="font-medium text-[#151616] text-[10px] font-poppins leading-tight">
                            {o.state}
                          </div>
                          <div className="text-[9px] text-[#151616]/60 font-poppins">
                            {o.disease} • {o.cases ?? "?"} cases
                          </div>
                        </div>
                      </div>
                      <Badge
                        className="text-[8px] font-bold border-0 px-1 py-0"
                        style={getRiskBadgeStyles(o.riskLevel)}
                      >
                        {o.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                ) : nearbyOutbreaks.length > 0 ? (
                  // Location view - predictive alerts
                  nearbyOutbreaks.map((o, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg border-2 transition-all"
                      style={{
                        borderColor: o.riskScore >= 70 ? "#ef4444" : o.riskScore >= 40 ? "#f97316" : "#22c55e",
                        backgroundColor: o.riskScore >= 70 ? "#fef2f2" : o.riskScore >= 40 ? "#fff7ed" : "#f0fdf4"
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3" style={{ color: getHeatmapColor(o.riskScore) }} />
                          <span className="font-bold text-[10px] font-poppins text-[#151616]">{o.disease}</span>
                        </div>
                        <Badge
                          className="text-[8px] font-bold border-0 px-1 py-0"
                          style={getRiskBadgeStyles(o.riskLevel)}
                        >
                          {o.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-[9px] text-[#151616]/70 font-poppins mb-1">
                        📍 {o.state} • {o.cases ?? "?"} cases • {o.deaths ?? 0} deaths
                      </div>
                      <div
                        className="text-[9px] font-poppins font-medium p-1 rounded"
                        style={{
                          backgroundColor: o.riskScore >= 70 ? "#fee2e2" : o.riskScore >= 40 ? "#ffedd5" : "#dcfce7",
                          color: o.riskScore >= 70 ? "#991b1b" : o.riskScore >= 40 ? "#9a3412" : "#166534"
                        }}
                      >
                        ⚠️ {getPredictiveAlert(o)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                    <ShieldCheck className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <p className="text-xs font-poppins font-bold text-green-900">All Clear!</p>
                    <p className="text-[10px] font-poppins text-green-700">No outbreaks nearby.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}