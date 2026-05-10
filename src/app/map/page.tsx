"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, Leaf, ChevronDown, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import CafeDetailPanel from "@/components/CafeDetailPanel";
import { cafes, Cafe, levelConfig, TransparencyLevel, City, CafeType } from "@/data/cafes";

const MapClient = dynamic(() => import("@/components/MapClient"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-cream-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-matcha-500 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-500">Loading map…</span>
      </div>
    </div>
  ),
});

type LevelFilter = TransparencyLevel | "All";
type CityFilter = City | "All";

const LEVEL_OPTS: { value: LevelFilter; label: string }[] = [
  { value: "All", label: "All Levels" },
  { value: "A", label: "A — Verified" },
  { value: "B", label: "B — Mentioned" },
  { value: "C", label: "C — No Disclosure" },
  { value: "D", label: "D — Unknown" },
];

const CITY_OPTS: { value: CityFilter; label: string }[] = [
  { value: "All", label: "All Cities" },
  { value: "Sydney", label: "Sydney" },
  { value: "Melbourne", label: "Melbourne" },
];

const TYPE_OPTS: { value: CafeType | "All"; label: string }[] = [
  { value: "All", label: "All Types" },
  { value: "specialty", label: "Specialty" },
  { value: "dessert", label: "Dessert" },
  { value: "cafe", label: "Cafe" },
  { value: "chain", label: "Chain" },
];

export default function MapPage() {
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("All");
  const [cityFilter, setCityFilter] = useState<CityFilter>("All");
  const [typeFilter, setTypeFilter] = useState<CafeType | "All">("All");
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filtered = useMemo(() => {
    return cafes.filter((c) => {
      const q = query.toLowerCase();
      const matchQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.suburb.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.specialties.some((s) => s.toLowerCase().includes(q));
      const matchLevel = levelFilter === "All" || c.level === levelFilter;
      const matchCity = cityFilter === "All" || c.city === cityFilter;
      const matchType = typeFilter === "All" || c.type === typeFilter;
      return matchQ && matchLevel && matchCity && matchType;
    });
  }, [query, levelFilter, cityFilter, typeFilter]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    filtered.forEach((c) => counts[c.level]++);
    return counts;
  }, [filtered]);

  const activeFilters = [levelFilter, cityFilter, typeFilter].filter((f) => f !== "All").length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-cream-50">
      <Navbar />

      {/* ── TOOLBAR ─────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3 mt-16"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search cafes, suburbs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-gray-100 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-matcha-200 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        {[
          { val: levelFilter, opts: LEVEL_OPTS, set: setLevelFilter as (v: string) => void },
          { val: cityFilter, opts: CITY_OPTS, set: setCityFilter as (v: string) => void },
          { val: typeFilter, opts: TYPE_OPTS, set: setTypeFilter as (v: string) => void },
        ].map((f, i) => (
          <div key={i} className="relative">
            <select
              value={f.val}
              onChange={(e) => f.set(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-gray-100 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-matcha-200 cursor-pointer transition-all"
              style={f.val !== "All" ? { background: "#e6f4e0", color: "#2e6027" } : {}}
            >
              {f.opts.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        ))}

        {activeFilters > 0 && (
          <button
            onClick={() => { setLevelFilter("All"); setCityFilter("All"); setTypeFilter("All"); setQuery(""); }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "#fee2e2", color: "#dc2626" }}
          >
            <X size={13} />
            Clear ({activeFilters})
          </button>
        )}

        <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
          {filtered.length} cafe{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── MAIN ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar */}
        <div
          className="flex-shrink-0 overflow-y-auto border-r border-gray-100"
          style={{
            width: sidebarOpen ? "300px" : "0",
            transition: "width 0.3s ease",
            background: "#fff",
          }}
        >
          {sidebarOpen && (
            <div className="w-[300px]">
              {/* Level legend */}
              <div className="p-4 border-b border-gray-100">
                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-3">
                  Transparency Levels
                </div>
                <div className="space-y-2">
                  {(["A", "B", "C", "D"] as TransparencyLevel[]).map((lvl) => {
                    const cfg = levelConfig[lvl];
                    return (
                      <button
                        key={lvl}
                        onClick={() => setLevelFilter(levelFilter === lvl ? "All" : lvl)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left"
                        style={
                          levelFilter === lvl
                            ? { background: cfg.bg, outline: `1.5px solid ${cfg.color}30` }
                            : { background: "transparent" }
                        }
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ background: cfg.color }}
                        >
                          {lvl}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-700 truncate">{cfg.shortLabel}</div>
                        </div>
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {levelCounts[lvl]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cafe list */}
              <div className="p-3">
                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-3 px-1">
                  Results ({filtered.length})
                </div>
                <div className="space-y-1.5">
                  {filtered.map((cafe) => {
                    const cfg = levelConfig[cafe.level];
                    const isSelected = selectedCafe?.id === cafe.id;
                    return (
                      <button
                        key={cafe.id}
                        onClick={() => setSelectedCafe(isSelected ? null : cafe)}
                        className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all"
                        style={
                          isSelected
                            ? { background: "#f2f8f0", outline: "1.5px solid #c2e1b5" }
                            : { background: "transparent" }
                        }
                        onMouseEnter={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#fafafa";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                          style={{ background: cfg.color }}
                        >
                          {cafe.level}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800 truncate">{cafe.name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-gray-400" />
                            <span className="text-xs text-gray-400">{cafe.suburb}, {cafe.city}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {filtered.length === 0 && (
                    <div className="text-center py-10 text-sm text-gray-400">
                      No cafes match your filters.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toggle sidebar button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 bottom-6 z-[60] flex items-center gap-1.5 px-3 py-2 rounded-r-xl text-xs font-medium bg-white border border-l-0 border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
          style={{ left: sidebarOpen ? "300px" : "0", transition: "left 0.3s ease" }}
        >
          <SlidersHorizontal size={13} />
          {sidebarOpen ? "Hide" : "List"}
        </button>

        {/* Map */}
        <div className="flex-1 relative overflow-hidden">
          <MapClient
            cafes={filtered}
            selectedCafe={selectedCafe}
            onSelectCafe={setSelectedCafe}
            city={cityFilter}
          />

          {/* Map legend overlay */}
          <div
            className="absolute bottom-5 left-5 z-[50] rounded-2xl p-4 shadow-card"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Leaf size={12} className="text-matcha-700" />
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Legend</span>
            </div>
            <div className="space-y-1.5">
              {(["A", "B", "C", "D"] as TransparencyLevel[]).map((lvl) => {
                const cfg = levelConfig[lvl];
                return (
                  <div key={lvl} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ background: cfg.color }}
                    />
                    <span className="text-xs text-gray-600">
                      <span className="font-semibold">{lvl}</span> — {cfg.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cafe Detail Panel */}
        <CafeDetailPanel
          cafe={selectedCafe}
          onClose={() => setSelectedCafe(null)}
        />
      </div>
    </div>
  );
}
