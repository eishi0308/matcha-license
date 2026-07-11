"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import CafeDetailPanel from "@/components/CafeDetailPanel";
import { Cafe, levelConfig, TransparencyLevel, City, CafeType } from "@/data/cafes";
import { fetchCafes, fetchStats } from "@/lib/api";

const MapClient = dynamic(() => import("@/components/MapClient"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-cream-100">
      <div className="flex flex-col items-center gap-3">
        <motion.div
          className="w-10 h-10 rounded-full border-2 border-matcha-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="text-sm text-gray-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          Loading map…
        </motion.span>
      </div>
    </div>
  ),
});

type LevelFilter = TransparencyLevel | "All";
type CityFilter  = City | "All";

const LEVEL_OPTS: { value: LevelFilter; label: string }[] = [
  { value: "All", label: "All Levels" },
  { value: "A",   label: "A — Verified" },
  { value: "B",   label: "B — Mentioned" },
  { value: "C",   label: "C — No Disclosure" },
  { value: "D",   label: "D — Unknown" },
];
const CITY_OPTS: { value: CityFilter; label: string }[] = [
  { value: "All",       label: "All Cities" },
  { value: "Sydney",    label: "Sydney" },
  { value: "Melbourne", label: "Melbourne" },
];
const TYPE_OPTS: { value: CafeType | "All"; label: string }[] = [
  { value: "All",       label: "All Types" },
  { value: "specialty", label: "Specialty" },
  { value: "dessert",   label: "Dessert" },
  { value: "cafe",      label: "Cafe" },
  { value: "chain",     label: "Chain" },
];

const SPRING = { type: "spring" as const, stiffness: 300, damping: 28 };
const EASE   = [0.25, 0.46, 0.45, 0.94] as const;

const listVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 420, damping: 28 } },
};

export default function MapPage() {
  const [cafes,        setCafes]       = useState<Cafe[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [discovering,  setDiscovering] = useState(false);
  const [query,        setQuery]       = useState("");
  const [levelFilter,  setLevelFilter] = useState<LevelFilter>("All");
  const [cityFilter,   setCityFilter]  = useState<CityFilter>("All");
  const [typeFilter,   setTypeFilter]  = useState<CafeType | "All">("All");
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [isMobile,     setIsMobile]    = useState(false);

  // Detect mobile and default sidebar to closed on small screens
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        const [cafesData, stats] = await Promise.all([fetchCafes(), fetchStats()]);
        setCafes(cafesData);
        setDiscovering(stats.discovering);

        if (stats.discovering) {
          pollInterval = setInterval(async () => {
            try {
              const [newCafes, newStats] = await Promise.all([fetchCafes(), fetchStats()]);
              setCafes(newCafes);
              setDiscovering(newStats.discovering);
              if (!newStats.discovering) clearInterval(pollInterval!);
            } catch {}
          }, 5000);
        }
      } catch (err) {
        console.error("[Map load error]", err);
        setCafes([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, []);

  const filtered = useMemo(() => cafes.filter((c) => {
    const q = query.toLowerCase();
    return (
      (!q || c.name.toLowerCase().includes(q) || c.suburb.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.specialties.some((s) => s.toLowerCase().includes(q))) &&
      (levelFilter === "All" || c.level === levelFilter) &&
      (cityFilter  === "All" || c.city  === cityFilter) &&
      (typeFilter  === "All" || c.type  === typeFilter)
    );
  }), [cafes, query, levelFilter, cityFilter, typeFilter]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    filtered.forEach((c) => counts[c.level]++);
    return counts;
  }, [filtered]);

  const activeFilters = [levelFilter, cityFilter, typeFilter].filter((f) => f !== "All").length;
  const clearAll = () => { setLevelFilter("All"); setCityFilter("All"); setTypeFilter("All"); setQuery(""); };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-cream-50">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-full border-2 border-matcha-500 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
          <span className="text-sm text-gray-400">Loading cafes…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-cream-50">
      <Navbar />

      {/* ── TOOLBAR ──────────────────────────────────────────────────── */}
      <motion.div
        className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-3 mt-16"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
        }}
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.55, ease: EASE }}
      >
        {/* Row 1: search + mobile count */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cafes, suburbs…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-gray-100 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-matcha-200 transition-all"
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={SPRING}
                  whileTap={{ scale: 0.85 }}
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Count — visible only on mobile in this row */}
          <motion.span
            key={filtered.length}
            className="sm:hidden text-xs text-gray-400 whitespace-nowrap"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {filtered.length} cafe{filtered.length !== 1 ? "s" : ""}
          </motion.span>
        </div>

        {/* Row 2: filters (horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-0.5 sm:pb-0">
          {[
            { val: levelFilter, opts: LEVEL_OPTS, set: setLevelFilter as (v: string) => void },
            { val: cityFilter,  opts: CITY_OPTS,  set: setCityFilter  as (v: string) => void },
            { val: typeFilter,  opts: TYPE_OPTS,  set: setTypeFilter  as (v: string) => void },
          ].map((f, i) => (
            <motion.div key={i} className="relative flex-shrink-0" whileHover={{ scale: 1.02 }} transition={SPRING}>
              <select
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 sm:py-2.5 rounded-xl bg-gray-100 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-matcha-200 cursor-pointer transition-all"
                style={f.val !== "All" ? { background: "#e6f4e0", color: "#2e6027" } : {}}
              >
                {f.opts.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </motion.div>
          ))}

          <AnimatePresence>
            {activeFilters > 0 && (
              <motion.button
                onClick={clearAll}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium"
                style={{ background: "#fee2e2", color: "#dc2626" }}
                initial={{ opacity: 0, scale: 0.8, x: -8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -8 }}
                transition={SPRING}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={13} />Clear ({activeFilters})
              </motion.button>
            )}
          </AnimatePresence>

          {/* Count — desktop only */}
          <motion.span
            key={filtered.length}
            className="hidden sm:block text-xs text-gray-400 ml-auto whitespace-nowrap"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {filtered.length} cafe{filtered.length !== 1 ? "s" : ""}
          </motion.span>

          <AnimatePresence>
            {discovering && (
              <motion.div
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: "#e6f4e0", color: "#2e6027" }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-matcha-600"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                Discovering…
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── MAIN ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile backdrop — tap to close sidebar */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              className="absolute inset-0 z-40 bg-black/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.div
          className="overflow-y-auto border-r border-gray-100 bg-white"
          style={isMobile ? {
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 50,
            width: 300,
            boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
          } : { flexShrink: 0 }}
          animate={isMobile
            ? { x: sidebarOpen ? 0 : -300 }
            : { width: sidebarOpen ? 300 : 0 }
          }
          transition={SPRING}
        >
          <div className="w-[300px]">
            {/* Level legend */}
            <motion.div
              className="p-4 border-b border-gray-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4, ease: EASE }}
            >
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-3">
                Transparency Levels
              </div>
              <div className="space-y-1.5">
                {(["A", "B", "C", "D"] as TransparencyLevel[]).map((lvl) => {
                  const cfg = levelConfig[lvl];
                  const active = levelFilter === lvl;
                  return (
                    <motion.button
                      key={lvl}
                      onClick={() => setLevelFilter(active ? "All" : lvl)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left"
                      animate={{
                        background: active ? cfg.bg : "transparent",
                        outline: active ? `1.5px solid ${cfg.color}30` : "1.5px solid transparent",
                      }}
                      whileHover={{ background: active ? cfg.bg : "#f9fafb" } as any}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.15 }}
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
                      <motion.span
                        className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                        style={{ background: cfg.bg, color: cfg.color }}
                        key={levelCounts[lvl]}
                        initial={{ scale: 1.25 }}
                        animate={{ scale: 1 }}
                        transition={SPRING}
                      >
                        {levelCounts[lvl]}
                      </motion.span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Cafe list */}
            <div className="p-3">
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-3 px-1">
                Results ({filtered.length})
              </div>

              <AnimatePresence mode="wait">
                {filtered.length === 0 ? (
                  <motion.div
                    key="empty"
                    className="text-center py-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {discovering && cafes.length === 0 ? (
                      <>
                        <motion.div
                          className="w-8 h-8 rounded-full border-2 border-matcha-500 border-t-transparent mx-auto mb-3"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                        />
                        <p className="text-sm font-medium text-matcha-700">Discovering cafes…</p>
                        <p className="text-xs text-gray-400 mt-1">Searching Google Maps & analysing menus</p>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl mb-2">🍵</div>
                        <p className="text-sm text-gray-400">No cafes match your filters.</p>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`${levelFilter}-${cityFilter}-${typeFilter}-${query}`}
                    className="space-y-1.5"
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {filtered.map((cafe) => {
                      const cfg = levelConfig[cafe.level];
                      const isSelected = selectedCafe?.id === cafe.id;
                      return (
                        <motion.button
                          key={cafe.id}
                          onClick={() => {
                            setSelectedCafe(isSelected ? null : cafe);
                            if (isMobile) setSidebarOpen(false);
                          }}
                          className="w-full flex items-start gap-3 p-3 rounded-xl text-left"
                          variants={itemVariants}
                          animate={{
                            background: isSelected ? "#f2f8f0" : "transparent",
                            outline: isSelected ? "1.5px solid #c2e1b5" : "1.5px solid transparent",
                          }}
                          whileHover={{ background: isSelected ? "#f2f8f0" : "#fafafa" } as any}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.12 }}
                        >
                          <motion.div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                            style={{ background: cfg.color }}
                            whileHover={{ scale: 1.1 }}
                            transition={SPRING}
                          >
                            {cafe.level}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">{cafe.name}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin size={10} className="text-gray-400" />
                              <span className="text-xs text-gray-400">{cafe.suburb}, {cafe.city}</span>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Sidebar toggle */}
        <motion.button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute bottom-6 z-[60] flex items-center gap-1.5 px-3 py-2 rounded-r-xl text-xs font-medium bg-white border border-l-0 border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"
          animate={{ left: (!isMobile && sidebarOpen) ? 300 : 0 }}
          transition={SPRING}
          whileHover={{ paddingRight: "14px" }}
          whileTap={{ scale: 0.96 }}
        >
          <SlidersHorizontal size={13} />
          {sidebarOpen ? "Hide" : "List"}
        </motion.button>

        {/* Map */}
        <div className="flex-1 relative overflow-hidden">
          <MapClient
            cafes={filtered}
            selectedCafe={selectedCafe}
            onSelectCafe={setSelectedCafe}
            city={cityFilter}
          />

          {/* Legend — only visible when sidebar is closed, bottom-right, doubles as filter */}
          <AnimatePresence>
            {!sidebarOpen && (
              <motion.div
                className="absolute bottom-5 right-5 z-[50] hidden sm:block"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.94)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(0,0,0,0.07)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  {(["A", "B", "C", "D"] as TransparencyLevel[]).map((lvl, i) => {
                    const cfg = levelConfig[lvl];
                    const active = levelFilter === lvl;
                    return (
                      <motion.button
                        key={lvl}
                        onClick={() => setLevelFilter(active ? "All" : lvl)}
                        className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left ${i < 3 ? "border-b border-gray-100" : ""}`}
                        style={{ background: active ? cfg.bg : "transparent" }}
                        whileHover={{ background: active ? cfg.bg : "#f9fafb" } as any}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.1 }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                        <span className="text-[11px] whitespace-nowrap text-gray-600">
                          <span className="font-bold" style={{ color: cfg.color }}>{lvl}</span>
                          {" — "}{cfg.shortLabel}
                        </span>
                        <span className="ml-auto pl-3 text-[10px] font-semibold tabular-nums" style={{ color: cfg.color }}>
                          {levelCounts[lvl]}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cafe detail panel */}
        <CafeDetailPanel cafe={selectedCafe} onClose={() => setSelectedCafe(null)} />
      </div>
    </div>
  );
}
