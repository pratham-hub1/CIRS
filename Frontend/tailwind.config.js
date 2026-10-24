/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern refined dark surfaces (Apple / Tesla / Linear inspired)
        surface: {
          base: '#0A0C10',       // primary deep matte canvas
          card: '#12151D',       // standard elevated card
          elevated: '#171B26',   // hovered or focused surface
          subtle: '#1C212E',     // subtle input / tag fill
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.16)',
        },
        // Clean neutral grayscale
        neutral: {
          850: '#141721',
          900: '#0F1219',
          950: '#0A0C10',
        },
        // Refined, understated accents (NO funky neon glow)
        accent: {
          primary: '#FFFFFF',
          secondary: '#94A3B8',
          muted: '#64748B',
          blue: '#3B82F6',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          purple: '#8B5CF6',
        },
        brand: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        display: [
          '"Space Grotesk"',
          '"Plus Jakarta Sans"',
          'system-ui',
          'sans-serif',
        ],
        sans: [
          '"Plus Jakarta Sans"',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.35)',
        'elevated': '0 12px 32px -4px rgba(0, 0, 0, 0.45)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
