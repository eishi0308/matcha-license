"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Map, Info, ChevronRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthModal from "./AuthModal";

const NAV_LINKS = [
  { href: "/map",           icon: Map,  label: "Explore Map" },
  { href: "/#how-it-works", icon: Info, label: "How it Works" },
];

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export default function Navbar() {
  const [scrolled,        setScrolled]        = useState(false);
  const [authOpen,        setAuthOpen]        = useState(false);
  const [authTab,         setAuthTab]         = useState<"login" | "signup">("login");
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false);
  const pathname = usePathname();
  const isMap = pathname === "/map";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  const openLogin  = () => { setAuthTab("login");  setAuthOpen(true); };
  const openSignup = () => { setAuthTab("signup"); setAuthOpen(true); };

  const light = false;

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-[100]"
        animate={
          scrolled || isMap || mobileMenuOpen
            ? { backgroundColor: "rgba(255,255,255,0.95)", borderBottomColor: "rgba(0,0,0,0.07)" }
            : { backgroundColor: "rgba(0,0,0,0)",          borderBottomColor: "rgba(0,0,0,0)" }
        }
        transition={{ duration: 0.3, ease: EASE }}
        style={{
          backdropFilter:         scrolled || isMap || mobileMenuOpen ? "blur(20px)" : "none",
          WebkitBackdropFilter:   scrolled || isMap || mobileMenuOpen ? "blur(20px)" : "none",
          borderBottom: "1px solid",
          boxShadow:    scrolled || isMap ? "0 1px 20px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setMobileMenuOpen(false)}>
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
                MatchaScope
              </span>
              <span className="text-[10px] tracking-widest uppercase font-medium transition-colors duration-300"
                style={{ color: light ? "rgba(255,255,255,0.65)" : "#6eb35c" }}
              >
                Transparency Map
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ href, icon: Icon, label }) => (
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
                  transition={{ duration: 0.22, ease: EASE }}
                />
              </motion.div>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2.5">
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

          {/* Mobile: hamburger button */}
          <motion.button
            className="md:hidden p-2 rounded-xl -mr-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle menu"
            style={{ color: light ? "rgba(255,255,255,0.9)" : "#374151" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileMenuOpen ? "x" : "menu"}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
                style={{ display: "block" }}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile dropdown menu — absolute so it overlays content without shifting toolbar */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden absolute top-16 left-0 right-0 border-b border-gray-100 px-5 pb-5"
              style={{
                background: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                zIndex: 99,
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              <div className="pt-3 space-y-1">
                {NAV_LINKS.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <Icon size={16} className="text-matcha-600" />
                    {label}
                  </Link>
                ))}
              </div>

              <div className="pt-3 mt-2 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => { openLogin(); setMobileMenuOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => { openSignup(); setMobileMenuOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #2e6027, #4d9740)" }}
                >
                  Get started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} />
    </>
  );
}
