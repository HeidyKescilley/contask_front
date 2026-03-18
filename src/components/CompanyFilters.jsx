// src/components/CompanyFilters.jsx
"use client";

import { memo, useContext } from "react";
import { FiX, FiSearch, FiArchive } from "react-icons/fi";
import { CompanyModalContext } from "../context/CompanyModalContext";

const CHECKBOX_ROW =
  "flex items-center gap-1.5 text-sm text-gray-700 dark:text-dark-text-secondary cursor-pointer whitespace-nowrap select-none";

const FilterGroup = ({ label, children }) => (
  <div>
    <p className="label-base mb-2">{label}</p>
    <div className="flex flex-wrap gap-x-3 gap-y-1.5">{children}</div>
  </div>
);

const CheckItem = ({ value, checked, onChange, label }) => (
  <label className={CHECKBOX_ROW}>
    <input
      type="checkbox"
      value={value}
      checked={checked}
      onChange={onChange}
    />
    {label ?? value}
  </label>
);

const CompanyFilters = ({ filters, setFilters, onClearFilters }) => {
  const { openAddCompanyModal } = useContext(CompanyModalContext);

  const searchColumns = [
    { value: "name",        label: "Nome" },
    { value: "num",         label: "Número" },
    { value: "cnpj",        label: "CNPJ" },
    { value: "responsavel", label: "Responsável" },
    { value: "uf",          label: "UF" },
  ];

  const regimes        = ["Simples", "Presumido", "Real", "MEI", "Isenta", "Doméstica"];
  const situacoes      = ["ATIVA", "SUSPENSA", "BAIXADA", "DISTRATO"];
  const classificacoes = ["ICMS", "ISS", "ICMS/ISS", "Outros"];

  const toggle = (category, value) => {
    const current = filters[category];
    setFilters({
      ...filters,
      [category]: current.includes(value)
        ? current.filter((i) => i !== value)
        : [...current, value],
    });
  };

  const activeFilterCount = [
    filters.regime.length,
    filters.situacao.length,
    filters.classificacao.length,
    filters.semFiscal ? 1 : 0,
    filters.semDp     ? 1 : 0,
    filters.showArchived ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="card mb-4 space-y-4">

      {/* ── Linha de busca ─────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label-base">Coluna</label>
          <select
            value={filters.searchColumn}
            onChange={(e) => setFilters({ ...filters, searchColumn: e.target.value })}
            className="input-base !w-auto min-w-[110px]"
          >
            {searchColumns.map((col) => (
              <option key={col.value} value={col.value}>{col.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <label className="label-base">Pesquisa</label>
          <div className="relative">
            <FiSearch
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              placeholder="Digite para buscar..."
              className="input-base pl-8"
            />
          </div>
        </div>

        <div className="flex items-end gap-2 pb-px">
          {activeFilterCount > 0 && (
            <span className="text-[11px] text-gray-400 dark:text-dark-text-secondary whitespace-nowrap">
              {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""} ativo{activeFilterCount > 1 ? "s" : ""}
            </span>
          )}
          <button onClick={onClearFilters} className="btn-danger text-xs">
            <FiX size={13} />
            Limpar
          </button>
        </div>
      </div>

      {/* ── Linha divisória ─────────────────────────────────── */}
      <div className="border-t border-gray-100 dark:border-dark-border" />

      {/* ── Filtros avançados ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">

        {/* Regime */}
        <FilterGroup label="Regime">
          {regimes.map((r) => (
            <CheckItem
              key={r}
              value={r}
              checked={filters.regime.includes(r)}
              onChange={() => toggle("regime", r)}
            />
          ))}
        </FilterGroup>

        {/* Situação */}
        <FilterGroup label="Situação">
          {situacoes.map((s) => (
            <CheckItem
              key={s}
              value={s}
              checked={filters.situacao.includes(s)}
              onChange={() => toggle("situacao", s)}
            />
          ))}
        </FilterGroup>

        {/* Classificação */}
        <FilterGroup label="Classificação">
          {classificacoes.map((c) => (
            <CheckItem
              key={c}
              value={c}
              checked={filters.classificacao.includes(c)}
              onChange={() => toggle("classificacao", c)}
            />
          ))}
        </FilterGroup>

        {/* Responsáveis */}
        <FilterGroup label="Responsáveis">
          <CheckItem
            value="semFiscal"
            checked={filters.semFiscal}
            onChange={(e) => setFilters({ ...filters, semFiscal: e.target.checked })}
            label="Sem Resp. Fiscal"
          />
          <CheckItem
            value="semDp"
            checked={filters.semDp}
            onChange={(e) => setFilters({ ...filters, semDp: e.target.checked })}
            label="Sem Resp. DP"
          />
        </FilterGroup>

        {/* Visualização */}
        <FilterGroup label="Visualização">
          <label
            className={`flex items-center gap-2 cursor-pointer select-none rounded-lg px-2.5 py-1.5
              border transition-all duration-150 text-sm font-medium w-full
              ${filters.showArchived
                ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-500/50"
                : "border-gray-200 dark:border-dark-border text-gray-500 dark:text-dark-text-secondary hover:border-gray-300 dark:hover:border-dark-text-secondary"
              }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={filters.showArchived}
              onChange={(e) => setFilters({ ...filters, showArchived: e.target.checked })}
            />
            <FiArchive size={14} className="flex-shrink-0" />
            <span>Arquivadas</span>
            {filters.showArchived && (
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wide opacity-70">
                ativo
              </span>
            )}
          </label>
        </FilterGroup>

      </div>
    </div>
  );
};

export default memo(CompanyFilters);
