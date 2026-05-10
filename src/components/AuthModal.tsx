"use client";

import { useState } from "react";
import { X, Eye, EyeOff, Leaf } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "signup";
}

export default function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onClose(); }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: "#fff", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
      >
        {/* Header accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-matcha-700 via-matcha-500 to-matcha-300" />

        <div className="p-8">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-7">
            <div className="w-8 h-8 rounded-full bg-matcha-700 flex items-center justify-center">
              <Leaf size={15} className="text-white" />
            </div>
            <span className="font-semibold text-matcha-900 text-sm tracking-wide">Matcha Origin</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-7">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={
                  tab === t
                    ? { background: "#fff", color: "#2e6027", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }
                    : { color: "#6b7280" }
                }
              >
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-display font-semibold text-gray-900 mb-1">
            {tab === "login" ? "Welcome back" : "Join Matcha Origin"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {tab === "login"
              ? "Sign in to save cafes and suggest updates."
              : "Create a free account to track your favourite transparent cafes."}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "signup" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Full name</label>
                <input
                  type="text"
                  required
                  placeholder="Yuki Tanaka"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-matcha-500 focus:ring-2 focus:ring-matcha-100 transition-all placeholder:text-gray-300"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-matcha-500 focus:ring-2 focus:ring-matcha-100 transition-all placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm outline-none focus:border-matcha-500 focus:ring-2 focus:ring-matcha-100 transition-all placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {tab === "login" && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-matcha-700 hover:text-matcha-900 font-medium">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all mt-2"
              style={{
                background: loading ? "#9ca3af" : "linear-gradient(135deg, #2e6027 0%, #4d9740 100%)",
                boxShadow: loading ? "none" : "0 4px 16px rgba(46,96,39,0.35)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {tab === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                tab === "login" ? "Sign in" : "Create account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Google SSO */}
          <button className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-gray-400 mt-5">
            By continuing, you agree to our{" "}
            <span className="text-matcha-700 cursor-pointer hover:underline">Terms</span> and{" "}
            <span className="text-matcha-700 cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
