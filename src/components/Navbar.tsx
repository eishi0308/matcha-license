"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Map, Info, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
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

  const openLogin  = () => { setAuthTab("login");  setAuthOpen(true); };
  const openSignup = () => { setAuthTab("signup"); setAuthOpen(true); };

  const light = !scrolled && !isMap;

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-[100]"
        animate={
          scrolled || isMap
            ? { backgroundColor: "rgba(255,255,255,0.9)", borderBottomColor: "rgba(0,0,0,0.07)" }
            : { backgroundColor: "rgba(0,0,0,0)",         borderBottomColor: "rgba(0,0,0,0)" }
        }
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          backdropFilter: scrolled || isMap ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled || isMap ? "blur(20px)" : "none",
          borderBottom: "1px solid",
          boxShadow: scrolled || isMap ? "0 1px 20px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #2e6027, #6eb35c)" }}
              whileHover={{ rotate: 20, scale: 1.12 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              <Leaf size={15} className="text-white" />
            </motion.div>
            <div className="flex flex-col leading-none">
              <span className="font-semibold text-sm tracking-tight transition-colors duration-300"
                style={{ color: light ? "#fff" : "#1a1a1a" }}
              >
                Matcha Origin
              </span>
              <span className="text-[10px] tracking-widest uppercase font-medium transition-colors duration-300"
                style={{ color: light ? "rgba(255,255,255,0.65)" : "#6eb35c" }}
              >
                Transparency Map
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { href: "/map",          icon: Map,  label: "Explore Map" },
              { href: "/#how-it-works", icon: Info, label: "How it Works" },
            ].map(({ href, icon: Icon, label }) => (
              <motion.div key={href} className="relative" initial="rest" whileHover="hover" animate="rest">
                <Link
                  href={href}
                  className="flex items-center gap-1.5 text-sm font-medium py-1 transition-colors duration-300"
                  style={{ color: light ? "rgba(255,255,255,0.85)" : "#374151" }}
                >
                  <Icon size={15} />{label}
                </Link>
                <motion.span
                  className="absolute bottom-0 left-0 h-[1.5px] rounded-full"
                  style={{ background: light ? "rgba(255,255,255,0.7)" : "#4d9740" }}
                  variants={{ rest: { width: "0%" }, hover: { width: "100%" } }}
                  transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <motion.button
              onClick={openLogin}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300"
              style={{ color: light ? "rgba(255,255,255,0.9)" : "#374151" }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Sign in
            </motion.button>
            <motion.button
              onClick={openSignup}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #2e6027, #4d9740)",
                boxShadow: "0 2px 12px rgba(46,96,39,0.35)",
              }}
              whileHover={{ scale: 1.06, boxShadow: "0 4px 20px rgba(46,96,39,0.5)" } as any}
              whileTap={{ scale: 0.96 }}
            >
              Get started
              <motion.span
                animate={{ x: [0, 2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronRight size={14} />
              </motion.span>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} />
    </>
  );
}
