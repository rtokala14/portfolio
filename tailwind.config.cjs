/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        Expletus: ["Expletus Sans", "sans"],
      },
    },
    colors: {
      primary: "#010201",
      background: "#f1e7e1",
      shadow: "#ededed",
      white: "#ffffff",
    },
  },
  plugins: [],
};
