/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        hand: ["Caveat", "cursive"],
      },
      colors: {
        // Paper / Canvas
        paper: "#FFFDF7",
        "paper-warm": "#FAF8F3",
        "paper-border": "#E8E3D8",
        // Accent
        accent: {
          DEFAULT: "#7C3AED",
          light: "#EDE9FE",
          hover: "#6D28D9",
        },
        // Sticky note colors
        note: {
          yellow: "#FFF3A3",
          "yellow-dark": "#F5E642",
          pink: "#FFD6D6",
          "pink-dark": "#FFB3B3",
          blue: "#D6EAFF",
          "blue-dark": "#93C5FD",
          green: "#D4EDDA",
          "green-dark": "#86EFAC",
          lavender: "#E8D5FF",
          "lavender-dark": "#C4B5FD",
          mint: "#D1FAE5",
          "mint-dark": "#6EE7B7",
          peach: "#FFE4CC",
          "peach-dark": "#FDBA74",
        },
        // Text
        ink: {
          DEFAULT: "#1C1917",
          secondary: "#57534E",
          tertiary: "#A8A29E",
          light: "#D6D3D1",
        },
      },
      boxShadow: {
        "note": "2px 4px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
        "note-hover": "6px 12px 24px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.08)",
        "note-drag": "12px 20px 40px rgba(0,0,0,0.20), 0 4px 12px rgba(0,0,0,0.12)",
        "card": "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.08)",
        "panel": "0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.35s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.25s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "float": "float 4s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "flip": "flip 0.55s ease-in-out",
        "wiggle": "wiggle 0.4s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.94)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(-1deg)" },
          "50%": { transform: "translateY(-10px) rotate(1deg)" },
        },
        flip: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
    },
  },
  plugins: [],
};
