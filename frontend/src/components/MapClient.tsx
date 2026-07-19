"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Cafe } from "@/data/cafes";

// Fix leaflet default icon in Next.js
function fixLeafletIcon() {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

const MAP_POS_KEY = "matcha_map_position";

function saveMapPosition(center: L.LatLng, zoom: number) {
  sessionStorage.setItem(MAP_POS_KEY, JSON.stringify({ lat: center.lat, lng: center.lng, zoom }));
}

function loadMapPosition(): { lat: number; lng: number; zoom: number } | null {
  try {
    const raw = sessionStorage.getItem(MAP_POS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function createCustomIcon(level: string, isSelected: boolean) {
  const colors: Record<string, string> = {
    A: "#2e6027",
    B: "#6eb35c",
    C: "#9ca3af",
    D: "#d1d5db",
  };
  const color = colors[level] || "#9ca3af";
  const size = isSelected ? 44 : 36;

  const html = `
    <div style="
      width:${size}px;
      height:${size}px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 4px 16px rgba(0,0,0,0.28);
      border:${isSelected ? "3px" : "2.5px"} solid rgba(255,255,255,0.95);
      transition:all 0.2s;
    ">
      <span style="
        transform:rotate(45deg);
        font-size:${isSelected ? 15 : 13}px;
        font-weight:800;
        color:white;
        font-family:system-ui,sans-serif;
        letter-spacing:-0.5px;
      ">${level}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function FlyTo({ cafe }: { cafe: Cafe | null }) {
  const map = useMap();
  useEffect(() => {
    if (cafe) {
      map.flyTo([cafe.lat, cafe.lng], 15, { duration: 0.8 });
    }
  }, [cafe, map]);
  return null;
}

// Saves position on every pan/zoom, and flies to city center when city filter changes
function MapStateTracker({ city }: { city: string }) {
  const map = useMap();
  const prevCity = useRef(city);

  useEffect(() => {
    const handler = () => saveMapPosition(map.getCenter(), map.getZoom());
    map.on("moveend", handler);
    return () => { map.off("moveend", handler); };
  }, [map]);

  useEffect(() => {
    if (city !== prevCity.current) {
      if (city !== "All") {
        const center = CITY_CENTERS[city];
        if (center) map.flyTo(center, 13, { duration: 0.8 });
      }
      prevCity.current = city;
    }
  }, [city, map]);

  return null;
}

interface Props {
  cafes: Cafe[];
  selectedCafe: Cafe | null;
  onSelectCafe: (cafe: Cafe) => void;
  city: string;
}

const CITY_CENTERS: Record<string, [number, number]> = {
  All: [-33.88, 151.21],
  Sydney: [-33.8688, 151.2093],
  Melbourne: [-37.8136, 144.9631],
};

export default function MapClient({ cafes, selectedCafe, onSelectCafe, city }: Props) {
  useEffect(() => { fixLeafletIcon(); }, []);

  // Read saved position once on mount — persists across page navigations within the same tab
  const savedPos = useRef(loadMapPosition());
  const center: [number, number] = savedPos.current
    ? [savedPos.current.lat, savedPos.current.lng]
    : (CITY_CENTERS[city] || CITY_CENTERS.All);
  const zoom = savedPos.current?.zoom ?? 13;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <MapStateTracker city={city} />
      <FlyTo cafe={selectedCafe} />
      {cafes.map((cafe) => (
        <Marker
          key={cafe.id}
          position={[cafe.lat, cafe.lng]}
          icon={createCustomIcon(cafe.level, selectedCafe?.id === cafe.id)}
          eventHandlers={{ click: () => onSelectCafe(cafe) }}
          zIndexOffset={selectedCafe?.id === cafe.id ? 1000 : 0}
        />
      ))}
    </MapContainer>
  );
}
