import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        matcha: {
          50:  "#f2f8f0",
          100: "#e0f0d8",
          200: "#c2e1b5",
          300: "#97cc86",
          400: "#6eb35c",
          500: "#4d9740",
          600: "#3a7a30",
          700: "#2e6027",
          800: "#274d22",
          900: "#1e3a1a",
          950: "#0f2010",
        },
        cream: {
          50:  "#fdfcf7",
          100: "#f9f6ec",
          200: "#f2ecd5",
          300: "#e8dcb8",
        },
        stone: {
          850: "#1c1917",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      backgroundImage: {
        "matcha-gradient": "linear-gradient(135deg, #0f2010 0%, #1e3a1a 40%, #2e6027 100%)",
        "card-shine": "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%)",
      },
      boxShadow: {
        "glow-green": "0 0 40px rgba(78,151,64,0.25)",
        "card": "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.12), 0 20px 40px rgba(0,0,0,0.1)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
