/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './lib/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        hive: {
          bg: '#0B0F14',
          elevated: '#121820',
          card: '#1A222D',
          border: '#2A3544',
          amber: '#F5A623',
          amberDim: '#C4841A',
          steel: '#8B9BB0',
          mist: '#E8EEF5',
          danger: '#E85D4C',
          success: '#3DCF8E',
          pool: '#2BB8C8',
          electrical: '#F0B429',
        },
      },
      fontFamily: {
        display: ['SpaceMono'],
        mono: ['SpaceMono'],
      },
    },
  },
  plugins: [],
};
