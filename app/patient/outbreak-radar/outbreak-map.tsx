"use client";

import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";

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

interface OutbreakMapProps {
  center: [number, number];
  zoom: number;
  displayOutbreaks: OutbreakPoint[];
  userLatLng: [number, number] | null;
  circleRadius: number;
}

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

export default function OutbreakMap({
  center,
  zoom,
  displayOutbreaks,
  userLatLng,
  circleRadius,
}: OutbreakMapProps) {
  return (
    <MapContainer
      key={`${center[0]}-${center[1]}-${zoom}`}
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="h-full w-full"
      style={{
        height: "100%",
        width: "100%",
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
  );
}
