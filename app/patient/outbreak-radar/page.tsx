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

// Get heatmap color based on risk score (gradient from green to red)
const getHeatmapColor = (score: number): string => {
  // Score 0-100: Green (low) -> Yellow (medium) -> Red (high)
  if (score < 40) {
    // Green to Yellow
    const ratio = score / 40;
    const r = Math.round(255 * ratio);
    const g = 255;
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  } else if (score < 70) {
    // Yellow to Orange
    const ratio = (score - 40) / 30;
    const r = 255;
    const g = Math.round(255 * (1 - ratio * 0.5));
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Orange to Red
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

  // Ask for location permission
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLatLng([lat, lng]);
          setLocationPermission("granted");
          
          // Try to get city name from coordinates
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

  // Default to India center if no location
  const center: [number, number] = userLatLng || [22.5, 80];
  // Zoom level: 12 for city view, 5 for country view
  const zoom = userLatLng ? 12 : 5;

  // Filter outbreaks near user location (within ~50km if city view)
  const nearbyOutbreaks = userLatLng
    ? outbreaks.filter(o => {
        const dist = Math.sqrt(
          Math.pow(o.lat - userLatLng[0], 2) + Math.pow(o.lng - userLatLng[1], 2)
        );
        return dist < 2; // Roughly 50-100km
      })
    : outbreaks;

  return (
    <div className="h-screen bg-[#FFFFF4] p-4 overflow-hidden">
      <div className="h-full max-w-7xl mx-auto flex flex-col gap-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between bg-white border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] rounded-xl px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D6F32F] rounded-lg border-2 border-[#151616] flex items-center justify-center shadow-[2px_2px_0px_0px_#151616]">
              <Activity className="w-5 h-5 text-[#151616]" />
            </div>
            <div>
              <h1 className="font-instrument-serif text-xl text-[#151616] leading-tight">
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
              <Badge className="bg-[#D6F32F] text-[#151616] border-[#151616] font-poppins text-xs">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Located
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Error Message */}
        {locError && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <p className="text-xs text-orange-700 font-poppins">{locError}</p>
          </div>
        )}

        {/* Main Content: Map on Left, Info on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0" style={{ height: "calc(100vh - 140px)" }}>
          {/* Left: Map */}
          <div className="lg:col-span-2 h-full">
            <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] overflow-hidden flex flex-col h-full">
              <div className="bg-[#151616] px-4 py-2 flex items-center justify-between flex-shrink-0">
                <span className="text-xs font-poppins text-white/80 flex items-center gap-2">
                  <MapIcon className="w-3 h-3" />
                  {userLatLng ? `Zoomed to ${userCity}` : "India Overview"}
                </span>
                <span className="text-xs font-poppins text-white/60">
                  {userLatLng ? "City Level" : "Country Level"}
                </span>
              </div>
              <div className="flex-1 relative">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 animate-spin text-[#D6F32F] mx-auto mb-3" />
                      <p className="text-sm font-poppins text-[#151616]/60">Loading outbreak data...</p>
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
                      {/* Heatmap-style circles with gradient colors */}
                      {(userLatLng ? nearbyOutbreaks : outbreaks).map((o, idx) => (
                        <Circle
                          key={idx}
                          center={[o.lat, o.lng]}
                          radius={userLatLng ? 2000 + o.riskScore * 50 : 15000 + o.riskScore * 200}
                          pathOptions={{
                            color: getHeatmapColor(o.riskScore),
                            fillColor: getHeatmapColor(o.riskScore),
                            fillOpacity: 0.6,
                            weight: 2,
                          }}
                        />
                      ))}
                      {/* User location marker - yellow circle with black border */}
                      {userLatLng && (
                        <>
                          <Circle
                            center={userLatLng}
                            radius={300}
                            pathOptions={{
                              color: "#151616",
                              fillColor: "#D6F32F",
                              fillOpacity: 1,
                              weight: 3,
                            }}
                          />
                          <Circle
                            center={userLatLng}
                            radius={800}
                            pathOptions={{
                              color: "#D6F32F",
                              fillColor: "#D6F32F",
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

          {/* Right: Legend and Outbreaks */}
          <div className="flex flex-col gap-3 h-full" style={{ height: "calc(100vh - 140px)" }}>
            {/* Legend - Compact */}
            <Card className="border-2 border-[#151616] shadow-[3px_3px_0px_0px_#151616] bg-white flex-shrink-0">
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-1.5 rounded bg-green-50 border border-green-200">
                    <div className="w-3 h-3 rounded-sm" style={{ background: "rgb(0, 255, 0)" }}></div>
                    <span className="text-[10px] font-poppins font-medium text-green-800">Low 0-40</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded bg-yellow-50 border border-yellow-200">
                    <div className="w-3 h-3 rounded-sm" style={{ background: "rgb(255, 255, 0)" }}></div>
                    <span className="text-[10px] font-poppins font-medium text-yellow-800">Med 40-70</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded bg-orange-50 border border-orange-200">
                    <div className="w-3 h-3 rounded-sm" style={{ background: "rgb(255, 128, 0)" }}></div>
                    <span className="text-[10px] font-poppins font-medium text-orange-800">High 70-85</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded bg-red-50 border border-red-200">
                    <div className="w-3 h-3 rounded-sm" style={{ background: "rgb(255, 0, 0)" }}></div>
                    <span className="text-[10px] font-poppins font-medium text-red-800">Severe 85+</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Outbreaks List */}
            <Card className="border-2 border-[#151616] shadow-[3px_3px_0px_0px_#151616] bg-white flex-1 min-h-0 flex flex-col">
              <CardHeader className="py-2 px-3 border-b border-[#151616]/10 flex-shrink-0">
                <CardTitle className="font-poppins text-xs text-[#151616] flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  {userLatLng ? `Near ${userCity}` : "India Hotspots"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-1.5 overflow-y-auto flex-1">
                {!userLatLng ? (
                  // Show all India outbreaks before location permission
                  outbreaks.slice(0, 10).map((o, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-[#151616]/10 hover:border-[#151616]/30 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: getHeatmapColor(o.riskScore) }}
                        />
                        <div>
                          <div className="font-medium text-[#151616] text-xs font-poppins leading-tight">
                            {o.state}
                          </div>
                          <div className="text-[10px] text-[#151616]/60 font-poppins">
                            {o.disease}
                          </div>
                        </div>
                      </div>
                      <Badge
                        className="text-[9px] font-bold border-0 px-1.5 py-0.5"
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
                  // Show nearby outbreaks after location permission
                  nearbyOutbreaks.map((o, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-[#151616]/10 hover:border-[#151616]/30 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: getHeatmapColor(o.riskScore) }}
                        />
                        <div>
                          <div className="font-medium text-[#151616] text-xs font-poppins leading-tight">
                            {o.state}
                          </div>
                          <div className="text-[10px] text-[#151616]/60 font-poppins">
                            {o.disease}
                          </div>
                        </div>
                      </div>
                      <Badge
                        className="text-[9px] font-bold border-0 px-1.5 py-0.5"
                        style={{
                          backgroundColor: getHeatmapColor(o.riskScore),
                          color: o.riskScore > 50 ? "white" : "#151616",
                        }}
                      >
                        {o.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                ) : (
                  // No outbreaks nearby
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg border-2 border-green-600 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-poppins font-bold text-green-900">
                          All Clear in {userCity}!
                        </p>
                        <p className="text-[10px] font-poppins text-green-700 mt-0.5">
                          No outbreaks reported nearby.
                        </p>
                      </div>
                    </div>
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