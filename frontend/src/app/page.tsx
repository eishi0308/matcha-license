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
  Star, Quote, TrendingUp, Eye, FileText, MessageSquarePlus,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";

// ── Constants ──────────────────────────────────────────────────────────────

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const EASE_EXPO = [0.16, 1, 0.3, 1] as const;
const SPRING = { type: "spring" as const, stiffness: 300, damping: 28 };

// ── Data ──────────────────────────────────────────────────────────────────

const STATS = [
  { value: 823, suffix: "+", label: "Cafes Indexed", sublabel: "& still growing", icon: "map" },
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

const HOW_IT_WORKS = [
  { icon: Search,   step: "01", title: "We Discover Cafes",        desc: "We scan Google Maps, Instagram, Broadsheet, and more to build a comprehensive list of matcha cafes in Sydney & Melbourne." },
  { icon: FileText, step: "02", title: "We Verify Evidence",       desc: "Every claim is cross-checked against official websites, menu pages, about sections, and public social media. No guessing allowed." },
  { icon: Shield,   step: "03", title: "We Classify Transparently",desc: "Each cafe receives a level A–D based solely on publicly verifiable evidence — never opinion or taste tests." },
  { icon: Eye,      step: "04", title: "You See the Evidence",     desc: "Every listing shows the exact quote, source URL, and verification date. You can check it yourself." },
];

const TESTIMONIALS = [
  { name: "Aiko M.", role: "Matcha Enthusiast, Sydney",  text: "I always wanted to know which cafes actually use Japanese matcha — not just market it. This is exactly what I needed.", rating: 5, initials: "AM", color: "#4d9740" },
  { name: "James T.", role: "Food Writer, Melbourne",     text: "The evidence panel is brilliant. I can see the exact source quote and go verify it myself. This is what transparency looks like.", rating: 5, initials: "JT", color: "#2e6027" },
  { name: "Priya N.", role: "Wellness Coach, Sydney",     text: "Finally a resource that doesn't take cafes at their word. This map is a game changer for sourcing-conscious people.", rating: 5, initials: "PN", color: "#6eb35c" },
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
      duration: 1.8,
      ease: "easeOut",
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
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 700], [0, -140]);
  const heroOpacity = useTransform(scrollY, [0, 480], [1, 0]);

  return (
    <div className="min-h-screen bg-cream-50 overflow-x-hidden">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        className="relative h-[100dvh] flex flex-col items-center justify-center text-center px-5 pt-20 pb-6 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #060e07 0%, #0c1c0d 30%, #162e17 62%, #1e4a1a 100%)" }}
      >
        {/* Animated glow orbs */}
        {[
          { w: 720, x: "-8%",  y: "8%",  color: "#1a3d17", dur: 9,  d: 0 },
          { w: 540, x: "68%",  y: "52%", color: "#306628", dur: 13, d: 2 },
          { w: 420, x: "42%",  y: "78%", color: "#0d2a0e", dur: 16, d: 5 },
        ].map((b, i) => (
          <motion.div key={i} className="absolute rounded-full pointer-events-none"
            style={{ width: b.w, height: b.w, left: b.x, top: b.y, background: b.color, filter: "blur(96px)", opacity: 0.28, transform: "translate(-50%, -50%)" }}
            animate={{ x: [0, 28, -18, 12, 0], y: [0, -22, 20, -10, 0], scale: [1, 1.05, 0.96, 1.03, 1] }}
            transition={{ duration: b.dur, delay: b.d, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-7xl mx-auto h-full flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 items-center justify-center px-2"
        >
          {/* ── LEFT: copy ── */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.65, ease: EASE }}
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6"
            >
              <motion.span className="w-1.5 h-1.5 rounded-full bg-matcha-400"
                animate={{ scale: [1, 1.7, 1], opacity: [1, 0.45, 1] }}
                transition={{ duration: 2.2, repeat: Infinity }}
              />
              <span className="text-white/55 text-[11px] font-medium tracking-[0.18em] uppercase">
                Sydney & Melbourne
              </span>
            </motion.div>

            {/* Headline */}
            <h1
              className="font-display font-bold text-white leading-[0.9] tracking-tight mb-6"
              style={{ fontSize: "clamp(2.6rem, 5.5vw, 5.5rem)", perspective: "800px" }}
            >
              <div className="mb-1 overflow-visible">
                <SplitWords text="Find cafes that are" delay={0.25} />
              </div>
              <div className="overflow-visible">
                <motion.span className="inline-block italic" style={{ color: "#7dd56f" }}
                  initial={{ opacity: 0, y: 80, rotateX: -20 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.85, delay: 0.75, ease: EASE_EXPO }}
                >
                  honest&nbsp;
                </motion.span>
                <SplitWords text="about matcha." delay={0.82} />
              </div>
            </h1>

            {/* Sub-headline */}
            <motion.p
              className="text-base sm:text-lg max-w-lg leading-relaxed mb-8"
              style={{ color: "rgba(255,255,255,0.52)" }}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 1.15, ease: EASE }}
            >
              We scan each cafe's official website and show you exactly what they publicly claim about their matcha sourcing — no opinions, no guesses, just their own words.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row items-center lg:items-start gap-3"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 1.3, ease: EASE }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Link href="/map" className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-semibold text-white text-sm"
                  style={{ background: "linear-gradient(135deg, #2d6025, #5aab47)", boxShadow: "0 0 48px rgba(90,171,71,0.42), 0 4px 24px rgba(0,0,0,0.35)" }}
                >
                  <Map size={16} />Explore the Map<ArrowRight size={14} />
                </Link>
              </motion.div>
              <motion.button onClick={() => setAuthOpen(true)}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-semibold text-sm border"
                style={{ color: "rgba(255,255,255,0.78)", borderColor: "rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.05)" }}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.28)" } as any}
                whileTap={{ scale: 0.96 }}
              >
                <Leaf size={15} />Create free account
              </motion.button>
            </motion.div>
          </div>

          {/* ── RIGHT: stats 2×2 ── */}
          <motion.div
            className="grid grid-cols-2 gap-3 w-full mt-10 lg:mt-0"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.4, ease: EASE }}
          >
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                className="flex flex-col justify-between p-6 rounded-3xl"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(16px)",
                  aspectRatio: "1 / 1",
                }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.5 + i * 0.1, ease: EASE }}
                whileHover={{ background: "rgba(255,255,255,0.09)", borderColor: "rgba(255,255,255,0.18)" } as any}
              >
                {/* icon top-left */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                  {s.icon === "map"    && <Map       size={17} className="text-white/70" />}
                  {s.icon === "leaf"   && <Leaf      size={17} className="text-white/70" />}
                  {s.icon === "cities" && <TrendingUp size={17} className="text-white/70" />}
                  {s.icon === "file"   && <FileText  size={17} className="text-white/70" />}
                </div>

                {/* number centre */}
                <span
                  className="font-display font-black text-white leading-none"
                  style={{ fontSize: "clamp(2.8rem, 5vw, 4.5rem)", letterSpacing: "-0.04em" }}
                >
                  <CountUp to={s.value} suffix={s.suffix} />
                </span>

                {/* labels bottom */}
                <div>
                  <div className="text-[15px] font-semibold text-white/90 leading-snug">{s.label}</div>
                  <div className="text-[13px] mt-1 leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>{s.sublabel}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }} animate={{ opacity: 0.32 }} transition={{ delay: 2.2, duration: 1 }}
        >
          <span className="text-white text-[9px] tracking-[0.35em] uppercase">Scroll</span>
          <motion.div className="w-px bg-white/40" initial={{ height: 0 }} animate={{ height: 40 }} transition={{ delay: 2.4, duration: 0.6 }} />
        </motion.div>
      </section>

      {/* ── WHY TRANSPARENCY ──────────────────────────────────────────── */}
      <section className="py-28 px-5 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <SectionLabel icon={Leaf} text="The Problem" />
            <Reveal delay={0.05}>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6" style={{ letterSpacing: "-0.02em" }}>
                "Premium", "ceremonial",<br />"authentic" — but from{" "}
                <span className="italic text-matcha-700">where</span>?
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-gray-500 leading-relaxed mb-5 text-[17px]">
                Australian cafes are not legally required to display the country of origin for menu items.
                Terms like "ceremonial grade" and "authentic Japanese matcha" are used freely — with no verification required.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="text-gray-500 leading-relaxed mb-10 text-[17px]">
                Consumers who genuinely care about sourcing have no structured way to find cafes that
                publicly disclose where their matcha actually comes from.
              </p>
            </Reveal>
            <div className="space-y-4">
              {[
                "No Australian law mandates matcha origin disclosure on menus",
                '"Ceremonial grade" has no legal definition in Australia',
                "Many cafes use Chinese-sourced matcha marketed as Japanese",
                "Consumers currently rely entirely on trust — not evidence",
              ].map((item, i) => (
                <Reveal key={item} delay={0.18 + i * 0.07}>
                  <div className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#e6f4e0" }}>
                      <CheckCircle2 size={11} className="text-matcha-700" />
                    </div>
                    <span className="text-sm text-gray-600 leading-relaxed">{item}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Floating card comparison */}
          <div className="relative h-[460px] flex items-center justify-center" style={{ perspective: "1000px" }}>
            <Reveal delay={0.2} className="absolute" style={{ top: "4%", left: "0%", zIndex: 1 }}>
              <motion.div className="w-80 rounded-2xl"
                style={{ background: "#f7f7f7", border: "1px solid #e8e8e8", rotate: "6deg", opacity: 0.62 }}
              >
                <div className="p-6">
                  <div className="text-[9px] uppercase tracking-[0.22em] text-gray-400 mb-3">Without Origin Disclosure</div>
                  <div className="text-sm text-gray-500 italic leading-relaxed mb-4">"Premium authentic Japanese matcha, ceremonial grade experience..."</div>
                  <div className="text-xs text-red-400/60 flex items-center gap-1.5"><span>✕</span> No source · No evidence · No verification date</div>
                </div>
              </motion.div>
            </Reveal>

            <Reveal delay={0.35} className="absolute" style={{ top: "26%", left: "13%", zIndex: 2 }}>
              <motion.div className="w-80 rounded-2xl"
                style={{ background: "#fff", border: "1.5px solid #b3dda6", boxShadow: "0 24px 64px rgba(46,96,39,0.14), 0 4px 20px rgba(0,0,0,0.08)" }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[9px] uppercase tracking-[0.22em] text-matcha-700 font-semibold">With Origin Disclosure</div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#e6f4e0", color: "#2e6027" }}>Level A</span>
                  </div>
                  <div className="text-xs leading-relaxed italic p-3.5 rounded-xl mb-4"
                    style={{ background: "#f2f8f0", borderLeft: "3px solid #4d9740", color: "#374151" }}
                  >
                    "Our matcha is sourced exclusively from Uji, Kyoto. Each tin includes the harvest date and garden name."
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-matcha-700 font-semibold">✓ Official Website</span>
                    <span style={{ color: "rgba(107,114,128,0.65)" }}>Verified</span>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── TRANSPARENCY LEVELS ──────────────────────────────────────── */}
      <section className="py-28 px-5" style={{ background: "#f8f6f1" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel icon={TrendingUp} text="Classification System" />
            <Reveal delay={0.05}>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-5" style={{ letterSpacing: "-0.02em" }}>
                <span style={{ color: "#4a9a3a", fontFeatureSettings: '"lnum" 1' }}>4</span> levels of transparency
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-gray-500 max-w-xl mx-auto text-[17px] leading-relaxed">
                Based entirely on publicly verifiable evidence. We never guess, assume, or rate based on taste.
              </p>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LEVEL_CARDS.map((card, i) => (
              <Reveal key={card.level} delay={i * 0.09} className="h-full">
                <TiltCard className="h-full rounded-2xl p-6 cursor-default bg-white"
                  style={{ border: `1.5px solid ${card.border}`, boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-white text-lg" style={{ background: card.accent }}>
                      {card.level}
                    </div>
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full" style={{ background: card.badgeBg, color: card.accent }}>
                      Level {card.level}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[15px] mb-3" style={{ color: card.accent }}>{card.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{card.desc}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.28} className="mt-8">
            <div className="rounded-2xl p-6 border border-matcha-200 bg-white flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#e6f4e0" }}>
                <Shield size={18} className="text-matcha-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Legal commitment: We never say "fake" or "bad".</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We only report what cafes publicly disclose — or don't. "No disclosure found" is a factual observation, not an accusation. Every classification can be independently verified.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-5 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel icon={Eye} text="Process" />
          <Reveal delay={0.05}>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-5" style={{ letterSpacing: "-0.02em" }}>
              How we verify every cafe
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-gray-500 max-w-xl mx-auto text-[17px]">A strict, repeatable process with zero guesswork.</p>
          </Reveal>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {HOW_IT_WORKS.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.step} delay={i * 0.09}>
                <motion.div whileHover={{ y: -7, transition: SPRING }}>
                  <div className="text-[10px] text-matcha-500 font-bold tracking-[0.28em] mb-5">{item.step}</div>
                  <motion.div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: "linear-gradient(135deg, #e6f4e0, #d4edcc)" }}
                    whileHover={{ rotate: 8, scale: 1.12, transition: SPRING }}
                  >
                    <Icon size={20} className="text-matcha-700" />
                  </motion.div>
                  <h3 className="font-semibold text-gray-900 mb-2.5 text-[15px]">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="py-28 px-5" style={{ background: "#f8f6f1" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel icon={Star} text="Early Feedback" />
            <Reveal delay={0.05}>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900" style={{ letterSpacing: "-0.02em" }}>
                What matcha lovers are saying
              </h2>
            </Reveal>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.11}>
                <motion.div
                  className="bg-white rounded-2xl p-7 h-full flex flex-col"
                  style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}
                  whileHover={{ y: -8, boxShadow: "0 20px 60px rgba(0,0,0,0.11)", transition: SPRING }}
                >
                  <Quote size={22} className="text-matcha-200 mb-5" />
                  <p className="text-gray-600 text-[15px] leading-relaxed mb-6 flex-1 italic">"{t.text}"</p>
                  <div>
                    <div className="flex items-center gap-0.5 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} size={12} className="text-matcha-500 fill-matcha-500" />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: t.color }}>
                        {t.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-gray-800">{t.name}</div>
                        <div className="text-xs text-gray-400">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
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
            <span className="text-sm font-semibold text-gray-700">Matcha Origin</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 Matcha Origin. All classifications based on publicly verifiable evidence.</p>
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
