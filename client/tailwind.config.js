/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#08060e',
          900: '#0c0a14',
          850: '#100d1b',
          800: '#15121f',
          700: '#1c1830',
          600: '#262036',
          500: '#332b48',
        },
        brand: {
          50: '#f4f1ff',
          100: '#ece6ff',
          200: '#d9ceff',
          300: '#bda5ff',
          400: '#9d72ff',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        gold: '#f5b94a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
      spacing: {
        4.5: '1.125rem',
        13: '3.25rem',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(139,92,246,0.25), 0 20px 50px -20px rgba(124,58,237,0.5)',
        card: '0 24px 60px -28px rgba(0,0,0,0.85)',
        'inner-line': 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#ec4899 100%)',
        'mesh': 'radial-gradient(at 20% 10%, rgba(124,58,237,0.28) 0px, transparent 55%), radial-gradient(at 85% 20%, rgba(236,72,153,0.18) 0px, transparent 50%), radial-gradient(at 50% 90%, rgba(99,102,241,0.20) 0px, transparent 55%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-pan': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 6s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
      },
    },
  },
  plugins: [],
};
