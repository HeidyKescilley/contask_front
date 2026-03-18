// src/components/ThemeToggle.jsx
"use client";

import { useContext } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { ThemeContext } from "../context/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-xl bg-gray-100 dark:bg-dark-card-hover
        hover:bg-gray-200 dark:hover:bg-dark-border
        border border-gray-200 dark:border-dark-border
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary-500/40
        shadow-sm hover:shadow-md"
      aria-label="Alternar tema"
    >
      <div className="relative w-5 h-5">
        {theme === "dark" ? (
          <FiSun className="w-5 h-5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <FiMoon className="w-5 h-5 text-slate-600 transition-transform duration-300" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
