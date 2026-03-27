// src/components/CompetenciaSelector.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiChevronDown } from "react-icons/fi";
import { useCompetencia } from "../hooks/useCompetencia";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MONTHS_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function parsePeriod(period) {
  const [y, m] = period.split("-").map(Number);
  return { year: y, month: m }; // month 1-12
}

export default function CompetenciaSelector({ className = "" }) {
  const { selectedPeriod, setPeriod, goToPrev, goToNext, isCurrentMonth, canGoPrev, canGoNext, minPeriod, maxPeriod } = useCompetencia();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => parsePeriod(selectedPeriod).year);
  const containerRef = useRef(null);

  // Fechar o picker ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

  // Sincroniza o ano do picker com o período selecionado quando o picker abre
  useEffect(() => {
    if (pickerOpen) {
      setPickerYear(parsePeriod(selectedPeriod).year);
    }
  }, [pickerOpen, selectedPeriod]);

  const { year: selYear, month: selMonth } = parsePeriod(selectedPeriod);
  const { year: minYear, month: minMonth } = parsePeriod(minPeriod);
  const { year: maxYear, month: maxMonth } = parsePeriod(maxPeriod);

  const label = `${MONTHS_SHORT[selMonth - 1]} ${selYear}`;

  function isMonthDisabled(year, month) {
    const period = `${year}-${String(month).padStart(2, "0")}`;
    return period < minPeriod || period > maxPeriod;
  }

  function handleMonthSelect(month) {
    const period = `${pickerYear}-${String(month).padStart(2, "0")}`;
    if (!isMonthDisabled(pickerYear, month)) {
      setPeriod(period);
      setPickerOpen(false);
    }
  }

  function canDecYear() {
    return pickerYear > minYear;
  }

  function canIncYear() {
    return pickerYear < maxYear;
  }

  return (
    <div ref={containerRef} className={`relative flex items-center gap-1 ${className}`}>
      {/* Botão mês anterior */}
      <button
        onClick={goToPrev}
        disabled={!canGoPrev}
        title="Mês anterior"
        className="flex items-center justify-center w-7 h-7 rounded-lg
          text-light-text-secondary dark:text-dark-text-secondary
          hover:bg-light-hover dark:hover:bg-dark-hover
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-colors"
      >
        <FiChevronLeft size={16} />
      </button>

      {/* Label do período atual — abre o picker */}
      <button
        onClick={() => setPickerOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
          bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border
          text-sm font-medium text-light-text dark:text-dark-text
          hover:border-primary-400 dark:hover:border-primary-500
          transition-colors select-none"
      >
        <span>{label}</span>
        {isCurrentMonth && (
          <span className="text-xs font-normal text-primary-500 dark:text-primary-400">
            atual
          </span>
        )}
        <FiChevronDown size={13} className="text-light-text-secondary dark:text-dark-text-secondary" />
      </button>

      {/* Botão próximo mês */}
      <button
        onClick={goToNext}
        disabled={!canGoNext}
        title="Próximo mês"
        className="flex items-center justify-center w-7 h-7 rounded-lg
          text-light-text-secondary dark:text-dark-text-secondary
          hover:bg-light-hover dark:hover:bg-dark-hover
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-colors"
      >
        <FiChevronRight size={16} />
      </button>

      {/* Dropdown picker de mês/ano */}
      {pickerOpen && (
        <div className="absolute top-full right-0 mt-1 z-50 w-64
          bg-light-card dark:bg-dark-card
          border border-light-border dark:border-dark-border
          rounded-xl shadow-card p-3"
        >
          {/* Header: navegação de ano */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => canDecYear() && setPickerYear((y) => y - 1)}
              disabled={!canDecYear()}
              className="w-7 h-7 flex items-center justify-center rounded-lg
                text-light-text-secondary dark:text-dark-text-secondary
                hover:bg-light-hover dark:hover:bg-dark-hover
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft size={14} />
            </button>
            <span className="text-sm font-semibold text-light-text dark:text-dark-text">
              {pickerYear}
            </span>
            <button
              onClick={() => canIncYear() && setPickerYear((y) => y + 1)}
              disabled={!canIncYear()}
              className="w-7 h-7 flex items-center justify-center rounded-lg
                text-light-text-secondary dark:text-dark-text-secondary
                hover:bg-light-hover dark:hover:bg-dark-hover
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronRight size={14} />
            </button>
          </div>

          {/* Grid de meses (3 × 4) */}
          <div className="grid grid-cols-3 gap-1">
            {MONTHS_SHORT.map((name, idx) => {
              const month = idx + 1;
              const isSelected = pickerYear === selYear && month === selMonth;
              const disabled = isMonthDisabled(pickerYear, month);

              return (
                <button
                  key={month}
                  onClick={() => handleMonthSelect(month)}
                  disabled={disabled}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${isSelected
                      ? "bg-primary-500 text-white"
                      : disabled
                        ? "text-light-text-secondary dark:text-dark-text-secondary opacity-30 cursor-not-allowed"
                        : "text-light-text dark:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover"
                    }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
