// src/components/CompanySelector.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { FiSearch } from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";

const REGIMES = ["Simples", "Presumido", "Real", "MEI", "Isenta", "Doméstica"];
const CLASSIFICACOES = ["ICMS", "ISS", "ICMS/ISS", "Outros"];
const SITUACOES = ["ATIVA", "SUSPENSA", "BAIXADA", "DISTRATO"];
const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const ChipFilter = ({ label, options, selected, onChange }) => {
  const isAll = selected.length === 0;
  return (
    <div>
      <p className="label-base mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => onChange([])}
          className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
            isAll ? "bg-primary-500 text-white border-primary-500" : "border-gray-200 dark:border-dark-border text-gray-500 hover:border-primary-300"
          }`}
        >Todos</button>
        {options.map((opt) => {
          const active = selected.includes(opt.value ?? opt);
          const value = opt.value ?? opt;
          const label = opt.label ?? opt;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(active ? selected.filter((v) => v !== value) : [...selected, value])}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                active ? "bg-primary-500 text-white border-primary-500" : "border-gray-200 dark:border-dark-border text-gray-500 hover:border-primary-300"
              }`}
            >{label}</button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Seletor de empresas com filtros completos (UF, Regime, Classificação, Situação,
 * Responsável, arquivadas) + busca + seleção em massa. Componente controlado:
 * o pai guarda `selectedIds` e recebe as mudanças via `onChange`.
 */
export default function CompanySelector({ selectedIds = [], onChange }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterUFs, setFilterUFs] = useState([]);
  const [filterRegimes, setFilterRegimes] = useState([]);
  const [filterClassi, setFilterClassi] = useState([]);
  const [filterSituacoes, setFilterSituacoes] = useState([]);
  const [filterResponsaveis, setFilterResponsaveis] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/company/all");
        setCompanies(res.data || []);
      } catch {
        toast.error("Erro ao carregar empresas.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const responsavelOptions = useMemo(() => {
    const map = new Map();
    companies.forEach((c) => {
      [c.respFiscal, c.respDp, c.respContabil].forEach((r) => {
        if (r?.id) map.set(r.id, r.name);
      });
    });
    return [...map.entries()]
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    let result = companies;
    if (!showArchived) result = result.filter((c) => !c.isArchived);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        String(c.num || "").includes(q) ||
        String(c.branchNumber || "").includes(q)
      );
    }
    if (filterUFs.length > 0) result = result.filter((c) => filterUFs.includes(c.uf));
    if (filterRegimes.length > 0) result = result.filter((c) => filterRegimes.includes(c.rule));
    if (filterClassi.length > 0) result = result.filter((c) => filterClassi.includes(c.classi));
    if (filterSituacoes.length > 0) result = result.filter((c) => filterSituacoes.includes(c.status));
    if (filterResponsaveis.length > 0) {
      result = result.filter((c) =>
        [c.respFiscal?.id, c.respDp?.id, c.respContabil?.id].some((id) => filterResponsaveis.includes(id))
      );
    }
    return result;
  }, [companies, search, filterUFs, filterRegimes, filterClassi, filterSituacoes, filterResponsaveis, showArchived]);

  const toggleCompany = (id) => {
    const next = new Set(selectedSet);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange([...next]);
  };
  const selectAllVisible = () => {
    const next = new Set(selectedSet);
    filteredCompanies.forEach((c) => next.add(c.id));
    onChange([...next]);
  };
  const clearAllVisible = () => {
    const visibleIds = new Set(filteredCompanies.map((c) => c.id));
    onChange(selectedIds.filter((id) => !visibleIds.has(id)));
  };

  const allVisibleSelected = filteredCompanies.length > 0 && filteredCompanies.every((c) => selectedSet.has(c.id));

  return (
    <div className="space-y-3">
      <div className="border border-gray-100 dark:border-dark-border rounded-xl p-3 space-y-3">
        <div className="relative">
          <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por nome, número ou filial…"
            className="input-base pl-8 py-1.5 text-xs w-full"
          />
        </div>
        <ChipFilter label="UF" options={STATES} selected={filterUFs} onChange={setFilterUFs} />
        <ChipFilter label="Regime" options={REGIMES} selected={filterRegimes} onChange={setFilterRegimes} />
        <ChipFilter label="Classificação" options={CLASSIFICACOES} selected={filterClassi} onChange={setFilterClassi} />
        <ChipFilter label="Situação" options={SITUACOES} selected={filterSituacoes} onChange={setFilterSituacoes} />
        {responsavelOptions.length > 0 && (
          <ChipFilter label="Responsável" options={responsavelOptions} selected={filterResponsaveis} onChange={setFilterResponsaveis} />
        )}
        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-text-secondary cursor-pointer select-none">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Incluir empresas arquivadas
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="label-base !mb-0">
            {selectedIds.length} selecionada{selectedIds.length !== 1 ? "s" : ""} de {companies.length} ({filteredCompanies.length} visível{filteredCompanies.length !== 1 ? "eis" : ""})
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={selectAllVisible} className="text-xs text-primary-500 hover:underline">Marcar todas visíveis</button>
            <span className="text-gray-300">|</span>
            <button type="button" onClick={clearAllVisible} className="text-xs text-gray-400 hover:underline">Desmarcar visíveis</button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400 text-sm">Carregando empresas…</div>
        ) : (
          <div className="border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 bg-white dark:bg-dark-card">
                <tr>
                  <th className="table-header w-8 text-center">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(e) => (e.target.checked ? selectAllVisible() : clearAllVisible())}
                      className="accent-primary-500 h-3.5 w-3.5"
                    />
                  </th>
                  <th className="table-header text-xs">Nº</th>
                  <th className="table-header text-xs">Razão Social</th>
                  <th className="table-header text-xs">UF</th>
                  <th className="table-header text-xs">Situação</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-xs text-gray-400">Nenhuma empresa encontrada.</td></tr>
                ) : (
                  filteredCompanies.map((company) => {
                    const checked = selectedSet.has(company.id);
                    return (
                      <tr
                        key={company.id}
                        onClick={() => toggleCompany(company.id)}
                        className={`cursor-pointer border-b border-gray-100 dark:border-dark-border last:border-0 transition-colors hover:bg-gray-50 dark:hover:bg-dark-surface ${checked ? "bg-primary-50 dark:bg-primary-900/10" : ""}`}
                      >
                        <td className="table-cell text-center !px-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCompany(company.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="accent-primary-500 h-3.5 w-3.5"
                          />
                        </td>
                        <td className="table-cell font-mono text-xs">{company.num}</td>
                        <td className="table-cell text-xs max-w-[220px] truncate">{company.name}</td>
                        <td className="table-cell text-xs text-center">{company.uf || "–"}</td>
                        <td className="table-cell text-xs">{company.status}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
