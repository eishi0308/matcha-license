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

const LEVEL_COLORS: Record<string, string> = {
  A: "#2e6027",
  B: "#6eb35c",
  C: "#9ca3af",
  D: "#d1d5db",
};

/**
 * Beacon colour for the selected pin. Deliberately NOT the level colour: ~90%
 * of cafes are level C, so a level-tinted halo would be grey almost every time.
 * Red is the one hue the level palette (greens + greys) never uses, so it can't
 * be mistaken for a grade — and the pin body keeps its level colour regardless.
 */
const SIGNAL = "#e11d48";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function pinHtml(level: string, color: string, size: number, isSelected: boolean) {
  return `
    <div style="
      width:${size}px;
      height:${size}px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:${isSelected
        ? `0 0 0 3px ${SIGNAL}, 0 6px 20px rgba(0,0,0,0.34)`
        : "0 4px 16px rgba(0,0,0,0.28)"};
      border:${isSelected ? "3px" : "2.5px"} solid #ffffff;
    ">
      <span style="
        transform:rotate(45deg);
        font-size:${isSelected ? 16 : 13}px;
        font-weight:800;
        color:white;
        font-family:system-ui,sans-serif;
        letter-spacing:-0.5px;
      ">${level}</span>
    </div>
  `;
}

/**
 * The selected cafe keeps its level colour — selection is carried by scale, a
 * white ring, a one-shot ripple and a name chip, while every other pin drops
 * back to 40% so only one pin on the map is at full strength.
 */
function createCustomIcon(level: string, isSelected: boolean, name: string) {
  const color = LEVEL_COLORS[level] || "#9ca3af";
  const size  = isSelected ? 46 : 36;

  const html = isSelected
    ? `<div style="position:relative;width:${size}px;height:${size}px;--ms-ring:${SIGNAL};">
         <span class="ms-ripple"></span>
         <span class="ms-ripple ms-ripple--2"></span>
         ${pinHtml(level, color, size, true)}
         <span class="ms-label">${escapeHtml(name)}</span>
       </div>`
    : pinHtml(level, color, size, false);

  return L.divIcon({
    html,
    // Dimming is done in CSS off this class, not baked into each icon, so
    // selecting a cafe doesn't rebuild all ~1100 markers.
    className: isSelected ? "ms-selected" : "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Unselected pins have exactly four variants — build each once and share it.
const iconCache = new Map<string, L.DivIcon>();

function getIcon(level: string, isSelected: boolean, name: string) {
  if (isSelected) return createCustomIcon(level, true, name);
  let icon = iconCache.get(level);
  if (!icon) {
    icon = createCustomIcon(level, false, name);
    iconCache.set(level, icon);
  }
  return icon;
}

/** Puts the map into "something is selected" mode so CSS can dim the context. */
function SelectionMode({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().classList.toggle("ms-has-selection", active);
  }, [map, active]);
  return null;
}

function FlyTo({ cafe, isMobile }: { cafe: Cafe | null; isMobile: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!cafe) return;
    // Don't zoom back out if the user has already zoomed in past 15
    const zoom = Math.max(map.getZoom(), 15);
    const target = L.latLng(cafe.lat, cafe.lng);

    // On mobile the bottom sheet covers the lower half, so aim the pin high;
    // on desktop the panel is a flex sibling, so the container itself shrinks
    // and the true centre is already the visible centre.
    const center = isMobile
      ? map.unproject(map.project(target, zoom).add([0, map.getSize().y * 0.22]), zoom)
      : target;

    map.flyTo(center, zoom, { duration: 0.8 });
  }, [cafe, map, isMobile]);
  return null;
}

/**
 * The detail panel and the sidebar resize the map's container. Leaflet doesn't
 * notice on its own, so it keeps drawing at the old width — which parks the
 * cafe you just selected underneath the panel describing it.
 */
function ResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize({ animate: false, pan: false }));
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
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
  isMobile?: boolean;
}

const CITY_CENTERS: Record<string, [number, number]> = {
  All: [-33.88, 151.21],
  Sydney: [-33.8688, 151.2093],
  Melbourne: [-37.8136, 144.9631],
};

export default function MapClient({ cafes, selectedCafe, onSelectCafe, city, isMobile = false }: Props) {
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
      <ResizeHandler />
      <SelectionMode active={!!selectedCafe} />
      <FlyTo cafe={selectedCafe} isMobile={isMobile} />
      {cafes.map((cafe) => {
        const isSelected = selectedCafe?.id === cafe.id;
        return (
          <Marker
            key={cafe.id}
            position={[cafe.lat, cafe.lng]}
            icon={getIcon(cafe.level, isSelected, cafe.name)}
            eventHandlers={{ click: () => onSelectCafe(cafe) }}
            zIndexOffset={isSelected ? 1000 : 0}
          />
        );
      })}
    </MapContainer>
  );
}
