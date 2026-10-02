/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        coral: {
          DEFAULT: "#E84B1A",
          light: "#FFF2EE",
          medium: "#FFD4C4",
          dark: "#c73c12",
        },
        surface: {
          bg: "#F0F0EE",
          card: "#FFFFFF",
          border: "#E8E8E4",
          hover: "#F7F7F5",
        },
        ink: {
          DEFAULT: "#111111",
          secondary: "#6B7280",
          muted: "#9CA3AF",
          faint: "#D1D5DB",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
      boxShadow: {
        card: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.08)",
        coral: "0 4px 20px rgba(232, 75, 26, 0.25)",
      },
    },
  },
  plugins: [],
};
