import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vitals: {
          crimson: "#B91C1C",
          paper: "#F9FAFB",
          charcoal: "#495057",
          teal: "#0F766E",
          roseMist: "#FFECEC",
        },
      },
      fontFamily: {
        sans: ["Geist", "sans-serif"],
        display: ["Cabinet Grotesk", "Satoshi", "Geist", "sans-serif"],
      },
      boxShadow: {
        ticket: "0 16px 50px -18px rgba(185, 28, 28, 0.35)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        reveal: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        reveal: "reveal 0.7s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
