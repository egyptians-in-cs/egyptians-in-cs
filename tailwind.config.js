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
        'glow': '0 0 20px rgba(231, 194, 156, 0.3)',
        'glow-lg': '0 0 40px rgba(231, 194, 156, 0.4)',
        'glow-teal': '0 0 20px rgba(28, 131, 148, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(231, 194, 156, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-gold': 'linear-gradient(135deg, #E7C29C 0%, #d4a574 50%, #c08b52 100%)',
        'gradient-navy': 'linear-gradient(135deg, #091B2B 0%, #243b53 50%, #334e68 100%)',
        'gradient-teal': 'linear-gradient(135deg, #1C8394 0%, #20A8A5 100%)',
        'gradient-hero': 'linear-gradient(135deg, #091B2B 0%, #102a43 50%, #1C8394 100%)',
        'dots-pattern': 'radial-gradient(circle, #bcccdc 1px, transparent 1px)',
        'grid-pattern': 'linear-gradient(to right, #bcccdc 1px, transparent 1px), linear-gradient(to bottom, #bcccdc 1px, transparent 1px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'count-up': 'countUp 1s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(231, 194, 156, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(231, 194, 156, 0.6)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionDuration: {
        '400': '400ms',
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
      },
    },
  },
  plugins: [],
}
