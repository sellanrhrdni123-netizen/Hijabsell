/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nvdila: {
          bg: '#FAF8F5',
          cream: '#F4EFEB',
          warm: '#EAE2D8',
          taupe: '#A38F7D',
          mocha: '#8C7A6B',
          darkMocha: '#5C4E44',
          charcoal: '#332C2B',
          sand: '#D8CBBF',
          rose: '#D29E8E',
          softRose: '#F7ECE9',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
