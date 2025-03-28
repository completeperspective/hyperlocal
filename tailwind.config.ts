import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme colors
        dark: "#1b1b1c",
        light: "#f2f4f7",
        surface: "#fff",
        "surface-dark": "#212324",
        stroke: "#eaecf0",
        "stroke-dark": "#363738",
        // Dynamic theme colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--theme-color-primary, #368cbf)",
        "primary-dark": "var(--theme-color-primary-dark, #1E90FF)",
      },
      fontFamily: {
        // Theme fonts
        "open-sans": ["var(--font-open-sans)"],
        lobster: ["var(--font-lobster)"],
        // Dynamic theme fonts
        primary: ["var(--theme-font-primary)"],
        secondary: ["var(--theme-font-secondary)"],
      },
    },
  },
  plugins: [],
} satisfies Config;
