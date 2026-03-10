import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        border: 'var(--border)',
        'border-bright': 'var(--border-bright)',
        indigo: 'var(--indigo)',
        violet: 'var(--violet)',
        positive: 'var(--positive)',
        negative: 'var(--negative)',
        neutral: 'var(--neutral)',
      },
      boxShadow: {
        'glow-primary': '0 0 80px var(--indigo-glow)',
        'glow-positive': '0 0 80px var(--positive-glow)',
        'glow-negative': '0 0 80px var(--negative-glow)',
        'float': '0 40px 80px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
export default config;
