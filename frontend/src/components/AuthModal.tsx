"use client";

import { useState, useEffect } from "react";
import { X, Eye, EyeOff, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "signup";
}

const SPRING = { type: "spring" as const, stiffness: 380, damping: 32 };
const EASE   = [0.25, 0.46, 0.45, 0.94] as const;

export default function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [tab, setTab]               = useState<"login" | "signup">(defaultTab);
  const [showPassword, setShowPass] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [form, setForm]             = useState({ name: "", email: "", password: "" });

  // Sync tab when modal opens with a different defaultTab
  useEffect(() => { setTab(defaultTab); setError(null); }, [defaultTab, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.name } },
        });
        if (error) throw error;
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        // Backdrop
        <motion.div
          key="auth-backdrop"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: EASE }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Dark overlay */}
          <motion.div
            className="absolute inset-0 -z-10"
            style={{ background: "rgba(5,14,7,0.6)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={SPRING}
            className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{ background: "#fff", boxShadow: "0 32px 96px rgba(0,0,0,0.22), 0 8px 32px rgba(0,0,0,0.12)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-matcha-700 via-matcha-500 to-matcha-300" />

            <div className="p-8">
              {/* Close button */}
              <motion.button
                onClick={onClose}
                className="absolute top-6 right-6 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.92 }}
                transition={SPRING}
              >
                <X size={18} />
              </motion.button>

              {/* Logo */}
              <motion.div className="flex items-center gap-2 mb-7"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.4, ease: EASE }}
              >
                <motion.div
                  className="w-8 h-8 rounded-full bg-matcha-700 flex items-center justify-center"
                  whileHover={{ rotate: 20, scale: 1.1 }}
                  transition={SPRING}
                >
                  <Leaf size={15} className="text-white" />
                </motion.div>
                <span className="font-semibold text-matcha-900 text-sm tracking-wide">Matcha Origin</span>
              </motion.div>

              {/* Tab switcher with sliding pill */}
              <motion.div
                className="relative flex gap-1 p-1 bg-gray-100 rounded-xl mb-7"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
              >
                {/* Sliding pill */}
                <motion.div
                  className="absolute top-1 bottom-1 rounded-lg bg-white"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
                  animate={{ left: tab === "login" ? 4 : "50%", right: tab === "login" ? "50%" : 4 }}
                  transition={SPRING}
                />
                {(["login", "signup"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="relative z-10 flex-1 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    style={{ color: tab === t ? "#2e6027" : "#6b7280" }}
                  >
                    {t === "login" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </motion.div>

              {/* Heading + form — animate when tab switches */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: tab === "signup" ? 18 : -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: tab === "signup" ? -18 : 18 }}
                  transition={{ duration: 0.2, ease: EASE }}
                >
                  <h2 className="text-2xl font-display font-semibold text-gray-900 mb-1">
                    {tab === "login" ? "Welcome back" : "Join Matcha Origin"}
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    {tab === "login"
                      ? "Sign in to save cafes and suggest updates."
                      : "Create a free account to track your favourite transparent cafes."}
                  </p>

                  {error && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {tab === "signup" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.25, ease: EASE }}>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Full name</label>
                        <motion.input
                          type="text" required placeholder="Yuki Tanaka"
                          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none placeholder:text-gray-300 transition-all"
                          whileFocus={{ boxShadow: "0 0 0 3px rgba(78,151,64,0.15), 0 0 0 1px #4d9740" } as any}
                        />
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Email address</label>
                      <motion.input
                        type="email" required placeholder="you@example.com"
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none placeholder:text-gray-300 transition-all"
                        whileFocus={{ boxShadow: "0 0 0 3px rgba(78,151,64,0.15), 0 0 0 1px #4d9740" } as any}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
                      <div className="relative">
                        <motion.input
                          type={showPassword ? "text" : "password"} required placeholder="••••••••"
                          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm outline-none placeholder:text-gray-300 transition-all"
                          whileFocus={{ boxShadow: "0 0 0 3px rgba(78,151,64,0.15), 0 0 0 1px #4d9740" } as any}
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowPass(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          whileTap={{ scale: 0.88 }}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </motion.button>
                      </div>
                    </div>

                    {tab === "login" && (
                      <div className="flex justify-end">
                        <motion.button type="button" className="text-xs text-matcha-700 font-medium"
                          whileHover={{ color: "#1e4a1a" } as any} transition={{ duration: 0.15 }}
                        >
                          Forgot password?
                        </motion.button>
                      </div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl font-semibold text-sm text-white mt-2 relative overflow-hidden"
                      style={{
                        background: loading ? "#9ca3af" : "linear-gradient(135deg, #2e6027 0%, #4d9740 100%)",
                        boxShadow: loading ? "none" : "0 4px 16px rgba(46,96,39,0.35)",
                      }}
                      whileHover={!loading ? { scale: 1.02, boxShadow: "0 6px 24px rgba(46,96,39,0.45)" } as any : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.svg
                            className="h-4 w-4" viewBox="0 0 24 24" fill="none"
                            animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </motion.svg>
                          {tab === "login" ? "Signing in..." : "Creating account..."}
                        </span>
                      ) : (
                        tab === "login" ? "Sign in" : "Create account"
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              </AnimatePresence>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or continue with</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Google SSO */}
              <motion.button
                onClick={handleGoogle}
                type="button"
                className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02, borderColor: "#d1d5db" } as any}
                whileTap={{ scale: 0.98 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </motion.button>

              <p className="text-center text-xs text-gray-400 mt-5">
                By continuing, you agree to our{" "}
                <span className="text-matcha-700 cursor-pointer hover:underline">Terms</span> and{" "}
                <span className="text-matcha-700 cursor-pointer hover:underline">Privacy Policy</span>.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
