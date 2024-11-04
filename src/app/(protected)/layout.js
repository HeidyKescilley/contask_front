// src/app/(protected)/layout.js
"use client";

import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";

export default function ProtectedLayout({ children }) {
  const [theme, setTheme] = useState("light");

  // Sincroniza o tema com o localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  return (
    <>
      <Navbar />
      <div className="bg-light-bg dark:bg-dark-bg min-h-screen w-full">
        {children}
      </div>
    </>
  );
}
