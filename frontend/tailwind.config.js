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
        card: "rgba(18, 16, 28, 0.6)",
        primary: {
          DEFAULT: "#6d28d9",
          hover: "#5b21b6"
        },
        secondary: "#10b981",
        border: "rgba(255, 255, 255, 0.08)",
        muted: "#9ca3af"
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
