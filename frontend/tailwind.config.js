/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a8a',
          light: '#3b82f6',
        },
        secondary: '#3b82f6',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        text: {
          DEFAULT: '#1f2937',
          light: '#6b7280',
        },
      },
    },
  },
  plugins: [],
}

