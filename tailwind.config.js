/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#FFF8F0',
          100: '#FEF0DC',
          200: '#FCE0BA',
        },
        terra: {
          50: '#FDF0E8',
          100: '#FAD9C6',
          200: '#F5B89B',
          300: '#EF9070',
          400: '#C97B5A',
          500: '#A85F42',
          600: '#8A4830',
        },
        sage: {
          50: '#F0F5F0',
          100: '#D4E4D4',
          200: '#AECBAE',
          300: '#88B088',
          400: '#628D62',
          500: '#4E714E',
          600: '#3A553A',
        },
        amber: {
          50: '#FDF6ED',
          100: '#FAE5C5',
          200: '#F5CC8A',
          300: '#E9AE55',
          400: '#D4913A',
          500: '#B87730',
          600: '#9A5E22',
        },
      },
    },
  },
  plugins: [],
}
