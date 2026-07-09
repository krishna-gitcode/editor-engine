/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#0f172a',
          panel: '#1e293b',
          border: '#334155',
          accent: '#6366f1',
        }
      }
    },
  },
  plugins: [],
}
