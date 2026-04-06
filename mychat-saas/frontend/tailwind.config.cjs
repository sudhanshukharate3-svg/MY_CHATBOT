/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.25)",
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseBars: {
          "0%, 100%": { transform: "scaleY(0.35)", opacity: "0.6" },
          "50%": { transform: "scaleY(1)", opacity: "1" },
        },
      },
      animation: {
        floatIn: "floatIn 180ms ease-out",
        pulseBars: "pulseBars 900ms ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

