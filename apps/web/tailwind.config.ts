import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg))",
        paper: "rgb(var(--paper))",
        fg: "rgb(var(--fg))",
        muted: "rgb(var(--muted))",
        border: "rgb(var(--border))",
        accent: "rgb(var(--accent))",
        stamp: "rgb(var(--stamp))",
        gold: "rgb(var(--gold))",
        success: "rgb(var(--success))",
        warning: "rgb(var(--warning))",
        danger: "rgb(var(--danger))",
        info: "rgb(var(--info))",
      },
      boxShadow: {
        dc: "var(--shadow-strong)",
        "dc-hover": "var(--shadow-hover)",
        "dc-press": "var(--shadow-press)",
      },
      borderRadius: {
        dc0: "var(--radius-0)",
        dc1: "var(--radius-1)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
