import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#152A3A", soft: "#41576A", faint: "#7C8C99" },
        paper: { DEFAULT: "#F4F6F3", card: "#FFFFFF", sunk: "#EAEEE9" },
        pine: { DEFAULT: "#1F6F5C", dark: "#175243", light: "#E4F0EB" },
        clay: { DEFAULT: "#9A5B1F", light: "#FBF0E2" },
        line: { DEFAULT: "#DCE3DC", strong: "#C3CEC4" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderRadius: { card: "14px", pill: "999px" },
      boxShadow: {
        raise: "0 1px 2px rgba(21,42,58,.06), 0 8px 24px -12px rgba(21,42,58,.18)",
        float: "0 18px 42px -24px rgba(21,42,58,.32), 0 4px 12px rgba(21,42,58,.08)",
      },
      maxWidth: { shell: "1200px" },
    },
  },
  plugins: [],
};
export default config;
