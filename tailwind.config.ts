import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12100f",
        cream: "#fff4d8",
        paper: "#fff8e9",
        lilac: "#d8b3e7",
        mint: "#d8ea8c",
        blush: "#f5a6c8",
        butter: "#feeaa4",
        aqua: "#bde7dc",
      },
      boxShadow: {
        pixel: "4px 4px 0 #12100f",
        insetPixel: "inset 2px 2px 0 rgba(255,255,255,0.75), inset -2px -2px 0 rgba(18,16,15,0.18)",
      },
    },
  },
  plugins: [],
} satisfies Config;
