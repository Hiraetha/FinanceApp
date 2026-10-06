/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10e57a',
          dark: '#0ecc6c',
        },
        surface: {
          DEFAULT: '#0f131e',
          card: '#171b27',
          elevated: '#1e2333',
        },
        background: '#0f131e',
        card: '#171b27',
        border: '#252a3b',
        muted: '#8e96a8',
      },
    },
  },
  plugins: [],
};
