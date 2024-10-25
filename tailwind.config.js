/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backgroundColor: {
        "primary-color": "#F5F5F5",
        "primary-dark": "#1f1f1f",
        "secundary-dark": "#212529",
      },
      colors: {
        placeholder: "#7F8387",
      },
    },
  },
  plugins: [],
};
