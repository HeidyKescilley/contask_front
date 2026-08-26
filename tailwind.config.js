/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ===== TEMA ESCURO (OKLCH, neutros frios) =====
        "dark-bg": "oklch(17% 0.009 250)",
        "dark-card": "oklch(21% 0.009 250)",
        "dark-card-hover": "oklch(28% 0.01 250)",
        "dark-text": "oklch(95% 0.004 250)",
        "dark-text-secondary": "oklch(65% 0.012 250)",
        "dark-border": "oklch(31% 0.011 250)",
        "dark-surface": "oklch(25.5% 0.009 250)", // superficie alt (input/table-header)

        // ===== TEMA CLARO (OKLCH, neutros frios) =====
        "light-bg": "oklch(97.5% 0.003 250)",
        "light-card": "oklch(99.2% 0.002 250)",
        "light-surface-alt": "oklch(95.5% 0.004 250)",
        "light-border": "oklch(90% 0.006 250)",
        "light-text": "oklch(22% 0.012 250)",
        "light-text-secondary": "oklch(50% 0.012 250)",

        // ===== SIDEBAR =====
        "sidebar-bg": "#0b1120",
        "sidebar-hover": "#162032",
        "sidebar-active": "#1e3a5f",

        // ===== COR DE DESTAQUE (teal) =====
        primary: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
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

        // ===== CORES DE STATUS (pastel, mesmo matiz claro/escuro) =====
        "status-success-bg": "oklch(93% 0.05 150)",
        "status-success-bg-dark": "oklch(27% 0.05 150)",
        "status-success-text": "oklch(38% 0.09 150)",
        "status-success-text-dark": "oklch(82% 0.09 150)",
        "status-warning-bg": "oklch(93% 0.06 75)",
        "status-warning-bg-dark": "oklch(29% 0.06 75)",
        "status-warning-text": "oklch(40% 0.11 75)",
        "status-warning-text-dark": "oklch(82% 0.11 75)",
        "status-error-bg": "oklch(93% 0.045 25)",
        "status-error-bg-dark": "oklch(27% 0.045 25)",
        "status-error-text": "oklch(42% 0.14 25)",
        "status-error-text-dark": "oklch(82% 0.12 25)",

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
