/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#10b981', // Emerald 500
          light: '#d1fae5', // Emerald 100
          dark: '#059669', // Emerald 600
        },
        danger: {
          DEFAULT: '#e11d48', // Rose 600
          light: '#ffe4e6', // Rose 100
        },
        info: {
          DEFAULT: '#3b82f6', // Blue 500
          light: '#dbeafe', // Blue 100
        },
        ink: {
          DEFAULT: '#0f172a', // Slate 900
          muted: '#64748b', // Slate 500
          light: '#94a3b8', // Slate 400
        },
        surface: {
          DEFAULT: '#ffffff',
          dim: '#f8fafc', // Slate 50
          dark: '#f1f5f9', // Slate 100
          border: '#e2e8f0', // Slate 200
        }
      }
    }
  },
  plugins: []
}

