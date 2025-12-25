/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Academic Navy/Gold Color Palette
        'navy': {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#091B2B',
          950: '#061422',
        },
        'gold': {
          50: '#fefcf3',
          100: '#fdf8e1',
          200: '#faefc3',
          300: '#f5e29a',
          400: '#E7C29C',
          500: '#d4a574',
          600: '#c08b52',
          700: '#a67340',
          800: '#8a5e36',
          900: '#724d2f',
        },
        'teal': {
          400: '#20A8A5',
          500: '#1C8394',
          600: '#176e7d',
        },
      },
      fontFamily: {
        'serif': ['Merriweather', 'Georgia', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'arabic': ['Noto Sans Arabic', 'Tahoma', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'academic': '0 4px 6px -1px rgba(9, 27, 43, 0.1), 0 2px 4px -1px rgba(9, 27, 43, 0.06)',
        'card': '0 10px 15px -3px rgba(9, 27, 43, 0.1), 0 4px 6px -2px rgba(9, 27, 43, 0.05)',
        'elevated': '0 20px 25px -5px rgba(9, 27, 43, 0.1), 0 10px 10px -5px rgba(9, 27, 43, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
