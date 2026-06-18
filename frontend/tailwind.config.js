/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          dark: '#030d16',      // Premium deep dark blue
          card: 'rgba(5, 23, 38, 0.45)', // Glassmorphism card fill
          cyan: '#00f2fe',      // Laser cyber cyan
          blue: '#0984e3',      // Modern royal medical blue
          green: '#00b894',     // Bio green glow
          purple: '#6c5ce7',    // Futuristic purple highlight
          glow: 'rgba(0, 242, 254, 0.15)'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        '3d-cyan': '0 8px 32px 0 rgba(0, 242, 254, 0.18), inset 0 0 1px 0 rgba(255, 255, 255, 0.25)',
        '3d-blue': '0 8px 32px 0 rgba(9, 132, 227, 0.18), inset 0 0 1px 0 rgba(255, 255, 255, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 0 0.5px 0 rgba(255, 255, 255, 0.12)',
        'glass-hover': '0 12px 40px 0 rgba(0, 242, 254, 0.25), inset 0 0 1px 0 rgba(255, 255, 255, 0.25)'
      },
      animation: {
        'gradient-flow': 'gradientFlow 16s ease infinite',
        'glow-drift': 'glowDrift 22s ease-in-out infinite alternate',
        'grid-drift': 'gridDrift 45s linear infinite',
      }
    },
  },
  plugins: [],
}
