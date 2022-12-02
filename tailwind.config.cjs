/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        expletus: ["var(--expletus-font)"],
        patua: ["var(--patua-one-font)"],
      },
      colors: {
        primary: "#010201",
        background: "#f1e7e1",
        shadow: "#ededed",
        white: "#ffffff",
        secondary_bg: "#edb391",
      },
    },
  },
  plugins: [],
};
