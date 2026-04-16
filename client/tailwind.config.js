/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      maxWidth: {
        '8xl': '88rem',
      },
      colors: {
        primary: '#d76810',
      },
    },
  },
  plugins: [],
}

