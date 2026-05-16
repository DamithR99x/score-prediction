/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Stadium-night palette
        pitch: {
          950: '#05070d',
          900: '#0a0f1a',
          800: '#101827',
          700: '#1a2436',
        },
        turf: {
          400: '#3ddc97',
          500: '#1fb574',
          600: '#0f8c57',
        },
        leather: {
          400: '#ff7849',
          500: '#e85d2f',
          600: '#b8431f',
        },
        floodlight: {
          300: '#f5d76e',
          400: '#f1c40f',
        },
        boundary: {
          400: '#5eead4',
          500: '#22d3ee',
          600: '#0ea5e9',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-turf': '0 0 40px -8px rgba(61,220,151,0.55)',
        'glow-leather': '0 0 40px -8px rgba(232,93,47,0.55)',
        'glow-boundary': '0 0 40px -8px rgba(34,211,238,0.5)',
        'inset-ring': 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
      },
      backgroundImage: {
        'stadium-grid':
          'radial-gradient(circle at 50% 0%, rgba(61,220,151,0.12), transparent 55%), radial-gradient(circle at 90% 90%, rgba(34,211,238,0.10), transparent 60%), linear-gradient(180deg, #05070d 0%, #0a0f1a 100%)',
        'pitch-stripes':
          'repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0 24px, rgba(255,255,255,0) 24px 48px)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ticker': 'ticker 30s linear infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
