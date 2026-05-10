"use client";

import { X, ExternalLink, MapPin, Calendar, Quote, Shield, Tag, Star } from "lucide-react";
import { Cafe, levelConfig } from "@/data/cafes";

interface Props {
  cafe: Cafe | null;
  onClose: () => void;
}

const PRICE_LABEL = { "$": "Budget", "$$": "Mid-range", "$$$": "Premium" };

export default function CafeDetailPanel({ cafe, onClose }: Props) {
  if (!cafe) return null;
  const level = levelConfig[cafe.level];

  return (
    <div
      className="h-full flex-shrink-0 flex border-l border-gray-100"
      style={{ width: "clamp(320px, 38%, 460px)" }}
    >
      <div className="flex-1 bg-white shadow-[-8px_0_40px_rgba(0,0,0,0.1)] overflow-y-auto">
        {/* Colour header */}
        <div
          className="relative h-40 flex flex-col justify-end p-5"
          style={{
            background: `linear-gradient(160deg, ${cafe.coverColor}dd 0%, ${cafe.coverColor} 100%)`,
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/35 transition-colors"
          >
            <X size={16} className="text-white" />
          </button>

          {/* Level badge */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#fff" }}
              />
              Level {cafe.level} — {level.shortLabel}
            </span>
          </div>

          <h2 className="text-white font-display text-xl font-bold leading-snug">{cafe.name}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin size={12} className="text-white/70" />
            <span className="text-white/70 text-xs">{cafe.suburb}, {cafe.city}</span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed">{cafe.description}</p>

          {/* Meta row */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
              <Tag size={11} />
              {cafe.type.charAt(0).toUpperCase() + cafe.type.slice(1)}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
              <Star size={11} />
              {cafe.priceRange} — {PRICE_LABEL[cafe.priceRange]}
            </span>
          </div>

          {/* Specialties */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">Specialties</div>
            <div className="flex flex-wrap gap-1.5">
              {cafe.specialties.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: "#e6f4e0", color: "#2e6027" }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Evidence panel */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-matcha-700" />
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Transparency Evidence</div>
            </div>

            {cafe.evidence ? (
              <div className="rounded-2xl border border-matcha-200 overflow-hidden">
                {/* Quote */}
                <div className="p-4" style={{ background: "#f2f8f0" }}>
                  <Quote size={16} className="text-matcha-400 mb-2" />
                  <p className="text-sm text-gray-700 italic leading-relaxed">
                    "{cafe.evidence.quote}"
                  </p>
                </div>

                {/* Source meta */}
                <div className="p-4 space-y-2" style={{ borderTop: "1px solid #c2e1b5" }}>
                  <div className="flex items-center gap-2">
                    <ExternalLink size={12} className="text-matcha-600 flex-shrink-0" />
                    <span className="text-xs text-gray-500">{cafe.evidence.sourceLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-matcha-600 flex-shrink-0" />
                    <span className="text-xs text-gray-500">Verified {cafe.evidence.verifiedDate}</span>
                  </div>
                  <a
                    href={cafe.evidence.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-matcha-700 hover:text-matcha-900 transition-colors mt-1"
                  >
                    View source
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                <p className="text-sm text-gray-400 italic">
                  No public Japanese-origin disclosure found across website, menu, or official social media.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Last checked: {new Date().toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
                </p>
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">Address</div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600">{cafe.address}</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-2 pt-1">
            {cafe.website && (
              <a
                href={`https://${cafe.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={13} />
                Website
              </a>
            )}
            {cafe.instagram && (
              <a
                href={`https://instagram.com/${cafe.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
                </svg>
                Instagram
              </a>
            )}
          </div>

          {/* Suggest update */}
          <button className="w-full py-2.5 rounded-xl text-xs font-medium text-matcha-700 border border-matcha-200 hover:bg-matcha-50 transition-colors">
            Suggest an update to this listing
          </button>
        </div>
      </div>
    </div>
  );
}
