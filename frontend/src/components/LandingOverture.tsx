"use client";

/**
 * Landing "overture" — the full-height sequence that plays before the existing
 * page. Built to the Marketplace/Directory pattern (search is the CTA, show the
 * inventory, prove the claim) in an Exaggerated Minimalism style: oversized
 * type, high contrast, generous negative space.
 *
 * Every animation here is framer-motion (already a dependency) and every one of
 * them is disabled under prefers-reduced-motion.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useReducedMotion,
  animate,
  AnimatePresence,
} from "framer-motion";
import { Search, ArrowRight, ArrowDown, MapPin, Quote, ShieldCheck, ExternalLink } from "lucide-react";
import { Cafe } from "@/data/cafes";

const EASE_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_OUT  = [0.25, 0.46, 0.45, 0.94] as const;

interface Props {
  stats: {
    total: number;
    byLevel: Record<string, number>;
    assessable: number;
    sydney: number;
    melbourne: number;
  } | null;
  verified: Cafe[];
}

/* ────────────────────────────────────────────────────────────── primitives ── */

/** Headline that assembles itself character by character. */
function SplitHeadline({
  text,
  className = "",
  delay = 0,
  style,
}: {
  text: string;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  // Split to words first, then to characters *inside* each word. Splitting
  // straight to characters lets a line wrap mid-word ("matc / ha.").
  const words = useMemo(() => text.split(" "), [text]);

  if (reduce) return <span className={className} style={style}>{text}</span>;

  let index = 0;

  return (
    <motion.span
      className={className}
      style={style}
      initial="hidden"
      animate="show"
      aria-label={text}
      variants={{ show: { transition: { staggerChildren: 0.018, delayChildren: delay } } }}
    >
      {words.map((word, w) => (
        // The space sits *outside* the nowrap wrapper: inside it, a trailing
        // space is collapsed away and the words run together ("Findcafes").
        <Fragment key={`${word}-${w}`}>
          <span className="inline-block whitespace-nowrap" aria-hidden>
            {Array.from(word).map((c) => (
              <motion.span
                key={`${c}-${index++}`}
                className="inline-block"
                variants={{
                  hidden: { opacity: 0, y: "0.35em", rotateX: -55 },
                  show:   { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.65, ease: EASE_EXPO } },
                }}
              >
                {c}
              </motion.span>
            ))}
          </span>
          {w < words.length - 1 && " "}
        </Fragment>
      ))}
    </motion.span>
  );
}

/** Counts up to `value` the first time it scrolls into view. */
function Counter({ value, className = "" }: { value: number; className?: string }) {
  const ref     = useRef<HTMLSpanElement>(null);
  const inView  = useInView(ref, { once: true, margin: "-15%" });
  const reduce  = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setShown(value); return; }
    const controls = animate(0, value, {
      duration: 1.5,
      ease: EASE_EXPO,
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {shown.toLocaleString()}
    </span>
  );
}

/** Button that leans toward the cursor. */
function Magnetic({
  children,
  strength = 0.35,
  className = "inline-block",
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref    = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x, y }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
}

/** Reveals its children on scroll, wiping upward from a clipped baseline. */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.75, ease: EASE_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────────────────────────────────────────────── act one ── */

function Hero({ stats }: { stats: Props["stats"] }) {
  const router  = useRouter();
  const reduce  = useReducedMotion();
  const ref     = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const headlineY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "38%"]);
  const fade      = useTransform(scrollYProgress, [0, 0.75], [1, reduce ? 1 : 0]);
  const glowY     = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-22%"]);

  const total    = stats?.total ?? 1147;
  const verified = stats?.byLevel?.A ?? 86;

  const go = (q: string) => router.push(q.trim() ? `/map?q=${encodeURIComponent(q.trim())}` : "/map");

  // "Verified only" is a level filter, not a text search — it needs its own route
  const chips: { label: string; href: string }[] = [
    { label: "Surry Hills",   href: "/map?q=Surry%20Hills" },
    { label: "Uji",           href: "/map?q=Uji" },
    { label: "Melbourne",     href: "/map?q=Melbourne" },
    { label: "Verified only", href: "/map?level=A" },
  ];

  return (
    <section
      ref={ref}
      className="relative min-h-[100dvh] flex flex-col items-center justify-center px-5 pt-20 pb-14 overflow-hidden"
    >
      {/* Parallax ground — three layers, slowest at the back */}
      <motion.div aria-hidden className="absolute inset-0 -z-10" style={{ y: glowY }}>
        <div
          className="absolute left-1/2 top-[18%] h-[560px] w-[900px] max-w-[130vw] -translate-x-1/2 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(110,179,92,0.20), transparent 72%)" }}
        />
        <div
          className="absolute left-1/2 top-[42%] h-[420px] w-[620px] max-w-[110vw] -translate-x-1/2 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(46,96,39,0.13), transparent 70%)" }}
        />
      </motion.div>

      <motion.div style={{ y: headlineY, opacity: fade }} className="w-full max-w-4xl mx-auto text-center">
        {/* Eyebrow */}
        <motion.div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
          style={{ background: "#f2f8f0", border: "1px solid #c2e1b5" }}
          initial={reduce ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-matcha-500"
            animate={reduce ? {} : { opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-[16px] font-semibold tracking-widest uppercase text-matcha-700">
            Sydney &amp; Melbourne
          </span>
        </motion.div>

        {/* Statement */}
        <h1 className="font-display font-bold leading-[0.92] tracking-tight text-gray-900"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", perspective: 800 }}>
          <SplitHeadline text="Find cafes" />
          <br />
          <SplitHeadline text="honest" delay={0.18} className="italic text-matcha-700" />{" "}
          <SplitHeadline text="about matcha." delay={0.3} />
        </h1>

        <motion.p
          className="mt-6 text-[16px] sm:text-[18px] text-gray-600 max-w-xl mx-auto leading-relaxed"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_EXPO, delay: 0.75 }}
        >
          We read every cafe&rsquo;s own website and menu, then show you exactly what they
          say about where their matcha comes from — quoted, dated, and linked.
        </motion.p>

        {/* Search is the CTA */}
        <motion.form
          onSubmit={(e) => { e.preventDefault(); go(query); }}
          className="mt-7 max-w-xl mx-auto"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_EXPO, delay: 0.88 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-2xl bg-white"
               style={{ border: "1.5px solid #e5e7eb", boxShadow: "0 10px 40px rgba(15,32,16,0.07)" }}>
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <label htmlFor="overture-search" className="sr-only">Search cafes and suburbs</label>
              <input
                id="overture-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${total.toLocaleString()} cafes…`}
                className="w-full bg-transparent pl-10 pr-3 py-3 text-[16px] text-gray-800 placeholder:text-gray-400 outline-none rounded-xl"
              />
            </div>
            <Magnetic strength={0.25} className="block w-full sm:w-auto">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl text-[16px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-matcha-500 outline-none whitespace-nowrap"
                style={{ background: "linear-gradient(135deg,#2e6027,#4d9740)", boxShadow: "0 4px 16px rgba(46,96,39,0.32)" }}
              >
                Explore the map
                <ArrowRight size={15} />
              </button>
            </Magnetic>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[16px] text-gray-500">Popular:</span>
            {chips.map((c, i) => (
              <motion.button
                key={c.label}
                type="button"
                onClick={() => router.push(c.href)}
                className="px-3 py-1.5 rounded-full text-[16px] text-gray-600 bg-gray-100 hover:bg-matcha-50 hover:text-matcha-700 transition-colors focus-visible:ring-2 focus-visible:ring-matcha-500 outline-none"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT, delay: 1 + i * 0.06 }}
              >
                {c.label}
              </motion.button>
            ))}
          </div>
        </motion.form>

        {/* Live proof */}
        <motion.div
          className="mt-9 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.15 }}
        >
          {[
            { n: total,    label: "cafes mapped" },
            { n: verified, label: "with verified disclosure" },
            { n: 2,        label: "cities" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
                <Counter value={s.n} />
              </div>
              <div className="text-[16px] text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        aria-hidden
        className="absolute bottom-7 left-1/2 -translate-x-1/2 text-gray-400"
        style={{ opacity: fade }}
        animate={reduce ? {} : { y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown size={18} />
      </motion.div>
    </section>
  );
}

/** Infinite marquee of the cafes that actually disclose. */
function VerifiedMarquee({ verified }: { verified: Cafe[] }) {
  const reduce = useReducedMotion();
  const names  = verified.length
    ? verified.map((c) => c.name)
    : ["Verified Japanese disclosure"];
  const lane = [...names, ...names];
  // Chips average ~230px, and the loop travels half the lane. Deriving the
  // duration from the name count keeps the scroll at a readable ~50px/second
  // however many cafes get verified later.
  const duration = Math.max(60, names.length * 4.6);

  return (
    <section className="py-8 border-y border-gray-100 bg-white overflow-hidden" aria-label="Cafes with verified disclosure">
      <div className="flex items-center gap-3 justify-center mb-5 px-5">
        <ShieldCheck size={15} className="text-matcha-600" />
        <span className="text-[16px] uppercase tracking-widest text-gray-500 font-semibold text-center">
          Level A — states its Japanese origin in public
        </span>
      </div>
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10"
             style={{ background: "linear-gradient(90deg,#fff,transparent)" }} />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10"
             style={{ background: "linear-gradient(270deg,#fff,transparent)" }} />
        <motion.div
          // Keyed on the count: the marquee first renders with the placeholder
          // name, and framer keeps the transition it started with — without
          // this it would run the 1-name duration over the 86-name lane.
          key={names.length}
          className="flex gap-3 w-max"
          animate={reduce ? {} : { x: ["0%", "-50%"] }}
          transition={{ duration, repeat: Infinity, ease: "linear" }}
        >
          {lane.map((n, i) => (
            <span
              key={`${n}-${i}`}
              className="flex-shrink-0 px-4 py-2 rounded-full text-[16px] font-medium text-matcha-800"
              style={{ background: "#f2f8f0", border: "1px solid #e0f0d8" }}
            >
              {n}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/** The headline finding, pinned and scrubbed by the scrollbar. */
function DisclosureStat({ stats }: { stats: Props["stats"] }) {
  const ref    = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const scale   = useTransform(scrollYProgress, [0, 0.5], [reduce ? 1 : 0.82, 1]);
  const ringLen = useTransform(scrollYProgress, [0.1, 0.65], [0, 1]);
  const copyY   = useTransform(scrollYProgress, [0.35, 0.8], [reduce ? 0 : 40, 0]);
  const copyOp  = useTransform(scrollYProgress, [0.35, 0.7], [reduce ? 1 : 0, 1]);

  // Same definition as the disclosure section further down the page: cafes that
  // say anything about Japanese origin (A + B), over the cafes we could read.
  // Two different figures for one fact would read as an error.
  const named = (stats?.byLevel?.A ?? 86) + (stats?.byLevel?.B ?? 14);
  const read  = stats?.assessable ?? 588;
  const pct   = Math.round((named / read) * 100);

  return (
    <section ref={ref} className="relative h-[108vh]" aria-label="Disclosure rate">
      <div className="sticky top-0 h-[100dvh] flex flex-col items-center justify-center overflow-hidden"
           style={{ background: "#0f2010" }}>
        {/* concentric rings */}
        <svg aria-hidden className="absolute inset-0 w-full h-full opacity-[0.16]" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          {[18, 30, 42].map((r) => (
            <motion.circle
              key={r}
              cx="50" cy="50" r={r}
              fill="none" stroke="#6eb35c" strokeWidth="0.25"
              style={{ pathLength: ringLen }}
            />
          ))}
        </svg>

        <motion.div style={{ scale }} className="text-center px-5">
          <div className="text-[16px] uppercase tracking-[0.2em] text-matcha-300 font-semibold mb-5">
            The finding
          </div>
          <div className="font-display font-bold leading-none text-white flex items-baseline justify-center"
               style={{ fontSize: "clamp(5rem, 22vw, 16rem)" }}>
            <Counter value={pct} />
            <span className="text-matcha-400 ml-1" style={{ fontSize: "0.42em" }}>%</span>
          </div>
          <div className="font-display text-2xl sm:text-4xl text-white/90 mt-3 leading-snug">
            of cafes we could read say
            <br className="sm:hidden" /> anything about Japanese origin.
          </div>
        </motion.div>

        <motion.p
          style={{ y: copyY, opacity: copyOp }}
          className="mt-7 max-w-lg text-center text-[16px] leading-relaxed text-white/60 px-6"
        >
          Only {stats?.byLevel?.A ?? 86} of them name a region, farm or supplier.
          The full breakdown is below.
        </motion.p>
      </div>
    </section>
  );
}

/** Every verified cafe, plotted from its real coordinates. */
function ConstellationMap({ verified }: { verified: Cafe[] }) {
  const reduce = useReducedMotion();
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  const cities = useMemo(() => {
    const group = (city: string) => {
      const pts = verified.filter((c) => c.city === city);
      if (!pts.length) return null;
      const lats = pts.map((p) => p.lat), lngs = pts.map((p) => p.lng);
      const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
      const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
      const spanLat = maxLat - minLat || 1;
      const spanLng = maxLng - minLng || 1;
      return {
        city,
        count: pts.length,
        // 6% inset so no dot sits on the frame edge
        dots: pts.map((p) => ({
          id: p.id,
          x: 6 + ((p.lng - minLng) / spanLng) * 88,
          y: 6 + ((maxLat - p.lat) / spanLat) * 88,
        })),
      };
    };
    return [group("Sydney"), group("Melbourne")].filter(Boolean) as {
      city: string; count: number; dots: { id: string; x: number; y: number }[];
    }[];
  }, [verified]);

  return (
    <section className="py-16 sm:py-24 px-5 bg-white" aria-label="Where the verified cafes are">
      <div className="max-w-6xl mx-auto">
        <Reveal className="max-w-2xl">
          <div className="text-[16px] uppercase tracking-widest text-gray-500 font-semibold mb-4">
            The map
          </div>
          <h2 className="font-display font-bold leading-[1.05] tracking-tight text-gray-900"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            Every verified cafe, exactly where it stands.
          </h2>
          <p className="mt-4 text-[16px] text-gray-600 leading-relaxed">
            Each dot below is a real cafe at its real coordinates — the same points you can open,
            read and check on the live map.
          </p>
        </Reveal>

        <div ref={ref} className="mt-10 grid gap-5 sm:grid-cols-2">
          {cities.map((c, ci) => (
            <Reveal key={c.city} delay={ci * 0.12}>
              <Link
                // lands on exactly what the card draws: this city's verified cafes
                href={`/map?city=${encodeURIComponent(c.city)}&level=A`}
                className="group block rounded-3xl p-6 relative overflow-hidden focus-visible:ring-2 focus-visible:ring-matcha-500 outline-none"
                style={{ background: "#0f2010" }}
              >
                <div className="flex items-baseline justify-between mb-4">
                  <span className="font-display text-2xl font-bold text-white">{c.city}</span>
                  <span className="text-[16px] text-matcha-300 font-semibold">
                    {c.count} verified
                  </span>
                </div>

                <div className="relative w-full" style={{ aspectRatio: "4 / 3" }}>
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
                    {/* faint grid */}
                    {[25, 50, 75].map((v) => (
                      <g key={v} stroke="rgba(255,255,255,0.06)" strokeWidth="0.3">
                        <line x1={v} y1="0" x2={v} y2="100" />
                        <line x1="0" y1={v} x2="100" y2={v} />
                      </g>
                    ))}
                    {c.dots.map((d, i) => (
                      <motion.circle
                        key={d.id}
                        cx={d.x} cy={d.y} r="1.5"
                        fill="#6eb35c"
                        initial={reduce ? false : { opacity: 0, scale: 0 }}
                        animate={inView ? { opacity: 1, scale: 1 } : {}}
                        transition={{
                          duration: 0.5,
                          ease: EASE_EXPO,
                          delay: reduce ? 0 : ci * 0.15 + i * 0.012,
                        }}
                        style={{ transformOrigin: `${d.x}px ${d.y}px` }}
                      />
                    ))}
                  </svg>
                </div>

                <div className="mt-5 inline-flex items-center gap-1.5 text-[16px] font-semibold text-white">
                  Explore the map
                  <motion.span className="inline-flex" whileHover={{ x: 3 }}>
                    <ArrowRight size={15} />
                  </motion.span>
                </div>

                {/* sheen on hover */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(600px circle at 50% 0%, rgba(110,179,92,0.16), transparent 60%)" }}
                />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Featured listings — the pattern's "inventory" beat. */
function FeaturedCafes({ verified }: { verified: Cafe[] }) {
  const picks = useMemo(
    () => verified.filter((c) => c.evidence?.quote).slice(0, 6),
    [verified],
  );
  if (!picks.length) return null;

  return (
    <section className="py-16 sm:py-24 px-5" style={{ background: "#fdfcf7" }} aria-label="Featured verified cafes">
      <div className="max-w-6xl mx-auto">
        <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <div className="max-w-xl">
            <div className="text-[16px] uppercase tracking-widest text-gray-500 font-semibold mb-4">
              In their own words
            </div>
            <h2 className="font-display font-bold leading-[1.05] tracking-tight text-gray-900"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
              Proof, not adjectives.
            </h2>
          </div>
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 text-[16px] font-semibold text-matcha-700 hover:underline focus-visible:ring-2 focus-visible:ring-matcha-500 outline-none rounded"
          >
            See all on the map <ArrowRight size={15} />
          </Link>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.07}>
              <motion.div
                className="h-full rounded-3xl bg-white p-6 flex flex-col"
                style={{ border: "1px solid #e0f0d8" }}
                whileHover={{ y: -6, boxShadow: "0 18px 48px rgba(15,32,16,0.10)" }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-7 h-7 rounded-full bg-matcha-700 text-white text-[16px] font-bold flex items-center justify-center flex-shrink-0">
                    A
                  </span>
                  <div className="min-w-0">
                    <div className="text-[16px] font-semibold text-gray-900 truncate">{c.name}</div>
                    <div className="flex items-center gap-1 text-[16px] text-gray-500">
                      <MapPin size={11} />{c.suburb}, {c.city}
                    </div>
                  </div>
                </div>

                <Quote size={16} className="text-matcha-400 mb-2" />
                {/* clamped so one long quote can't set the height of the whole row */}
                <p className="text-[16px] text-gray-700 italic leading-relaxed flex-1 line-clamp-5">
                  &ldquo;{c.evidence!.quote}&rdquo;
                </p>
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid #f0f0f0" }}>
                  {c.evidence!.source ? (
                    <a
                      href={c.evidence!.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="group/src inline-flex items-center gap-1.5 text-[16px] text-gray-500 hover:text-matcha-700 focus-visible:ring-2 focus-visible:ring-matcha-500 outline-none rounded"
                    >
                      <ExternalLink size={12} className="flex-shrink-0" />
                      <span className="underline decoration-gray-300 underline-offset-2 group-hover/src:decoration-matcha-500">
                        {c.evidence!.sourceLabel}
                      </span>
                      <span className="text-gray-400">· verified {c.evidence!.verifiedDate}</span>
                    </a>
                  ) : (
                    <span className="text-[16px] text-gray-500">
                      {c.evidence!.sourceLabel} · verified {c.evidence!.verifiedDate}
                    </span>
                  )}
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── overture ── */

export default function LandingOverture({ stats, verified }: Props) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <>
      {/* Reading progress */}
      <motion.div
        aria-hidden
        className="fixed top-16 left-0 right-0 h-[2px] origin-left z-[90]"
        style={{ scaleX: progress, background: "linear-gradient(90deg,#2e6027,#6eb35c)" }}
      />
      <Hero stats={stats} />
      <VerifiedMarquee verified={verified} />
      <DisclosureStat stats={stats} />
    </>
  );
}

/**
 * The payoff half of the overture. Rendered much further down the page, after
 * the grading system and the method have been explained — evidence lands
 * harder once the reader knows how a grade is earned.
 */
export function LandingProof({ verified }: { verified: Cafe[] }) {
  return (
    <>
      <FeaturedCafes verified={verified} />
      <ConstellationMap verified={verified} />
    </>
  );
}
