// src/components/CompanyFilters.jsx
"use client";

import { useState, useContext } from "react";
import { CompanyModalContext } from "../context/CompanyModalContext";

const CompanyFilters = ({ filters, setFilters, onClearFilters }) => {
  const { openAddCompanyModal } = useContext(CompanyModalContext);

  const searchColumns = [
    { value: "name", label: "Nome" },
    { value: "num", label: "Número" },
    { value: "cnpj", label: "CNPJ" },
    { value: "responsavel", label: "Responsável" },
    { value: "uf", label: "UF" }, // Adicionado UF como opção de pesquisa
  ];

  const regimes = [
    "Simples",
    "Presumido",
    "Real",
    "MEI",
    "Isenta",
    "Doméstica",
  ];
  const situacoes = ["ATIVA", "SUSPENSA", "BAIXADA", "DISTRATO"];
  const classificacoes = ["ICMS", "ISS", "ICMS/ISS", "Outros"];

  const handleInputChange = (e) => {
    setFilters({ ...filters, searchTerm: e.target.value });
  };

  const handleColumnChange = (e) => {
    setFilters({ ...filters, searchColumn: e.target.value });
  };

  const handleCheckboxChange = (e, category) => {
    const { value, checked } = e.target;
    setFilters({
      ...filters,
      [category]: checked
        ? [...filters[category], value]
        : filters[category].filter((item) => item !== value),
    });
  };

  const handleSemFiscalChange = (e) => {
    setFilters({ ...filters, semFiscal: e.target.checked });
  };

  const handleSemDpChange = (e) => {
    setFilters({ ...filters, semDp: e.target.checked });
  };

  return (
    <div className="bg-white dark:bg-dark-card p-4 rounded shadow mb-4">
      {/* Linha superior com campos de pesquisa */}
      <div className="flex flex-wrap items-center justify-start mb-4 space-x-4">
        {/* Seleção de coluna */}
        <div>
          <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
            Coluna:
          </label>
          <select
            value={filters.searchColumn}
            onChange={handleColumnChange}
            className="border px-2 py-1 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
          >
            {searchColumns.map((col) => (
              <option key={col.value} value={col.value}>
                {col.label}
              </option>
            ))}
          </select>
        </div>
        {/* Input de pesquisa */}
        <div>
          <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
            Pesquisa:
          </label>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={handleInputChange}
            className="border px-2 py-1 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
          />
        </div>
      </div>

      {/* Linha de filtros avançados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Regime */}
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800 dark:text-dark-text mb-1">
            Regime:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {regimes.map((regime) => (
              <label
                key={regime}
                className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap"
              >
                <input
                  type="checkbox"
                  value={regime}
                  checked={filters.regime.includes(regime)}
                  onChange={(e) => handleCheckboxChange(e, "regime")}
                  className="mr-1"
                />
                <span>{regime}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Situação */}
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800 dark:text-dark-text mb-1">
            Situação:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {situacoes.map((situacao) => (
              <label
                key={situacao}
                className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap"
              >
                <input
                  type="checkbox"
                  value={situacao}
                  checked={filters.situacao.includes(situacao)}
                  onChange={(e) => handleCheckboxChange(e, "situacao")}
                  className="mr-1"
                />
                <span>{situacao}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Classificação */}
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800 dark:text-dark-text mb-1">
            Classificação:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {classificacoes.map((classi) => (
              <label
                key={classi}
                className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap"
              >
                <input
                  type="checkbox"
                  value={classi}
                  checked={filters.classificacao.includes(classi)}
                  onChange={(e) => handleCheckboxChange(e, "classificacao")}
                  className="mr-1"
                />
                <span>{classi}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sem Responsáveis */}
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800 dark:text-dark-text mb-1">
            Sem Responsáveis:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap">
              <input
                type="checkbox"
                checked={filters.semFiscal || false}
                onChange={handleSemFiscalChange}
                className="mr-1"
              />
              <span>Sem Resp. Fiscal</span>
            </label>
            <label className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap">
              <input
                type="checkbox"
                checked={filters.semDp || false}
                onChange={handleSemDpChange}
                className="mr-1"
              />
              <span>Sem Resp. DP</span>
            </label>
          </div>
        </div>
      </div>

      {/* Botão "Limpar Filtros" */}
      <div className="flex justify-end mt-4">
        <button
          onClick={onClearFilters}
          className="bg-accent-red text-white px-4 py-2 rounded hover:bg-accent-red-light"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};

export default CompanyFilters;
