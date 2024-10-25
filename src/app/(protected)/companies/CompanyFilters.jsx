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
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <div className="flex flex-wrap items-center space-x-4 mb-4">
        {/* Seleção de coluna */}
        <div>
          <label className="block mb-1 dark:text-white">Coluna:</label>
          <select
            value={filters.searchColumn}
            onChange={handleColumnChange}
            className="border px-2 py-1"
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
          <label className="block mb-1 dark:text-white">Pesquisa:</label>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={handleInputChange}
            className="border px-2 py-1"
          />
        </div>
        {/* Botões */}
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            onClick={onAddCompany}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Nova Empresa
          </button>
          <button
            onClick={onClearFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Limpar Filtros
          </button>
        </div>
      </div>
      {/* Filtros avançados */}
      <div className="flex flex-wrap space-x-8">
        {/* Regime */}
        <div>
          <p className="font-semibold dark:text-white">Regime:</p>
          {regimes.map((regime) => (
            <label key={regime} className="block dark:text-white">
              <input
                type="checkbox"
                value={regime}
                checked={filters.regime.includes(regime)}
                onChange={(e) => handleCheckboxChange(e, "regime")}
                className="mr-2"
              />
              {regime}
            </label>
          ))}
        </div>
        {/* Situação */}
        <div>
          <p className="font-semibold dark:text-white">Situação:</p>
          {situacoes.map((situacao) => (
            <label key={situacao} className="block dark:text-white">
              <input
                type="checkbox"
                value={situacao}
                checked={filters.situacao.includes(situacao)}
                onChange={(e) => handleCheckboxChange(e, "situacao")}
                className="mr-2"
              />
              {situacao}
            </label>
          ))}
        </div>
        {/* Classificação */}
        <div>
          <p className="font-semibold dark:text-white">Classificação:</p>
          {classificacoes.map((classi) => (
            <label key={classi} className="block dark:text-white">
              <input
                type="checkbox"
                value={classi}
                checked={filters.classificacao.includes(classi)}
                onChange={(e) => handleCheckboxChange(e, "classificacao")}
                className="mr-2"
              />
              {classi}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyFilters;
