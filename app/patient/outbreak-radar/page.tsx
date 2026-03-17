"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Map as MapIcon, AlertTriangle, MapPin, ShieldCheck, Activity } from "lucide-react";

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

export default function OutbreakRadarPage() {
  const [outbreaks, setOutbreaks] = useState<OutbreakPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);
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
          setLocError("Location access denied. Showing India overview.");
        }
      );
    } else {
      setLocationPermission("denied");
      setLocError("Geolocation not supported. Showing India overview.");
    }
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

  const center: [number, number] = userLatLng || [22.5, 80];
  const zoom = userLatLng ? 11 : 5;

  const nearbyOutbreaks = userLatLng
    ? outbreaks.filter(o => {
        const dist = Math.sqrt(
          Math.pow(o.lat - userLatLng[0], 2) + Math.pow(o.lng - userLatLng[1], 2)
        );
        return dist < 2;
      })
    : outbreaks;

  // Smaller radius for city view to prevent oversized circles
  const circleRadius = userLatLng ? 2000 + 20 : 15000 + 200;

  return (
    <div className="h-[calc(100vh-120px)] p-4 overflow-hidden flex flex-col">
      <div className="h-full max-w-7xl mx-auto w-full flex flex-col gap-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between bg-white border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] rounded-xl px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D6F32F] rounded-lg border-2 border-[#151616] flex items-center justify-center shadow-[2px_2px_0px_0px_#151616]">
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
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-poppins text-green-700 font-medium">LIVE</span>
            </div>
            
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
              <Badge className="bg-[#D6F32F] text-[#151616] border-[#151616] font-poppins text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {userCity}
              </Badge>
            ) : null}
          </div>
        </div>

        {locError && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <p className="text-xs text-orange-700 font-poppins">{locError}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Map */}
          <div className="lg:col-span-2 h-full min-h-0">
            <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] overflow-hidden h-full flex flex-col">
              <div className="bg-[#151616] px-3 py-1.5 flex items-center justify-between flex-shrink-0">
                <span className="text-xs font-poppins text-white/80 flex items-center gap-2">
                  <MapIcon className="w-3 h-3" />
                  {userLatLng ? `Zoomed to ${userCity}` : "India Overview"}
                </span>
                <span className="text-xs font-poppins text-white/60">
                  {userLatLng ? nearbyOutbreaks.length : outbreaks.length} Outbreaks
                </span>
              </div>
              <div className="flex-1 relative min-h-0">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#D6F32F] mx-auto mb-2" />
                      <p className="text-xs font-poppins text-[#151616]/60">Loading...</p>
                    </div>
                  </div>
                ) : (
                  <MapContainer
                    key={`${center[0]}-${center[1]}-${zoom}`}
                    center={center}
                    zoom={zoom}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    {(userLatLng ? nearbyOutbreaks : outbreaks).map((o, idx) => (
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
                          <div className="min-w-[160px] p-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div 
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: getHeatmapColor(o.riskScore) }}
                              />
                              <span className="font-bold text-sm text-gray-900">{o.disease}</span>
                            </div>
                            <div className="space-y-0.5 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>📍</span>
                                <span className="font-medium text-gray-900">{o.state}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>🏥</span>
                                <span className="font-medium text-gray-900">{o.cases ?? "?"} cases</span>
                              </div>
                              <div className="flex justify-between">
                                <span>⚠️</span>
                                <span className="font-medium text-gray-900">{o.deaths ?? 0} deaths</span>
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
                          radius={200}
                          pathOptions={{
                            color: "#151616",
                            fillColor: "#D6F32F",
                            fillOpacity: 1,
                            weight: 3,
                          }}
                        />
                        <Circle
                          center={userLatLng}
                          radius={500}
                          pathOptions={{
                            color: "#D6F32F",
                            fillColor: "#D6F32F",
                            fillOpacity: 0.15,
                            weight: 1,
                            dashArray: "4, 4",
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
          <div className="flex flex-col gap-3 h-full min-h-0">
            {/* Legend */}
            <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] bg-white flex-1 flex flex-col">
              <CardHeader className="py-3 px-4 border-b border-[#151616]/10 flex-shrink-0">
                <CardTitle className="font-poppins text-sm text-[#151616] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Severity Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded bg-green-50 border border-green-200">
                    <div className="w-4 h-4 rounded mt-0.5 flex-shrink-0" style={{ background: "rgb(0, 255, 0)" }}></div>
                    <div>
                      <span className="text-xs font-poppins font-bold text-green-800 block">Low Risk</span>
                      <span className="text-[10px] font-poppins text-green-700">Minimal cases, no action needed</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded bg-yellow-50 border border-yellow-200">
                    <div className="w-4 h-4 rounded mt-0.5 flex-shrink-0" style={{ background: "rgb(255, 255, 0)" }}></div>
                    <div>
                      <span className="text-xs font-poppins font-bold text-yellow-800 block">Medium Risk</span>
                      <span className="text-[10px] font-poppins text-yellow-700">Moderate spread, stay cautious</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded bg-orange-50 border border-orange-200">
                    <div className="w-4 h-4 rounded mt-0.5 flex-shrink-0" style={{ background: "rgb(255, 128, 0)" }}></div>
                    <div>
                      <span className="text-xs font-poppins font-bold text-orange-800 block">High Risk</span>
                      <span className="text-[10px] font-poppins text-orange-700">Significant outbreak, take precautions</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded bg-red-50 border border-red-200">
                    <div className="w-4 h-4 rounded mt-0.5 flex-shrink-0" style={{ background: "rgb(255, 0, 0)" }}></div>
                    <div>
                      <span className="text-xs font-poppins font-bold text-red-800 block">Severe Risk</span>
                      <span className="text-[10px] font-poppins text-red-700">Critical outbreak, avoid travel</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-[10px] font-poppins text-blue-800 text-center">
                    <strong>Tip:</strong> Click on map circles to see detailed outbreak information
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Outbreaks List */}
            <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] bg-white flex-1 flex flex-col">
              <CardHeader className="py-3 px-4 border-b border-[#151616]/10 flex-shrink-0">
                <CardTitle className="font-poppins text-sm text-[#151616] flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {userLatLng ? `Near ${userCity}` : "India Hotspots"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2 overflow-y-auto flex-1">
                {!userLatLng ? (
                  outbreaks.slice(0, 4).map((o, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded bg-gray-50 border border-[#151616]/10"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: getHeatmapColor(o.riskScore) }}
                        />
                        <span className="text-sm font-poppins text-[#151616]">{o.state}</span>
                        <span className="text-xs text-[#151616]/50">• {o.disease}</span>
                      </div>
                      <Badge
                        className="text-xs font-bold border-0 px-2 py-0.5"
                        style={{
                          backgroundColor: getHeatmapColor(o.riskScore),
                          color: o.riskScore > 50 ? "white" : "#151616",
                        }}
                      >
                        {o.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                ) : nearbyOutbreaks.length > 0 ? (
                  nearbyOutbreaks.slice(0, 4).map((o, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded border"
                      style={{
                        borderColor: o.riskScore >= 70 ? "#ef4444" : o.riskScore >= 40 ? "#f97316" : "#22c55e",
                        backgroundColor: o.riskScore >= 70 ? "#fef2f2" : o.riskScore >= 40 ? "#fff7ed" : "#f0fdf4"
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: getHeatmapColor(o.riskScore) }}
                        />
                        <span className="text-sm font-poppins font-medium text-[#151616]">{o.disease}</span>
                        <span className="text-xs text-[#151616]/60">• {o.cases ?? "?"} cases</span>
                      </div>
                      <Badge
                        className="text-xs font-bold border-0 px-2 py-0.5"
                        style={{
                          backgroundColor: getHeatmapColor(o.riskScore),
                          color: "white"
                        }}
                      >
                        {o.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-green-50 rounded border border-green-200 text-center">
                    <ShieldCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-poppins font-bold text-green-900">All Clear!</p>
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