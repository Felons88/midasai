import type { Config } from "tailwindcss"

const config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Design System Colors
        primary: {
          DEFAULT: "#1C1917",
          light: "#0C0A09",
          foreground: "#FAFAF9",
        },
        secondary: {
          DEFAULT: "#44403C",
          foreground: "#FAFAF9",
        },
        cta: {
          DEFAULT: "#CA8A04",
          light: "#EAB308",
        },
        background: {
          DEFAULT: "#09090B",
          light: "#FAFAF9",
        },
        surface: {
          DEFAULT: "#18181B",
          light: "#F5F5F7",
        },
        elevated: {
          DEFAULT: "#27272A",
          light: "#FFFFFF",
        },
        card: {
          DEFAULT: "#1C1917",
          light: "#FFFFFF",
          foreground: "#FAFAF9",
        },
        glass: {
          DEFAULT: "rgba(28, 25, 23, 0.6)",
          light: "rgba(255, 255, 255, 0.8)",
        },
        text: {
          primary: "#FAFAF9",
          secondary: "#A1A1AA",
          tertiary: "#71717A",
          primaryLight: "#0C0A09",
          secondaryLight: "#44403C",
          tertiaryLight: "#71717A",
        },
        foreground: {
          DEFAULT: "#FAFAF9",
        },
        muted: {
          DEFAULT: "#27272A",
          foreground: "#A1A1AA",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.1)",
          light: "rgba(0, 0, 0, 0.1)",
          border: "rgba(255, 255, 255, 0.1)",
        },
        input: {
          DEFAULT: "rgba(255, 255, 255, 0.1)",
        },
        ring: {
          DEFAULT: "#CA8A04",
        },
        accent: {
          DEFAULT: "#CA8A04",
          foreground: "#0C0A09",
          gold: "#CA8A04",
          goldLight: "#EAB308",
          blue: "#3B82F6",
          purple: "#8B5CF6",
          green: "#10B981",
          red: "#EF4444",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FAFAF9",
        },
        popover: {
          DEFAULT: "#1C1917",
          foreground: "#FAFAF9",
        },
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
        'slower': '400ms',
        'slowest': '600ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(202, 138, 4, 0.15)',
        'glow-blue': '0 0 40px rgba(59, 130, 246, 0.15)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        "pulse-glow": {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        "fade-in-up": {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        "scale-in": {
          from: {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          to: {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(110%)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)",    opacity: "1" },
          to:   { transform: "translateX(110%)", opacity: "0" },
        },
        "bounce-in": {
          "0%":   { transform: "translateX(110%)" },
          "70%":  { transform: "translateX(-8px)" },
          "85%":  { transform: "translateX(4px)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.88" },
        },
        "shimmer-sweep": {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "notification-dot": {
          "0%, 100%": { transform: "scale(1)" },
          "50%":      { transform: "scale(1.3)" },
        },
        "error-float": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(12px, -16px) scale(1.05)" },
        },
        "error-ping": {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "70%": { transform: "scale(1.15)", opacity: "0" },
          "100%": { transform: "scale(1.15)", opacity: "0" },
        },
        "error-pulse": {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        "error-shake": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(-4deg)" },
          "40%": { transform: "rotate(4deg)" },
          "60%": { transform: "rotate(-2deg)" },
          "80%": { transform: "rotate(2deg)" },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        "pulse-glow": 'pulse-glow 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        "fade-in-up": 'fade-in-up 0.5s ease-out',
        "scale-in": 'scale-in 0.3s ease-out',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-right": "bounce-in 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "slide-out-right": "slide-out-right 0.3s ease-in forwards",
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        "shimmer-sweep": "shimmer-sweep 0.8s ease-in-out",
        "notification-dot": "notification-dot 1.5s ease-in-out infinite",
        "error-float": "error-float 6s ease-in-out infinite",
        "error-ping": "error-ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        "error-pulse": "error-pulse 2s ease-in-out infinite",
        "error-shake": "error-shake 4s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        heading: ["DM Sans", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
