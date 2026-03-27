// src/context/CompetenciaContext.jsx
"use client";

import { createContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "contask_selected_competencia";
const MAX_FUTURE_MONTHS = 18;

function getCurrentMonthString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getPreviousMonthString() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMaxPeriod() {
  const d = new Date();
  d.setMonth(d.getMonth() + MAX_FUTURE_MONTHS);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function addMonths(period, delta) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const CompetenciaContext = createContext();

export const CompetenciaProvider = ({ children }) => {
  const [selectedPeriod, setSelectedPeriod] = useState(getPreviousMonthString);
  const [minPeriod] = useState(getPreviousMonthString); // imutável: mês anterior ao atual

  // Carrega do localStorage (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const min = getPreviousMonthString();
    const max = getMaxPeriod();
    if (stored && /^\d{4}-\d{2}$/.test(stored) && stored >= min && stored <= max) {
      setSelectedPeriod(stored);
    }
    // Se o valor salvo for inválido (fora do range), mantém o mês atual
  }, []);

  const setPeriod = useCallback((period) => {
    const min = getPreviousMonthString();
    const max = getMaxPeriod();
    if (period < min || period > max) return; // silenciosamente ignora fora do range
    setSelectedPeriod(period);
    localStorage.setItem(STORAGE_KEY, period);
  }, []);

  const goToPrev = useCallback(() => {
    setSelectedPeriod((prev) => {
      const min = getPreviousMonthString();
      if (prev <= min) return prev; // já no mínimo
      const next = addMonths(prev, -1);
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const goToNext = useCallback(() => {
    setSelectedPeriod((prev) => {
      const max = getMaxPeriod();
      if (prev >= max) return prev; // já no máximo
      const next = addMonths(prev, 1);
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const isCurrentMonth = selectedPeriod === getPreviousMonthString();
  const canGoPrev = selectedPeriod > getPreviousMonthString();
  const canGoNext = selectedPeriod < getMaxPeriod();

  return (
    <CompetenciaContext.Provider
      value={{
        selectedPeriod,
        setPeriod,
        goToPrev,
        goToNext,
        isCurrentMonth,
        canGoPrev,
        canGoNext,
        minPeriod,
        maxPeriod: getMaxPeriod(),
      }}
    >
      {children}
    </CompetenciaContext.Provider>
  );
};
