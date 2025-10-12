// src/context/SidebarContext.jsx

"use client";

import React, { createContext, useState, useEffect } from "react";

export const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  // 1. O padrão agora é 'true' (expandido).
  const [isExpanded, setIsExpanded] = useState(true);

  // 2. Ao carregar, verifica a preferência salva no localStorage.
  useEffect(() => {
    const storedPreference = localStorage.getItem("sidebarExpanded");
    // Se uma preferência ("true" ou "false") for encontrada, aplica ela.
    if (storedPreference !== null) {
      setIsExpanded(JSON.parse(storedPreference));
    }
  }, []); // O array vazio [] garante que isso rode apenas uma vez.

  const toggleSidebar = () => {
    setIsExpanded((currentState) => {
      const newState = !currentState;
      // 3. Salva a nova preferência no localStorage a cada clique.
      localStorage.setItem("sidebarExpanded", JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <SidebarContext.Provider value={{ isExpanded, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};
