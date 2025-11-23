/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0faf9',
          100: '#d8f1f0',
          200: '#ade8e6',
          300: '#7edcd9',
          400: '#50c5cf',
          500: '#32a899',
          600: '#218074',
          700: '#1a6860',
          800: '#1a5652',
          900: '#1a4649',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
