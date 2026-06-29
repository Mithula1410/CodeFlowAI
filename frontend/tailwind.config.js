/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08070d",
        surface:    "rgba(9, 8, 16, 0.72)",
        card:       "rgba(18, 16, 28, 0.6)",
        primary: {
          DEFAULT: "#8b5cf6",
          hover:   "#7c3aed",
          muted:   "rgba(139, 92, 246, 0.15)",
        },
        secondary:   "#10b981",
        accent:      "#3b82f6",
        border:      "rgba(255, 255, 255, 0.065)",
        "border-active": "rgba(139, 92, 246, 0.35)",
        muted:       "#6b7280",
        "muted-fg":  "#9ca3af",
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backdropBlur: {
        xs:  '2px',
        sm:  '8px',
        md:  '16px',
        lg:  '24px',
        xl:  '40px',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'glow-purple': '0 0 40px rgba(139, 92, 246, 0.25)',
        'glow-blue':   '0 0 40px rgba(59, 130, 246, 0.2)',
        'glow-sm':     '0 0 12px rgba(139, 92, 246, 0.15)',
        'inner-glow':  'inset 0 1px 0 rgba(255,255,255,0.06)',
        'card':        '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.4' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-4px)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'pulse-slow':   'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft':  'bounce-soft 2s ease-in-out infinite',
        'spin-slow':    'spin-slow 8s linear infinite',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
