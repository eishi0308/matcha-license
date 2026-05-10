"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Map, Info, ChevronRight } from "lucide-react";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const pathname = usePathname();
  const isMap = pathname === "/map";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openLogin = () => { setAuthTab("login"); setAuthOpen(true); };
  const openSignup = () => { setAuthTab("signup"); setAuthOpen(true); };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
        style={
          scrolled || isMap
            ? {
                background: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 1px 20px rgba(0,0,0,0.06)",
              }
            : { background: "transparent" }
        }
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: "linear-gradient(135deg, #2e6027, #6eb35c)" }}
            >
              <Leaf size={15} className="text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="font-semibold text-sm tracking-tight"
                style={{ color: scrolled || isMap ? "#1a1a1a" : "#fff" }}
              >
                Matcha Origin
              </span>
              <span
                className="text-[10px] tracking-widest uppercase font-medium"
                style={{ color: scrolled || isMap ? "#6eb35c" : "rgba(255,255,255,0.7)" }}
              >
                Transparency Map
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/map"
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: scrolled || isMap ? "#374151" : "rgba(255,255,255,0.85)" }}
            >
              <Map size={15} />
              Explore Map
            </Link>
            <Link
              href="/#how-it-works"
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: scrolled || isMap ? "#374151" : "rgba(255,255,255,0.85)" }}
            >
              <Info size={15} />
              How it Works
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={openLogin}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{ color: scrolled || isMap ? "#374151" : "rgba(255,255,255,0.9)" }}
            >
              Sign in
            </button>
            <button
              onClick={openSignup}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #2e6027, #4d9740)",
                boxShadow: "0 2px 12px rgba(46,96,39,0.35)",
              }}
            >
              Get started
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authTab}
      />
    </>
  );
}
