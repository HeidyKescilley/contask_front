// src/app/(auth)/layout.js
"use client";

import { useEffect, useState } from "react";

export default function AuthLayout({ children }) {
  const [theme, setTheme] = useState("light");

  // Synchronize theme with localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  return <>{children}</>;
}
