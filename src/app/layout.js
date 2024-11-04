// src/app/layout.js
"use client";

import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("light");

  // Sincroniza o tema com o localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  return (
    <html lang="pt-BR" className={theme === "dark" ? "dark" : ""}>
      <body className="bg-light-bg dark:bg-dark-bg">
        <AuthProvider>
          <ToastContainer />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
