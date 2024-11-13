/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tema escuro
        "dark-bg": "#121212",
        "dark-card": "#1E1E1E",
        "dark-text": "#FFFFFF",
        "dark-text-secondary": "#B3B3B3",
        "dark-border": "#333333",
        // Cores da logo
        "logo-dark-blue": "#006494",
        "logo-light-blue": "#13293D",
        // Cores de destaque
        "accent-blue": "#62B8E9",
        "accent-green": "#43A047",
        "accent-green-light": "#A5D6A7",
        "accent-red": "#E53935",
        "accent-red-light": "#EF9A9A",
        "accent-purple": "#8E24AA",
        // Tema claro
        "light-bg": "#F3F3F9",
        "light-card": "#FFFFFF",
        "light-text": "#000000",
      },
    },
  },
  plugins: [],
};
