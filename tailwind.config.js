/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ===== TEMA ESCURO (refinado) =====
        "dark-bg": "#0d0f18",
        "dark-card": "#161929",
        "dark-card-hover": "#1e2235",
        "dark-text": "#e2e8f0",
        "dark-text-secondary": "#8892a4",
        "dark-border": "#252a3d",
        "dark-surface": "#111422",

        // ===== TEMA CLARO (refinado) =====
        "light-bg": "#f1f4f8",
        "light-card": "#ffffff",
        "light-text": "#111827",
        "light-text-secondary": "#6b7280",

        // ===== SIDEBAR =====
        "sidebar-bg": "#0b1120",
        "sidebar-hover": "#162032",
        "sidebar-active": "#1e3a5f",

        // ===== CORES PRIMÁRIAS (azul mais vivo) =====
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a5f",
        },

        // ===== CORES DE DESTAQUE =====
        "accent-blue": "#3b82f6",
        "accent-green": "#10b981",
        "accent-green-light": "#6ee7b7",
        "accent-red": "#ef4444",
        "accent-red-light": "#fca5a5",
        "accent-purple": "#8b5cf6",
        "accent-yellow": "#f59e0b",
        "accent-teal": "#14b8a6",

        // ===== CORES DA LOGO =====
        "logo-dark-blue": "#006494",
        "logo-light-blue": "#13293D",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        "card-hover": "0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
        "card-dark": "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)",
        modal: "0 25px 50px -12px rgb(0 0 0 / 0.3)",
        sidebar: "4px 0 24px 0 rgb(0 0 0 / 0.25)",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};
