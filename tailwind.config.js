/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './client/pages/**/*.{js,jsx,ts,tsx}',
    './client/components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          primary: '#e91e8c',
          light: '#f472b6',
          dark: '#c2185b',
        },
        purple: {
          deep: '#2d0036',
          mid: '#4a0060',
          light: '#7b1fa2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
