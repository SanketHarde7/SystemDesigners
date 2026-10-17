/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#030712',
          panel: '#0B132B',
          neonCyan: '#00F0FF',
          neonGreen: '#10B981',
          neonAmber: '#F59E0B',
          neonRed: '#EF4444',
          neonPurple: '#A855F7'
        }
      },
      fontFamily: {
        mono: ['Courier New', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}