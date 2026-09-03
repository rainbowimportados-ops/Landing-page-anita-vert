/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F1F6F2',
          100: '#DDEBE1',
          200: '#BBD7C4',
          300: '#8FBBA0',
          400: '#5E9878',
          500: '#3B7A5B',
          600: '#2A6148',
          700: '#1F4C39',
          800: '#163A2C',
          900: '#0E2820',
        },
        sand: {
          50: '#FBF9F5',
          100: '#F4EFE6',
          200: '#E8DFCE',
          300: '#D9CBB0',
        },
        gold: {
          400: '#C9A961',
          500: '#A8873C',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      maxWidth: {
        content: '72rem',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
