/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // dark theme
        "dark-bg": "#121212",
        "dark-card": "#1E1E1E",
        "dark-text": "#FFFFFF",
        "dark-text-secondary": "#B3B3B3",
        "dark-border": "#333333",
        "accent-blue": "#1E88E5",
        "accent-green": "#43A047",
        "accent-purple": "#8E24AA",
        // white theme
        "light-bg": "#FFFFFF",
        "light-text": "#000000",
      },
    },
  },
  plugins: [],
};
