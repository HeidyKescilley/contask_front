// src/app/(protected)/layout.js
"use client";

import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";

export default function ProtectedLayout({ children }) {
  const [theme, setTheme] = useState("light");

  // Synchronize theme with localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
