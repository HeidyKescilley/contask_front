// src/app/(protected)/companies/CompanyFilters.jsx
"use client";

import { useState } from "react";

const CompanyFilters = ({
  filters,
  setFilters,
  onAddCompany,
  onClearFilters,
}) => {
  const searchColumns = [
    { value: "name", label: "Nome" },
    { value: "num", label: "Número" },
    { value: "cnpj", label: "CNPJ" },
    // Adicione outras colunas se necessário
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

  return (
    <div className="bg-white dark:bg-dark-card p-4 rounded shadow mb-4">
      {/* Linha superior com campos de pesquisa e botão "Nova Empresa" */}
      <div className="flex flex-wrap items-center justify-between mb-4">
        {/* Campos de pesquisa */}
        <div className="flex flex-wrap items-center space-x-4">
          {/* Seleção de coluna */}
          <div>
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
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
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
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
        {/* Botão "Nova Empresa" */}
        <div className="mt-4 md:mt-0">
          <button
            onClick={onAddCompany}
            className="bg-green-500 dark:bg-accent-green text-white px-4 py-2 rounded"
          >
            Nova Empresa
          </button>
        </div>
      </div>
      {/* Linha de filtros avançados */}
      <div className="flex flex-wrap items-center space-x-4">
        {/* Regime */}
        <div className="flex items-center space-x-2">
          <p className="font-semibold text-gray-800 dark:text-dark-text">
            Regime:
          </p>
          {regimes.map((regime) => (
            <label
              key={regime}
              className="flex items-center text-gray-800 dark:text-dark-text"
            >
              <input
                type="checkbox"
                value={regime}
                checked={filters.regime.includes(regime)}
                onChange={(e) => handleCheckboxChange(e, "regime")}
                className="mr-1"
              />
              <span className="mr-2">{regime}</span>
            </label>
          ))}
        </div>
        {/* Situação */}
        <div className="flex items-center space-x-2">
          <p className="font-semibold text-gray-800 dark:text-dark-text">
            Situação:
          </p>
          {situacoes.map((situacao) => (
            <label
              key={situacao}
              className="flex items-center text-gray-800 dark:text-dark-text"
            >
              <input
                type="checkbox"
                value={situacao}
                checked={filters.situacao.includes(situacao)}
                onChange={(e) => handleCheckboxChange(e, "situacao")}
                className="mr-1"
              />
              <span className="mr-2">{situacao}</span>
            </label>
          ))}
        </div>
        {/* Classificação */}
        <div className="flex items-center space-x-2">
          <p className="font-semibold text-gray-800 dark:text-dark-text">
            Classificação:
          </p>
          {classificacoes.map((classi) => (
            <label
              key={classi}
              className="flex items-center text-gray-800 dark:text-dark-text"
            >
              <input
                type="checkbox"
                value={classi}
                checked={filters.classificacao.includes(classi)}
                onChange={(e) => handleCheckboxChange(e, "classificacao")}
                className="mr-1"
              />
              <span className="mr-2">{classi}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Botão "Limpar Filtros" */}
      <div className="flex justify-end mt-4">
        <button
          onClick={onClearFilters}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};

export default CompanyFilters;
