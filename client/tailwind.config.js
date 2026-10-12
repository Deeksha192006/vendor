/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1.05rem' }],
        'xs': ['0.8125rem', { lineHeight: '1.25rem' }],
        'sm': ['0.9375rem', { lineHeight: '1.45rem' }],
        'base': ['1.0625rem', { lineHeight: '1.65rem' }],
        'lg': ['1.1875rem', { lineHeight: '1.75rem' }],
        'xl': ['1.3125rem', { lineHeight: '1.85rem' }],
        '2xl': ['1.625rem', { lineHeight: '2.1rem' }],
        '3xl': ['2rem', { lineHeight: '2.4rem' }],
      },
      colors: {
        brand: {
          red: '#ED1C2E',
          'red-hover': '#D91425',
          'red-light': '#FEE8EA',
          orange: '#F7941D',
          'orange-hover': '#E08012',
          'orange-light': '#FEF4E8',
          navy: '#30358F',
          'navy-hover': '#252972',
          'navy-light': '#EAEBFA',
          light: '#F7F7F9',
          dark: '#222222',
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#ED1C2E',
          700: '#be123c',
          800: '#9f1239',
          900: '#30358F',
        },
        gold: {
          400: '#F7941D',
          500: '#E08012',
          600: '#c86f0c',
        },
        dark: {
          800: '#2c2c2c',
          900: '#222222',
          950: '#141414',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
