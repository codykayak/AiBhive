/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './lib/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        hive: {
          bg: '#FAFBFC',
          elevated: '#FFFFFF',
          card: '#F1F5F9',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          amber: '#F5A623',
          amberDim: '#C4841A',
          brand: '#1E3A8A',
          teal: '#2BB8C8',
          steel: '#64748B',
          mist: '#0F172A',
          onPrimary: '#0F172A',
          danger: '#DC2626',
          success: '#16A34A',
          pool: '#2BB8C8',
          electrical: '#F0B429',
          plumbing: '#4A9FD4',
          hvac: '#7B9FD4',
          property: '#7C9A6E',
        },
      },
      borderRadius: {
        hive: '4px',
      },
      fontFamily: {
        display: ['SpaceMono'],
        mono: ['SpaceMono'],
      },
    },
  },
  plugins: [],
};
