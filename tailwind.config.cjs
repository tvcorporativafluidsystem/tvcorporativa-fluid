/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0B0F17',
        card: '#121826',
        muted: '#97A0B5',
        primary: {
          DEFAULT: '#6EE7B7',
          600: '#34D399',
          700: '#10B981'
        },
        accent: '#60A5FA',
        danger: '#EF4444'
      }
    }
  },
  plugins: []
}
