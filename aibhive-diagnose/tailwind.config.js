/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './lib/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        hive: {
          bg: '#FFFFFF',
          elevated: '#F8FAFC',
          surface: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          ink: '#0F172A',
          muted: '#64748B',
          amber: '#F5A623',
          orange: '#F5A623',
          navy: '#1E3A8A',
          amberDim: '#D4880C',
          mist: '#0F172A',
          steel: '#64748B',
          danger: '#DC2626',
          success: '#16A34A',
          pool: '#0891B2',
          electrical: '#F5A623',
          plumbing: '#2563EB',
          hvac: '#1E3A8A',
        },
      },
      borderRadius: {
        hive: '4px',
      },
      fontFamily: {
        display: ['SpaceMono'],
        mono: ['SpaceMono'],
      },
      borderRadius: {
        box: '8px',
      },
    },
  },
  plugins: [],
};
