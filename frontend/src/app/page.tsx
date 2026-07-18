"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  animate,
} from "framer-motion";
import {
  Leaf, Map, Shield, Search, ArrowRight, CheckCircle2,
  TrendingUp, Eye, FileText, MessageSquarePlus, ExternalLink, Play,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import { fetchStats } from "@/lib/api";

// ── Constants ──────────────────────────────────────────────────────────────

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const EASE_EXPO = [0.16, 1, 0.3, 1] as const;
const SPRING = { type: "spring" as const, stiffness: 300, damping: 28 };

// ── Data ──────────────────────────────────────────────────────────────────

const DEFAULT_STATS = [
  { value: 1147, suffix: "+", label: "Cafes Indexed", sublabel: "& still growing", icon: "map" },
  { value: 50,  suffix: "",  label: "Mention Japanese Origin", sublabel: "on their menu or site", icon: "leaf" },
  { value: 2,   suffix: "",  label: "Cities Covered", sublabel: "Sydney & Melbourne", icon: "cities" },
  { value: 37,  suffix: "",  label: "Name a Specific Source", sublabel: "farm, region or supplier", icon: "file" },
];

const LEVEL_CARDS = [
  { level: "A", title: "Verified Japanese Disclosure", desc: "Publicly states Japanese origin, prefecture, or direct sourcing with evidence URL.", accent: "#2e6027", badgeBg: "#e6f4e0", border: "#b3dda6" },
  { level: "B", title: "Japanese Matcha Mentioned",    desc: "References 'Japanese matcha' but no specific region, farm, or supplier named.",    accent: "#3a7a30", badgeBg: "#eef7e9", border: "#c2e1b5" },
  { level: "C", title: "No Origin Disclosure",         desc: "Serves matcha but provides no public sourcing information on any channel.",         accent: "#6b7280", badgeBg: "#f3f4f6", border: "#e5e7eb" },
  { level: "D", title: "Insufficient Information",     desc: "Could not verify enough information across website, menu, or social media.",        accent: "#9ca3af", badgeBg: "#f9fafb", border: "#e5e7eb" },
];


const PROBLEM_FACTS = [
  { icon: Shield,   num: "01", phrase: "No Australian law mandates matcha origin disclosure on menus" },
  { icon: FileText, num: "02", phrase: '"Ceremonial grade" has no legal definition in Australia' },
  { icon: Search,   num: "03", phrase: "Many cafes use Chinese-sourced matcha marketed as Japanese" },
  { icon: Eye,      num: "04", phrase: "Consumers currently rely entirely on trust — not evidence" },
];

const PRESS_CARDS = [
  {
    source: "ABC News Australia",
    flag: "🇦🇺",
    type: "video" as const,
    accent: "#FF0000",
    headline: "Matcha producers in Japan warn of fake products from China",
    byline: "Filmed in Uji, Kyoto · ABC News AU",
    domain: "youtube.com",
    quote: "Japanese tea producers speak directly on camera about Chinese counterfeits flooding global markets including Australia.",
    url: "https://www.youtube.com/watch?v=qYh1iXaF-jI",
  },
  {
    source: "10 News Australia",
    flag: "🇦🇺",
    type: "video" as const,
    accent: "#00539b",
    headline: "Global Matcha Shortage Leads To Counterfeit Products And Price Hikes",
    byline: "Channel 10 News · Australia",
    domain: "youtube.com",
    quote: "Australian TV networks report a global matcha shortage is directly driving counterfeit products into cafes and retail — consumers are paying premium prices for fake product.",
    url: "https://www.youtube.com/watch?v=1HvXZgyzKMw",
  },
  {
    source: "The Japan Times",
    flag: "🇯🇵",
    type: "article" as const,
    accent: "#c0392b",
    headline: "Government registers 'Japanese tea' under brand protection system",
    byline: "The Japan Times · July 10, 2026",
    domain: "japantimes.co.jp",
    quote: "Japan's agriculture ministry registered 'Japanese tea' under GI protection specifically to combat intellectual property infringement by counterfeit imitation products amid the global matcha boom.",
    url: "https://www.japantimes.co.jp/news/2026/07/10/japan/japanese-tea-brand-protection/",
  },
];

const HOW_IT_WORKS = [
  { icon: Search,   step: "01", title: "We Discover Cafes",        desc: "We scan Google Maps, Instagram, Broadsheet, and more to build a comprehensive list of matcha cafes in Sydney & Melbourne." },
  { icon: FileText, step: "02", title: "We Verify Evidence",       desc: "Every claim is cross-checked against official websites, menu pages, about sections, and public social media. No guessing allowed." },
  { icon: Shield,   step: "03", title: "We Classify Transparently",desc: "Each cafe receives a level A–D based solely on publicly verifiable evidence — never opinion or taste tests." },
  { icon: Eye,      step: "04", title: "You See the Evidence",     desc: "Every listing shows the exact quote, source URL, and verification date. You can check it yourself." },
];

const EVIDENCE_CARDS = [
  {
    cafe: "Cha Cha Matcha",
    suburb: "Surry Hills · Sydney",
    level: "A",
    levelLabel: "Verified Japanese Disclosure",
    accent: "#2e6027",
    badgeBg: "#e6f4e0",
    border: "rgba(46,96,39,0.45)",
    glow: "rgba(46,96,39,0.28)",
    quote: "Our matcha is stone-ground weekly in Uji, Kyoto — sourced directly from the Tanaka family farm. Every batch ships with the harvest date and garden certificate.",
    source: "Official website · About page",
    date: "Jun 2026",
  },
  {
    cafe: "Ceremony Coffee",
    suburb: "Fitzroy · Melbourne",
    level: "B",
    levelLabel: "Japanese Matcha Mentioned",
    accent: "#3a7a30",
    badgeBg: "#eef7e9",
    border: "rgba(58,122,48,0.3)",
    glow: "rgba(58,122,48,0.2)",
    quote: "We exclusively use Japanese ceremonial grade matcha, carefully selected for its vibrant colour, sweetness, and umami depth.",
    source: "Drinks menu · 2026",
    date: "May 2026",
  },
  {
    cafe: "Morning Ritual",
    suburb: "Newtown · Sydney",
    level: "C",
    levelLabel: "No Origin Disclosed",
    accent: "#9ca3af",
    badgeBg: "#f3f4f6",
    border: "rgba(156,163,175,0.2)",
    glow: "rgba(107,114,128,0.1)",
    quote: null,
    source: "Website, menu & Instagram reviewed",
    date: "Jun 2026",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function SplitWords({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 80, rotateX: -20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.85, delay: delay + i * 0.07, ease: EASE_EXPO }}
        >
          {word}{i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </span>
  );
}

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const ctrl = animate(0, to, {
      duration: 3.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { if (ref.current) ref.current.textContent = `${Math.round(v)}${suffix}`; },
    });
    return ctrl.stop;
  }, [inView, to, suffix]);
  return <span ref={ref}>{`0${suffix}`}</span>;
}

function Reveal({ children, delay = 0, className = "", style }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className} style={style}
      initial={{ opacity: 0, y: 44 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.72, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function TiltCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const rX = useMotionValue(0);
  const rY = useMotionValue(0);
  const srX = useSpring(rX, { stiffness: 300, damping: 28 });
  const srY = useSpring(rY, { stiffness: 300, damping: 28 });
  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    rY.set(((e.clientX - left) / width - 0.5) * 16);
    rX.set(-((e.clientY - top) / height - 0.5) * 16);
  };
  const onLeave = () => { rX.set(0); rY.set(0); };
  return (
    <motion.div ref={ref} className={className}
      style={{ ...style, rotateX: srX, rotateY: srY, transformStyle: "preserve-3d" }}
      onMouseMove={onMove} onMouseLeave={onLeave}
      whileHover={{ scale: 1.03, transition: SPRING }}
    >
      {children}
    </motion.div>
  );
}

function FactList({ items }: { items: typeof PROBLEM_FACTS }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
      {items.map(({ num, phrase }, i) => (
        <motion.div
          key={num}
          className="py-7 flex flex-col gap-3"
          style={{ borderTop: "1px solid #e5e7eb" }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: i * 0.09, ease: EASE_EXPO }}
        >
          <span
            className="text-[10px] font-semibold tracking-[0.25em] tabular-nums"
            style={{ color: "#4d9740" }}
          >
            {num}
          </span>
          <p className="text-[15px] font-semibold text-gray-800 leading-snug">{phrase}</p>
        </motion.div>
      ))}
    </div>
  );
}

function ComparisonCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="relative w-full max-w-[420px]">
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ boxShadow: "0 48px 110px rgba(46,96,39,0.14), 0 10px 40px rgba(0,0,0,0.08)" }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.4 }}
      />

      <motion.div
        className="rounded-2xl overflow-hidden relative"
        style={{ border: "1.5px solid #e5e7eb" }}
        initial={{ opacity: 0, y: 52 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.88, ease: EASE_EXPO }}
      >
        {/* WITHOUT section */}
        <div style={{ background: "#f9f9f9" }}>
          <div className="px-7 pt-7 pb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] uppercase tracking-[0.22em] font-semibold" style={{ color: "#9ca3af" }}>
                Without Origin Disclosure
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#fef2f2", color: "#dc2626" }}>
                Level C
              </span>
            </div>
            <p className="text-sm leading-relaxed italic mb-5" style={{ color: "#9ca3af" }}>
              "Premium authentic Japanese matcha, ceremonial grade experience crafted with care and passion..."
            </p>
            <div className="space-y-2.5">
              {["No source URL provided", "Country of origin not stated", "Cannot be independently verified"].map((t) => (
                <div key={t} className="flex items-center gap-2.5">
                  <span className="text-[11px]" style={{ color: "#fca5a5" }}>✕</span>
                  <span className="text-[12px]" style={{ color: "#d1d5db" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated divider */}
        <div className="relative h-px overflow-hidden">
          <div className="absolute inset-0" style={{ background: "#e5e7eb" }} />
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #4d9740 35%, #7dd56f 55%, #4d9740 75%, transparent 100%)",
              originX: 0,
            }}
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.05, delay: 0.55, ease: EASE }}
          />
        </div>

        {/* WITH section — clip-path reveal */}
        <motion.div
          style={{ background: "#ffffff" }}
          initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
          animate={inView ? { clipPath: "inset(0% 0% 0% 0%)" } : {}}
          transition={{ duration: 0.82, delay: 0.68, ease: EASE_EXPO }}
        >
          <div className="px-7 pt-6 pb-7">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] uppercase tracking-[0.22em] text-matcha-700 font-semibold">
                With Origin Disclosure
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#e6f4e0", color: "#2e6027" }}>
                Level A
              </span>
            </div>
            <div className="rounded-xl p-4 mb-5" style={{ background: "#f2f8f0", borderLeft: "3px solid #4d9740" }}>
              <p className="text-[13px] leading-relaxed italic text-gray-700">
                "Our matcha is sourced exclusively from Uji, Kyoto. Each tin includes the harvest date and garden name."
              </p>
            </div>
            <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-matcha-700">
                <CheckCircle2 size={12} />Official Website
              </div>
              <span className="text-[10px] text-gray-400">Verified Jun 2026</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating verify badge */}
      <motion.div
        className="absolute -right-3 -bottom-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[11px] font-semibold text-matcha-700"
        style={{ boxShadow: "0 8px 28px rgba(46,96,39,0.18), 0 2px 8px rgba(0,0,0,0.07)", border: "1px solid #b3dda6" }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 1.15, ease: EASE_EXPO }}
      >
        <CheckCircle2 size={12} className="text-matcha-500" />
        You can verify this yourself
      </motion.div>
    </div>
  );
}

function PressRow({ card }: { card: typeof PRESS_CARDS[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className="group cursor-pointer"
      style={{ borderBottom: "1px solid #e5e7eb" }}
      onClick={() => setOpen((v) => !v)}
      whileHover={{ backgroundColor: "rgba(0,0,0,0.015)" }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center gap-5 sm:gap-8 py-7 sm:py-9">
        {/* Source icon */}
        <div className="flex-shrink-0">
          {card.type === "video" ? (
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#FF0000" }}>
              <Play size={16} fill="white" className="text-white ml-0.5" />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: card.accent + "14" }}>
              <FileText size={16} style={{ color: card.accent }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {card.flag && <span className="text-sm leading-none">{card.flag}</span>}
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{card.source}</span>
          </div>
          <h3 className="font-semibold text-gray-900 leading-snug" style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)" }}>
            &ldquo;{card.headline}&rdquo;
          </h3>
        </div>

        {/* Arrow / expand toggle */}
        <motion.div
          className="flex-shrink-0 text-gray-300"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </motion.div>
      </div>

      {/* Expandable detail */}
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="overflow-hidden"
      >
        <div className="pb-8 pl-16 sm:pl-[4.75rem] pr-4">
          <p className="text-[15px] text-gray-500 leading-relaxed mb-5 max-w-2xl">
            {card.quote}
          </p>
          <motion.a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: card.accent, textDecoration: "none" }}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {card.type === "video" ? "Watch video" : "Read article"}
            <ArrowRight size={14} />
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SectionLabel({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <Reveal>
      <span className="inline-flex items-center gap-2 text-matcha-700 text-[11px] font-bold tracking-[0.22em] uppercase mb-5">
        <Icon size={10} />{text}
      </span>
    </Reveal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const { scrollY } = useScroll();

  useEffect(() => {
    fetchStats().then((s) => {
      setStats([
        { value: s.total, suffix: "+", label: "Cafes Indexed", sublabel: "& still growing", icon: "map" },
        { value: (s.byLevel.A ?? 0) + (s.byLevel.B ?? 0), suffix: "", label: "Mention Japanese Origin", sublabel: "on their menu or site", icon: "leaf" },
        { value: 2, suffix: "", label: "Cities Covered", sublabel: "Sydney & Melbourne", icon: "cities" },
        { value: s.byLevel.A ?? 0, suffix: "", label: "Name a Specific Source", sublabel: "farm, region or supplier", icon: "file" },
      ]);
    }).catch(() => {/* keep defaults */});
  }, []);
  const heroY = useTransform(scrollY, [0, 700], [0, -140]);
  const heroOpacity = useTransform(scrollY, [0, 480], [1, 0]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[100dvh] flex flex-col items-center justify-center text-center px-5 pt-20 pb-10 overflow-hidden bg-white"
      >
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center"
        >
          {/* Badge — gentle tea-leaf float after entrance */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2.2 }}
            className="mb-10"
          >
            <motion.div
              initial={{ opacity: 0, y: -14, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE_EXPO }}
              className="inline-flex items-center px-5 py-2 rounded-full"
              style={{ background: "#e8ede8", border: "1px solid #d0ddd0" }}
            >
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#5a7a58" }}>
                Sydney & Melbourne
              </span>
            </motion.div>
          </motion.div>

          {/* Headline */}
          <h1 className="font-display tracking-tight text-center mb-12 w-full">

            {/* Lead-in: slides up through clip mask like ink rising */}
            <div className="overflow-hidden mb-5">
              <motion.span
                className="block font-normal"
                style={{ fontSize: "clamp(1rem, 3vw, 1.85rem)", color: "#5a8f3c", letterSpacing: "0.08em", fontWeight: 500 }}
                initial={{ y: "120%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.8, delay: 0.35, ease: EASE_EXPO }}
              >
                Find cafes
              </motion.span>
            </div>

            {/* "honest" — brush-stroke clip sweep left→right + drawn underline */}
            <div className="flex justify-center mb-3">
              <div className="relative inline-block">
                <motion.span
                  className="italic font-bold inline-block"
                  style={{ fontSize: "clamp(4.5rem, 18vw, 10.5rem)", color: "#2e6027", lineHeight: 0.88, letterSpacing: "-0.03em" }}
                  initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
                  animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                  transition={{ duration: 1.05, delay: 0.82, ease: [0.76, 0, 0.24, 1] }}
                >
                  honest
                </motion.span>

                {/* SVG brush underline — draws itself after text is revealed */}
                <svg
                  className="absolute left-0 w-full"
                  style={{ bottom: "-6px", height: "18px" }}
                  viewBox="0 0 100 18"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d="M 1 12 C 15 5, 38 16, 62 11 S 84 6, 99 11"
                    stroke="#4a8a40"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.7, ease: EASE }}
                  />
                </svg>
              </div>
            </div>

            {/* "about matcha." — same brush sweep, slightly delayed */}
            <div className="flex justify-center">
              <motion.span
                className="font-bold inline-block"
                style={{ fontSize: "clamp(3.2rem, 15vw, 9rem)", color: "#1c2b1a", lineHeight: 1, letterSpacing: "-0.03em" }}
                initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                transition={{ duration: 1.05, delay: 1.15, ease: [0.76, 0, 0.24, 1] }}
              >
                about matcha.
              </motion.span>
            </div>
          </h1>

          {/* CTA — spring bounce entrance */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 2.0, ease: EASE_EXPO }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link href="/map" className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-semibold text-white text-sm"
                style={{ background: "#3d6b35" }}
              >
                Explore the map <ArrowRight size={14} />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────── */}
      <section className="py-28 sm:py-36 px-5 bg-white" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="max-w-4xl mx-auto">
          {/* Editorial lead-in */}
          <div className="mb-20">
            <motion.div
              className="flex items-center justify-center gap-3 mb-8"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <div style={{ width: 40, height: 1, background: "#2e6027" }} />
              <span className="uppercase tracking-[0.2em] font-semibold" style={{ fontSize: "0.7rem", color: "#2e6027" }}>
                How it works
              </span>
              <div style={{ width: 40, height: 1, background: "#2e6027" }} />
            </motion.div>

            <motion.h2
              className="text-center font-bold leading-[1.1] tracking-tight"
              style={{ fontSize: "clamp(1.75rem, 5vw, 3.25rem)", color: "#1c2b1a" }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.72, delay: 0.08, ease: EASE }}
            >
              We scan each cafe&apos;s official website
              <br className="hidden sm:block" />
              {" "}and show you{" "}
              <span style={{ color: "#2e6027" }}>exactly what they claim</span>
              <br className="hidden sm:block" />
              {" "}about their matcha sourcing.
            </motion.h2>

            <motion.p
              className="text-center mx-auto mt-6"
              style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)", color: "#9ca3af", maxWidth: "36rem", lineHeight: 1.7 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.72, delay: 0.16, ease: EASE }}
            >
              No opinions, no guesses — just their own words.
            </motion.p>
          </div>

          {/* 2×2 Stats Grid */}
          <motion.div
            className="grid grid-cols-2 rounded-2xl overflow-hidden"
            style={{ border: "1px solid #e5e7eb" }}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.72, delay: 0.1, ease: EASE }}
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="flex flex-col items-center justify-center p-8 sm:p-12 text-center"
                style={{
                  borderRight: i % 2 === 0 ? "1px solid #e5e7eb" : "none",
                  borderBottom: i < 2 ? "1px solid #e5e7eb" : "none",
                }}
              >
                <span
                  className="font-display font-black leading-none mb-3"
                  style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)", color: "#2e6027", letterSpacing: "-0.04em" }}
                >
                  <CountUp to={s.value} suffix={s.suffix} />
                </span>
                <div className="text-sm font-bold text-gray-900 leading-snug mb-1">{s.label}</div>
                <div className="text-xs text-gray-400 leading-snug">{s.sublabel}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── WHY TRANSPARENCY ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "#1a2318" }}>
        {/* Layered ambient glows */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(77,151,64,0.12), transparent 70%)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(ellipse 40% 40% at 85% 90%, rgba(77,151,64,0.08), transparent)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(ellipse 35% 35% at 10% 60%, rgba(77,151,64,0.05), transparent)",
        }} />
        {/* Subtle noise texture via repeating gradient */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }} />

        <div className="relative px-5">

          {/* Top section — headline & subline */}
          <div className="max-w-5xl mx-auto pt-36 sm:pt-44 pb-24 sm:pb-32">

            {/* Eyebrow pill */}
            <motion.div
              className="flex justify-center mb-12"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <span
                className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full uppercase tracking-[0.22em] font-semibold"
                style={{ fontSize: "0.65rem", color: "#6abf5e", background: "rgba(77,151,64,0.1)", border: "1px solid rgba(77,151,64,0.2)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#6abf5e" }} />
                The Problem
              </span>
            </motion.div>

            {/* Massive headline */}
            <motion.h2
              className="text-center font-bold leading-[1.0]"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", color: "#f5f5f0", letterSpacing: "-0.035em" }}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.08, ease: EASE }}
            >
              &ldquo;Premium&rdquo;, &ldquo;ceremonial&rdquo;,
              <br />
              &ldquo;authentic&rdquo; — but from{" "}
              <span className="italic" style={{ color: "#6abf5e" }}>where</span>
              <span style={{ color: "#6abf5e" }}>?</span>
            </motion.h2>

            {/* Subline */}
            <motion.p
              className="text-center mx-auto mt-10"
              style={{ fontSize: "clamp(1.05rem, 2.5vw, 1.35rem)", color: "rgba(255,255,255,0.45)", maxWidth: "44rem", lineHeight: 1.75 }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.72, delay: 0.18, ease: EASE }}
            >
              Australian cafes can label their matcha &ldquo;ceremonial grade&rdquo; or &ldquo;authentic Japanese&rdquo;
              with zero legal obligation to back it up — and no structured way for consumers to verify the claim.
            </motion.p>
          </div>

          {/* Divider line */}
          <div className="max-w-6xl mx-auto">
            <motion.div
              style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent)" }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: EASE }}
            />
          </div>

          {/* Facts — 2×2 grid with large numbers */}
          <div className="max-w-6xl mx-auto py-24 sm:py-32">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 lg:gap-x-24 gap-y-0">
              {PROBLEM_FACTS.map(({ num, phrase, icon: Icon }, i) => (
                <motion.div
                  key={num}
                  className="flex items-start gap-6 sm:gap-8 py-10 sm:py-12"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_EXPO }}
                >
                  {/* Large number */}
                  <span
                    className="font-bold tabular-nums leading-none flex-shrink-0"
                    style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "rgba(77,151,64,0.35)", letterSpacing: "-0.04em", marginTop: "-0.15em" }}
                  >
                    {num}
                  </span>
                  {/* Text */}
                  <div className="flex flex-col gap-3 pt-1">
                    <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 40, height: 40, background: "rgba(77,151,64,0.1)", alignSelf: "flex-start" }}>
                      <Icon size={18} style={{ color: "#4d9740" }} />
                    </div>
                    <p className="font-medium leading-relaxed" style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "rgba(255,255,255,0.88)" }}>
                      {phrase}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Comparison card */}
          <div className="hidden lg:flex items-center justify-center pb-36 sm:pb-44">
            <ComparisonCard />
          </div>

        </div>
      </section>

      {/* ── PRESS PROOF ────────────────────────────────────────────── */}
      <section className="py-28 sm:py-36 px-5" style={{ background: "#fafaf8" }}>
        <div className="max-w-5xl mx-auto">

          {/* Eyebrow */}
          <Reveal>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div style={{ width: 40, height: 1, background: "#d1d5db" }} />
              <span className="uppercase tracking-[0.22em] font-semibold" style={{ fontSize: "0.65rem", color: "#9ca3af" }}>
                As reported by
              </span>
              <div style={{ width: 40, height: 1, background: "#d1d5db" }} />
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <h2
              className="text-center font-bold leading-[1.1] tracking-tight mb-16 sm:mb-20"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", color: "#1c2b1a" }}
            >
              This isn&apos;t speculation —<br className="hidden sm:block" /> it&apos;s already making headlines.
            </h2>
          </Reveal>

          {/* Press list — clean stacked rows */}
          <div className="flex flex-col">
            {PRESS_CARDS.map((card, i) => (
              <Reveal key={card.source} delay={i * 0.08}>
                <PressRow card={card} />
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* ── TRANSPARENCY LEVELS ──────────────────────────────────────── */}
      <section className="relative py-36 sm:py-48 px-5 overflow-hidden" style={{ background: "#f7f7f5" }}>
        {/* Subtle background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.4]" style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />

        <div className="relative max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-24 sm:mb-32">
            <Reveal>
              <div className="flex items-center justify-center gap-3 mb-10">
                <div style={{ width: 40, height: 1, background: "#2e6027" }} />
                <span className="uppercase tracking-[0.22em] font-semibold" style={{ fontSize: "0.65rem", color: "#2e6027" }}>
                  Classification System
                </span>
                <div style={{ width: 40, height: 1, background: "#2e6027" }} />
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <h2
                className="font-bold leading-[1.0] tracking-tight mb-8"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", color: "#1c2b1a", letterSpacing: "-0.035em" }}
              >
                <span style={{ color: "#2e6027" }}>4</span> levels of<br /> transparency
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed" style={{ fontSize: "clamp(1.05rem, 2.5vw, 1.3rem)" }}>
                Based entirely on publicly verifiable evidence.<br className="hidden sm:block" /> We never guess, assume, or rate based on taste.
              </p>
            </Reveal>
          </div>

          {/* 2×2 Level grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {LEVEL_CARDS.map((card, i) => (
              <Reveal key={card.level} delay={i * 0.08}>
                <motion.div
                  className="relative rounded-3xl overflow-hidden bg-white h-full"
                  style={{
                    border: `1px solid ${card.border}`,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                  whileHover={{
                    y: -6,
                    borderColor: card.accent,
                    boxShadow: `0 24px 60px ${card.accent}15, 0 4px 16px rgba(0,0,0,0.06)`,
                  } as any}
                  transition={SPRING}
                >
                  <div className="p-8 sm:p-10">
                    {/* Giant letter + label */}
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-5">
                        <span
                          className="font-bold leading-none"
                          style={{ fontSize: "clamp(3.5rem, 6vw, 5rem)", color: card.accent, letterSpacing: "-0.04em", lineHeight: 0.85 }}
                        >
                          {card.level}
                        </span>
                        <div>
                          <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5" style={{ color: card.accent, opacity: 0.7 }}>
                            Level {card.level}
                          </div>
                          <h3 className="font-bold text-gray-900" style={{ fontSize: "clamp(1.1rem, 2vw, 1.3rem)" }}>
                            {card.title}
                          </h3>
                        </div>
                      </div>
                      {/* Status dot */}
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-2"
                        style={{ background: card.accent, opacity: 0.5 }}
                      />
                    </div>

                    {/* Divider */}
                    <div className="h-px mb-6" style={{ background: `${card.border}` }} />

                    {/* Description */}
                    <p className="text-gray-500 leading-relaxed" style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)" }}>
                      {card.desc}
                    </p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>

          {/* Legal commitment */}
          <Reveal delay={0.3}>
            <motion.div
              className="mt-16 sm:mt-20 rounded-3xl py-10 px-8 sm:px-12 flex flex-col sm:flex-row items-start gap-6 bg-white"
              style={{ border: "1px solid #d4edcc", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #e6f4e0, #d4edcc)" }}>
                <Shield size={22} className="text-matcha-700" />
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-2" style={{ fontSize: "clamp(1.05rem, 2vw, 1.25rem)" }}>
                  Legal commitment: We never say &ldquo;fake&rdquo; or &ldquo;bad&rdquo;.
                </p>
                <p className="text-gray-500 leading-relaxed" style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)" }}>
                  We only report what cafes publicly disclose — or don&apos;t. &ldquo;No disclosure found&rdquo; is a factual observation, not an accusation. Every classification can be independently verified.
                </p>
              </div>
            </motion.div>
          </Reveal>

        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-36 sm:py-48 px-5" style={{ background: "#ffffff" }}>
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-24 sm:mb-32">
            <Reveal>
              <div className="flex items-center justify-center gap-3 mb-10">
                <div style={{ width: 40, height: 1, background: "#2e6027" }} />
                <span className="uppercase tracking-[0.22em] font-semibold" style={{ fontSize: "0.65rem", color: "#2e6027" }}>
                  Process
                </span>
                <div style={{ width: 40, height: 1, background: "#2e6027" }} />
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <h2
                className="font-bold leading-[1.0] tracking-tight mb-8"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", color: "#1c2b1a", letterSpacing: "-0.035em" }}
              >
                How we verify<br /> every cafe
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed" style={{ fontSize: "clamp(1.05rem, 2.5vw, 1.3rem)" }}>
                A strict, repeatable process with zero guesswork.
              </p>
            </Reveal>
          </div>

          {/* Steps — alternating layout */}
          <div className="flex flex-col gap-0">
            {HOW_IT_WORKS.map((item, i) => {
              const Icon = item.icon;
              const isLast = i === HOW_IT_WORKS.length - 1;
              return (
                <Reveal key={item.step} delay={i * 0.08}>
                  <div className="relative flex items-stretch gap-8 sm:gap-14">
                    {/* Timeline rail */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <motion.div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "#f2f8f0", border: "1px solid #d4edcc" }}
                        whileHover={{ scale: 1.1, background: "#e6f4e0", transition: SPRING }}
                      >
                        <Icon size={24} style={{ color: "#2e6027" }} />
                      </motion.div>
                      {!isLast && (
                        <motion.div
                          className="w-px flex-1 my-1"
                          style={{ background: "linear-gradient(to bottom, #d4edcc, #e5e7eb)" }}
                          initial={{ scaleY: 0, originY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pb-16 sm:pb-20 ${isLast ? "pb-0 sm:pb-0" : ""}`}>
                      <span
                        className="font-bold tabular-nums block mb-3"
                        style={{ fontSize: "clamp(0.7rem, 1.2vw, 0.8rem)", color: "#2e6027", letterSpacing: "0.15em" }}
                      >
                        STEP {item.step}
                      </span>
                      <h3
                        className="font-bold text-gray-900 mb-4"
                        style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)", letterSpacing: "-0.02em" }}
                      >
                        {item.title}
                      </h3>
                      <p className="text-gray-500 leading-relaxed max-w-lg" style={{ fontSize: "clamp(1rem, 1.8vw, 1.15rem)" }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── EVIDENCE PREVIEW ─────────────────────────────────────────── */}
      <section className="relative py-28 px-5 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #060e07 0%, #0c1c0d 35%, #162e17 70%, #1e4a1a 100%)" }}
      >
        {/* Ambient glow orbs */}
        {[
          { w: 600, x: "5%",  y: "60%", color: "#1a3d17", dur: 11, d: 0 },
          { w: 480, x: "90%", y: "30%", color: "#2d6025", dur: 14, d: 3 },
        ].map((b, i) => (
          <motion.div key={i} className="absolute rounded-full pointer-events-none"
            style={{ width: b.w, height: b.w, left: b.x, top: b.y, background: b.color, filter: "blur(100px)", opacity: 0.22, transform: "translate(-50%,-50%)" }}
            animate={{ x: [0, 24, -16, 10, 0], y: [0, -18, 16, -8, 0] }}
            transition={{ duration: b.dur, delay: b.d, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        <div className="relative max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: -12 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE }}
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-7"
            >
              <motion.span className="w-1.5 h-1.5 rounded-full bg-matcha-400"
                animate={{ scale: [1, 1.7, 1], opacity: [1, 0.45, 1] }}
                transition={{ duration: 2.2, repeat: Infinity }}
              />
              <span className="text-white/55 text-[11px] font-medium tracking-[0.18em] uppercase">
                Real Evidence · From Our Database
              </span>
            </motion.div>

            <Reveal delay={0.05}>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-5" style={{ letterSpacing: "-0.02em" }}>
                The evidence<br />speaks for itself
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="max-w-md mx-auto text-[17px] leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                Three real classifications from our database — every claim, every source, fully verifiable by anyone.
              </p>
            </Reveal>
          </div>

          {/* App window chrome */}
          <Reveal delay={0.15}>
            <div className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid rgba(255,255,255,0.09)",
                background: "rgba(255,255,255,0.025)",
                boxShadow: "0 48px 140px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Title bar */}
              <div className="flex items-center gap-4 px-5 py-3.5"
                style={{ background: "rgba(255,255,255,0.035)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,95,87,0.55)" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,189,46,0.55)" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "rgba(40,202,66,0.55)" }} />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-2 px-4 py-1 rounded-md"
                    style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <motion.span className="w-1.5 h-1.5 rounded-full bg-matcha-400/70"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2.8, repeat: Infinity }}
                    />
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>matcha-origin.com/map</span>
                  </div>
                </div>
                <div className="w-16" />
              </div>

              {/* Cards grid */}
              <div className="p-5 grid md:grid-cols-3 gap-4">
                {EVIDENCE_CARDS.map((card, i) => (
                  <Reveal key={card.cafe} delay={0.22 + i * 0.1}>
                    <motion.div
                      className="rounded-xl overflow-hidden bg-white"
                      style={{
                        border: `1.5px solid ${card.border}`,
                        boxShadow: `0 8px 40px ${card.glow}, 0 2px 8px rgba(0,0,0,0.1)`,
                      }}
                      whileHover={{
                        y: -6,
                        boxShadow: `0 24px 70px ${card.glow}, 0 4px 20px rgba(0,0,0,0.14)`,
                        transition: SPRING,
                      }}
                    >
                      {/* Level accent strip */}
                      <div className="h-[3px]" style={{ background: card.accent }} />

                      <div className="p-5">
                        {/* Cafe header */}
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div>
                            <div className="font-semibold text-[14px] text-gray-900 leading-tight">{card.cafe}</div>
                            <div className="text-[11px] text-gray-400 mt-0.5">{card.suburb}</div>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5"
                            style={{ background: card.badgeBg, color: card.accent }}
                          >
                            Level {card.level}
                          </span>
                        </div>

                        {/* Quote or no-disclosure */}
                        {card.quote ? (
                          <div className="rounded-lg p-3.5 mb-4" style={{ background: card.badgeBg, borderLeft: `3px solid ${card.accent}` }}>
                            <p className="text-[12px] leading-relaxed italic text-gray-700">"{card.quote}"</p>
                          </div>
                        ) : (
                          <div className="rounded-lg p-3.5 mb-4 flex items-start gap-2.5"
                            style={{ background: "#f9fafb", border: "1px dashed #e5e7eb" }}
                          >
                            <span className="text-[13px] text-gray-300 mt-px leading-none">—</span>
                            <p className="text-[12px] text-gray-400 italic leading-relaxed">
                              No sourcing information found on any public channel.
                            </p>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-end justify-between pt-3.5"
                          style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
                        >
                          <div>
                            <div className="text-[10px] font-medium text-gray-500 leading-tight">{card.source}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">Verified {card.date}</div>
                          </div>
                          {card.level !== "C" && (
                            <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: card.accent }}>
                              <CheckCircle2 size={11} />Evidence found
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          {/* CTA + disclaimer */}
          <div className="flex flex-col items-center gap-5 mt-10">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link href="/map"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-semibold text-white text-sm"
                style={{
                  background: "linear-gradient(135deg, #2d6025, #5aab47)",
                  boxShadow: "0 0 48px rgba(90,171,71,0.38), 0 4px 24px rgba(0,0,0,0.35)",
                }}
              >
                <Map size={15} />Explore all {stats[0].value}+ cafes<ArrowRight size={13} />
              </Link>
            </motion.div>
            <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
              Illustrative examples based on our classification format. Visit the map for live verified data.
            </p>
          </div>

        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-28 px-5 max-w-7xl mx-auto">
        <Reveal>
          <div className="relative rounded-3xl p-12 sm:p-20 text-center overflow-hidden"
            style={{ background: "linear-gradient(145deg, #0a1a0b 0%, #1e4a1a 55%, #2d6025 100%)" }}
          >
            {[
              { x: "8%",  y: "25%", size: 280, color: "#2e6027", dur: 7, d: 0 },
              { x: "85%", y: "65%", size: 220, color: "#4d9740", dur: 9, d: 2 },
            ].map((orb, i) => (
              <motion.div key={i} className="absolute rounded-full pointer-events-none"
                style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y, background: orb.color, filter: "blur(72px)", opacity: 0.3, transform: "translate(-50%, -50%)" }}
                animate={{ scale: [1, 1.22, 0.93, 1.1, 1], opacity: [0.3, 0.38, 0.22, 0.32, 0.3] }}
                transition={{ duration: orb.dur, repeat: Infinity, ease: "easeInOut", delay: orb.d }}
              />
            ))}

            <div className="relative z-10">
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                animate={{ rotate: [0, 6, -4, 3, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <MessageSquarePlus size={28} className="text-matcha-300" />
              </motion.div>

              <h2 className="font-display text-4xl sm:text-6xl font-bold text-white mb-5 leading-tight" style={{ letterSpacing: "-0.02em" }}>
                Know a cafe we missed?
              </h2>
              <p className="max-w-lg mx-auto mb-10 leading-relaxed text-lg" style={{ color: "rgba(255,255,255,0.5)" }}>
                Suggest a cafe or submit sourcing evidence. If the evidence checks out, they'll be added and classified.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                  <Link href="/map" className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-sm text-white"
                    style={{ background: "linear-gradient(135deg, #3a7a30, #6eb35c)", boxShadow: "0 0 44px rgba(110,179,92,0.38), 0 4px 20px rgba(0,0,0,0.3)" }}
                  >
                    <Map size={16} />Open the Map
                  </Link>
                </motion.div>
                <motion.button onClick={() => setAuthOpen(true)}
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-sm border"
                  style={{ color: "rgba(255,255,255,0.72)", borderColor: "rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)" }}
                  whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.95)" } as any}
                  whileTap={{ scale: 0.96 }}
                >
                  Suggest a Cafe<ArrowRight size={14} />
                </motion.button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} className="py-10 px-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2e6027, #6eb35c)" }}>
              <Leaf size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">MatchaScope</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 MatchaScope. All classifications based on publicly verifiable evidence.</p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <span key={l} className="text-xs text-gray-400 hover:text-matcha-700 cursor-pointer transition-colors">{l}</span>
            ))}
          </div>
        </div>
      </footer>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab="signup" />
    </div>
  );
}
