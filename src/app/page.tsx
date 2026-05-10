"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Leaf, Map, Shield, Search, ArrowRight, CheckCircle2,
  Star, Quote, TrendingUp, Eye, FileText, MessageSquarePlus
} from "lucide-react";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";

const STATS = [
  { value: "16", label: "Cafes Mapped" },
  { value: "7", label: "Level A Verified" },
  { value: "2", label: "Cities Covered" },
  { value: "100%", label: "Evidence-Backed" },
];

const LEVEL_CARDS = [
  {
    level: "A",
    title: "Verified Japanese Disclosure",
    desc: "Publicly states Japanese origin, prefecture, or direct sourcing with evidence URL.",
    bg: "#e6f4e0",
    color: "#2e6027",
    dot: "#4d9740",
  },
  {
    level: "B",
    title: "Japanese Matcha Mentioned",
    desc: "References 'Japanese matcha' but no specific region, farm, or supplier named.",
    bg: "#eef7e9",
    color: "#3a7a30",
    dot: "#6eb35c",
  },
  {
    level: "C",
    title: "No Origin Disclosure",
    desc: "Serves matcha but provides no public sourcing information on any channel.",
    bg: "#f3f4f6",
    color: "#6b7280",
    dot: "#9ca3af",
  },
  {
    level: "D",
    title: "Insufficient Information",
    desc: "Could not verify enough information across website, menu, or social media.",
    bg: "#fafafa",
    color: "#9ca3af",
    dot: "#d1d5db",
  },
];

const HOW_IT_WORKS = [
  {
    icon: Search,
    step: "01",
    title: "We Discover Cafes",
    desc: "We scan Google Maps, Instagram, Broadsheet, and more to build a comprehensive list of matcha cafes in Sydney & Melbourne.",
  },
  {
    icon: FileText,
    step: "02",
    title: "We Verify Evidence",
    desc: "Every claim is cross-checked against official websites, menu pages, about sections, and public social media. No guessing allowed.",
  },
  {
    icon: Shield,
    step: "03",
    title: "We Classify Transparently",
    desc: "Each cafe receives a level A–D based solely on publicly verifiable evidence — never opinion or taste tests.",
  },
  {
    icon: Eye,
    step: "04",
    title: "You See the Evidence",
    desc: "Every listing shows the exact quote, source URL, and verification date. You can check it yourself.",
  },
];

const TESTIMONIALS = [
  {
    name: "Aiko Murakami",
    role: "Matcha Enthusiast, Sydney",
    text: "I've been looking for exactly this. I always wanted to know which cafes actually use Japanese matcha — not just market it.",
    rating: 5,
  },
  {
    name: "James Thornton",
    role: "Food Writer, Melbourne",
    text: "The evidence panel is brilliant. I can see the exact source quote and go verify it myself. This is what transparency looks like.",
    rating: 5,
  },
  {
    name: "Priya Nair",
    role: "Wellness Coach, Sydney",
    text: "As someone who cares deeply about sourcing, this map is a game changer. Finally a resource that doesn't just take cafes at their word.",
    rating: 5,
  },
];

export default function HomePage() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-20 pb-16 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d1f0e 0%, #1a3a1c 45%, #2a5523 100%)" }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] pointer-events-none"
          style={{ background: "#4d9740" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-[120px] pointer-events-none"
          style={{ background: "#6eb35c" }}
        />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-matcha-600/40 bg-matcha-900/50 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-matcha-400 animate-pulse-slow" />
          <span className="text-matcha-300 text-xs font-medium tracking-wide">Sydney & Melbourne — May 2026</span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight max-w-4xl mb-6 text-balance">
          Find cafes that are{" "}
          <span
            className="italic"
            style={{ color: "#97cc86" }}
          >
            honest
          </span>{" "}
          about their matcha.
        </h1>

        <p className="text-lg text-white/60 max-w-xl leading-relaxed mb-10">
          The first evidence-backed transparency map for Japanese matcha in Australia. Every listing is verified against public sources — no guessing, no marketing fluff.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
          <Link
            href="/map"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-white text-sm transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #3a7a30, #6eb35c)",
              boxShadow: "0 4px 24px rgba(78,151,64,0.45)",
            }}
          >
            <Map size={17} />
            Explore the Map
            <ArrowRight size={15} />
          </Link>
          <button
            onClick={() => setAuthOpen(true)}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm border transition-all hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.2)" }}
          >
            <Leaf size={16} />
            Create free account
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden max-w-2xl w-full mx-auto"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center py-5 px-4" style={{ background: "rgba(0,0,0,0.2)" }}>
              <span className="font-display text-3xl font-bold text-white">{s.value}</span>
              <span className="text-xs text-white/50 mt-1 text-center">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-white text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-10 bg-white/30 animate-pulse-slow" />
        </div>
      </section>

      {/* ── WHY TRANSPARENCY ─────────────────────────────────────────── */}
      <section className="py-24 px-5 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-matcha-700 text-xs font-semibold tracking-widest uppercase mb-4">
              <Leaf size={12} />
              The Problem
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6 text-balance">
              "Premium", "ceremonial", "authentic" — but from{" "}
              <span className="italic text-matcha-700">where</span>?
            </h2>
            <p className="text-gray-500 leading-relaxed mb-5">
              Australian cafes are not legally required to display the country of origin for menu items. Terms like "ceremonial grade" and "authentic Japanese matcha" are used freely — with no verification required.
            </p>
            <p className="text-gray-500 leading-relaxed mb-8">
              The result? Consumers who genuinely care about sourcing have no structured way to find cafes that publicly disclose where their matcha actually comes from.
            </p>
            <div className="space-y-3">
              {[
                "No Australian law mandates matcha origin disclosure on menus",
                '"Ceremonial grade" has no legal definition in Australia',
                "Many cafes use Chinese-sourced matcha marketed as Japanese",
                "Consumers currently rely entirely on trust — not evidence",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={17} className="text-matcha-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual card stack */}
          <div className="relative h-96 flex items-center justify-center">
            {/* Background card */}
            <div
              className="absolute w-72 h-44 rounded-2xl rotate-6 opacity-40"
              style={{ background: "#e0f0d8", top: "10%", left: "5%" }}
            />
            {/* Middle card */}
            <div
              className="absolute w-72 h-44 rounded-2xl -rotate-2 shadow-card"
              style={{ background: "#fff", top: "20%", left: "12%" }}
            >
              <div className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Without Matcha Origin</div>
                <div className="text-sm text-gray-700 italic leading-relaxed">
                  "Premium authentic Japanese matcha, ceremonial grade experience..."
                </div>
                <div className="mt-3 text-xs text-gray-400">❌ No source. No evidence. No verification date.</div>
              </div>
            </div>
            {/* Front card */}
            <div
              className="absolute w-72 rounded-2xl shadow-card-hover"
              style={{ background: "#fff", border: "1.5px solid #c2e1b5", top: "35%", left: "20%" }}
            >
              <div className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-matcha-700 mb-2">With Matcha Origin</div>
                <div
                  className="text-xs rounded-xl p-3 mb-3 italic leading-relaxed"
                  style={{ background: "#f2f8f0", borderLeft: "3px solid #4d9740", color: "#374151" }}
                >
                  "Our matcha is sourced exclusively from Uji, Kyoto. Each tin includes the harvest date and garden name."
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-matcha-700 font-medium">✓ Official Website</span>
                  <span className="text-gray-400">Verified May 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRANSPARENCY LEVELS ──────────────────────────────────────── */}
      <section className="py-24 px-5" style={{ background: "#f9f7f2" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-matcha-700 text-xs font-semibold tracking-widest uppercase mb-4">
              <TrendingUp size={12} />
              Classification System
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Four levels of transparency
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-balance">
              Based entirely on publicly verifiable evidence. We never guess, assume, or rate based on taste.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LEVEL_CARDS.map((card) => (
              <div
                key={card.level}
                className="rounded-2xl p-6 transition-all hover:shadow-card-hover hover:-translate-y-0.5"
                style={{ background: card.bg }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-white text-lg"
                    style={{ background: card.color }}
                  >
                    {card.level}
                  </div>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: card.dot }}
                  />
                </div>
                <h3 className="font-semibold text-base mb-2" style={{ color: card.color }}>
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: `${card.color}99` }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl p-6 border border-matcha-200 bg-white flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Shield size={22} className="text-matcha-700 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">Legal commitment: We never say "fake" or "bad".</p>
              <p className="text-sm text-gray-500">
                We only report what cafes publicly disclose — or don't. "No disclosure found" is a factual observation, not an accusation. Every classification can be independently verified.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-5 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 text-matcha-700 text-xs font-semibold tracking-widest uppercase mb-4">
            <Eye size={12} />
            Process
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How we verify every cafe
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            A strict, repeatable process with zero guesswork.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative">
                <div className="text-[10px] text-matcha-500 font-bold tracking-widest mb-4">{item.step}</div>
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "#e6f4e0" }}
                >
                  <Icon size={20} className="text-matcha-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="py-24 px-5" style={{ background: "#f9f7f2" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-matcha-700 text-xs font-semibold tracking-widest uppercase mb-4">
              <Star size={12} />
              Early Feedback
            </span>
            <h2 className="font-display text-4xl font-bold text-gray-900">
              What matcha lovers are saying
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-card">
                <Quote size={22} className="text-matcha-300 mb-4" />
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={13} className="text-matcha-500 fill-matcha-500" />
                  ))}
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-800">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUGGEST A CAFE ───────────────────────────────────────────── */}
      <section className="py-24 px-5 max-w-7xl mx-auto">
        <div
          className="rounded-3xl p-10 sm:p-16 text-center"
          style={{ background: "linear-gradient(135deg, #0f2010 0%, #2a5523 100%)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <MessageSquarePlus size={26} className="text-matcha-300" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4 text-balance">
            Know a cafe we missed?
          </h2>
          <p className="text-white/60 max-w-md mx-auto mb-8 leading-relaxed">
            Suggest a cafe or submit sourcing evidence. If the evidence checks out, they'll be added and classified. You make the database better for everyone.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm text-white"
              style={{
                background: "linear-gradient(135deg, #3a7a30, #6eb35c)",
                boxShadow: "0 4px 24px rgba(78,151,64,0.4)",
              }}
            >
              <Map size={16} />
              Open the Map
            </Link>
            <button
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm border transition-all hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.8)", borderColor: "rgba(255,255,255,0.2)" }}
            >
              Suggest a Cafe
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-10 px-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #2e6027, #6eb35c)" }}
            >
              <Leaf size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Matcha Origin</span>
          </div>
          <p className="text-xs text-gray-400">
            © 2026 Matcha Origin. All classifications based on publicly verifiable evidence.
          </p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <span key={l} className="text-xs text-gray-400 hover:text-matcha-700 cursor-pointer transition-colors">
                {l}
              </span>
            ))}
          </div>
        </div>
      </footer>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab="signup" />
    </div>
  );
}
