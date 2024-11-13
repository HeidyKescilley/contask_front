// src/app/layout.js
"use client";

import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import { CompanyModalProvider } from "../context/CompanyModalContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("light");

  // Synchronize theme with localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  return (
    <html lang="pt-BR" className={theme === "dark" ? "dark" : ""}>
      <body className="bg-light-bg dark:bg-dark-bg">
        <AuthProvider>
          <CompanyModalProvider>
            <ToastContainer />
            {children}
            {/* Fixed Theme Toggle Button */}
            <div className="fixed bottom-4 right-4">
              <ThemeToggle />
            </div>
          </CompanyModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
