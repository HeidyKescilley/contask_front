// src/components/CompanySelector.jsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { FiSearch, FiX, FiUpload } from "react-icons/fi";
import * as XLSX from "xlsx";
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
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active ? selected.filter((v) => v !== opt) : [...selected, opt])}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                active ? "bg-primary-500 text-white border-primary-500" : "border-gray-200 dark:border-dark-border text-gray-500 hover:border-primary-300"
              }`}
            >{opt}</button>
          );
        })}
      </div>
    </div>
  );
};

const PersonSelect = ({ label, options, value, onChange }) => (
  <div>
    <label className="label-base">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input-base py-1.5 text-xs">
      <option value="">Todos</option>
      {options.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  </div>
);

// Lista, sem duplicar, quem ocupa um determinado papel (respFiscal/respDp/respContabil),
// com o id sempre como string — evita qualquer descompasso number/string ao comparar
// com o value (sempre string) de um <select> nativo.
function distinctPeople(companies, field) {
  const map = new Map();
  companies.forEach((c) => {
    const person = c[field];
    if (person?.id != null) map.set(String(person.id), person.name);
  });
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function distinctGroups(companies) {
  const map = new Map();
  companies.forEach((c) => {
    if (c.grupo?.id != null) map.set(String(c.grupo.id), c.grupo.name);
  });
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

// Normaliza CNPJ para comparação: remove máscara (.,/,-, espaços) e padroniza em
// maiúsculas (aceita CNPJ alfanumérico). Planilhas numéricas perdem zeros à esquerda,
// então CNPJs só com dígitos são completados até 14 posições.
function normalizeCnpj(value) {
  if (value == null) return "";
  let raw = typeof value === "number" ? String(Math.round(value)) : String(value);
  raw = raw.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
  if (/^\d+$/.test(raw) && raw.length < 14) raw = raw.padStart(14, "0");
  return raw;
}

const normalizeHeader = (h) => String(h ?? "").replace(/[^a-zA-Z]/g, "").toUpperCase();

const EMPTY_FILTERS = {
  search: "",
  ufs: [],
  regimes: [],
  classi: [],
  situacoes: [],
  grupoId: "",
  respFiscalId: "",
  respDpId: "",
  respContabilId: "",
  showArchived: false,
};

/**
 * Seletor de empresas com filtros completos (UF, Regime, Classificação, Situação,
 * Grupo, Responsável por departamento, arquivadas) + busca + seleção em massa.
 * Componente controlado: o pai guarda `selectedIds` e recebe as mudanças via `onChange`.
 */
export default function CompanySelector({ selectedIds = [], onChange }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const fileInputRef = useRef(null);

  const handleImportSheet = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
      if (rows.length === 0) {
        toast.error("A planilha está vazia.");
        return;
      }
      const cnpjKey = Object.keys(rows[0]).find((k) => normalizeHeader(k) === "CNPJ");
      if (!cnpjKey) {
        toast.error('Coluna "CNPJ" não encontrada na planilha.');
        return;
      }

      const byCnpj = new Map();
      companies.forEach((c) => {
        const key = normalizeCnpj(c.cnpj);
        if (key) byCnpj.set(key, [...(byCnpj.get(key) || []), c]);
      });

      const matchedIds = new Set();
      const notFound = [];
      let hasArchived = false;
      const seen = new Set();
      rows.forEach((row) => {
        const key = normalizeCnpj(row[cnpjKey]);
        if (!key || seen.has(key)) return;
        seen.add(key);
        const found = byCnpj.get(key);
        if (!found) {
          notFound.push(String(row[cnpjKey]));
          return;
        }
        found.forEach((c) => {
          matchedIds.add(c.id);
          if (c.isArchived) hasArchived = true;
        });
      });

      if (matchedIds.size === 0) {
        toast.error("Nenhuma empresa da planilha foi encontrada pelo CNPJ.");
        return;
      }
      onChange([...new Set([...selectedIds, ...matchedIds])]);
      if (hasArchived) setFilter("showArchived", true);
      toast.success(`${matchedIds.size} empresa(s) selecionada(s) pela planilha.`);
      if (notFound.length > 0) {
        const preview = notFound.slice(0, 5).join(", ");
        toast.warn(`${notFound.length} CNPJ(s) não encontrado(s): ${preview}${notFound.length > 5 ? "…" : ""}`);
      }
    } catch {
      toast.error("Não foi possível ler a planilha.");
    }
  };

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

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const fiscalOptions = useMemo(() => distinctPeople(companies, "respFiscal"), [companies]);
  const dpOptions = useMemo(() => distinctPeople(companies, "respDp"), [companies]);
  const contabilOptions = useMemo(() => distinctPeople(companies, "respContabil"), [companies]);
  const groupOptions = useMemo(() => distinctGroups(companies), [companies]);

  const activeFilterCount = [
    filters.ufs.length, filters.regimes.length, filters.classi.length, filters.situacoes.length,
    filters.grupoId ? 1 : 0, filters.respFiscalId ? 1 : 0, filters.respDpId ? 1 : 0, filters.respContabilId ? 1 : 0,
    filters.showArchived ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const filteredCompanies = useMemo(() => {
    let result = companies;
    if (!filters.showArchived) result = result.filter((c) => !c.isArchived);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        String(c.num || "").includes(q) ||
        String(c.branchNumber || "").includes(q) ||
        (c.respFiscal?.name || "").toLowerCase().includes(q) ||
        (c.respDp?.name || "").toLowerCase().includes(q) ||
        (c.respContabil?.name || "").toLowerCase().includes(q)
      );
    }
    if (filters.ufs.length > 0) result = result.filter((c) => filters.ufs.includes(c.uf));
    if (filters.regimes.length > 0) result = result.filter((c) => filters.regimes.includes(c.rule));
    if (filters.classi.length > 0) result = result.filter((c) => filters.classi.includes(c.classi));
    if (filters.situacoes.length > 0) result = result.filter((c) => filters.situacoes.includes(c.status));
    if (filters.grupoId) result = result.filter((c) => String(c.grupo?.id ?? "") === filters.grupoId);
    if (filters.respFiscalId) result = result.filter((c) => String(c.respFiscal?.id ?? "") === filters.respFiscalId);
    if (filters.respDpId) result = result.filter((c) => String(c.respDp?.id ?? "") === filters.respDpId);
    if (filters.respContabilId) result = result.filter((c) => String(c.respContabil?.id ?? "") === filters.respContabilId);
    return result;
  }, [companies, filters]);

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
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              placeholder="Filtrar por nome, número, filial ou responsável…"
              className="input-base pl-8 py-1.5 text-xs w-full"
            />
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-500 whitespace-nowrap"
            >
              <FiX size={12} /> Limpar ({activeFilterCount})
            </button>
          )}
        </div>

        <ChipFilter label="UF" options={STATES} selected={filters.ufs} onChange={(v) => setFilter("ufs", v)} />
        <ChipFilter label="Regime" options={REGIMES} selected={filters.regimes} onChange={(v) => setFilter("regimes", v)} />
        <ChipFilter label="Classificação" options={CLASSIFICACOES} selected={filters.classi} onChange={(v) => setFilter("classi", v)} />
        <ChipFilter label="Situação" options={SITUACOES} selected={filters.situacoes} onChange={(v) => setFilter("situacoes", v)} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {groupOptions.length > 0 && (
            <div>
              <label className="label-base">Grupo</label>
              <select value={filters.grupoId} onChange={(e) => setFilter("grupoId", e.target.value)} className="input-base py-1.5 text-xs">
                <option value="">Todos</option>
                {groupOptions.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}
          {fiscalOptions.length > 0 && (
            <PersonSelect label="Resp. Fiscal" options={fiscalOptions} value={filters.respFiscalId} onChange={(v) => setFilter("respFiscalId", v)} />
          )}
          {dpOptions.length > 0 && (
            <PersonSelect label="Resp. DP" options={dpOptions} value={filters.respDpId} onChange={(v) => setFilter("respDpId", v)} />
          )}
          {contabilOptions.length > 0 && (
            <PersonSelect label="Resp. Contábil" options={contabilOptions} value={filters.respContabilId} onChange={(v) => setFilter("respContabilId", v)} />
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-text-secondary cursor-pointer select-none">
          <input type="checkbox" checked={filters.showArchived} onChange={(e) => setFilter("showArchived", e.target.checked)} />
          Incluir empresas arquivadas
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="label-base !mb-0">
            {selectedIds.length} selecionada{selectedIds.length !== 1 ? "s" : ""} de {companies.length} ({filteredCompanies.length} visível{filteredCompanies.length !== 1 ? "eis" : ""})
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              title="Planilha com coluna CNPJ"
              className="flex items-center gap-1 text-xs text-primary-500 hover:underline disabled:opacity-50"
            >
              <FiUpload size={12} /> Importar planilha (CNPJ)
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportSheet} className="hidden" />
            <span className="text-gray-300">|</span>
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
                  <th className="table-header text-xs">Resp. Fiscal</th>
                  <th className="table-header text-xs">Resp. DP</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length === 0 ? (
                  <tr><td colSpan={7} className="py-6 text-center text-xs text-gray-400">Nenhuma empresa encontrada.</td></tr>
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
                        <td className="table-cell text-xs max-w-[200px] truncate">{company.name}</td>
                        <td className="table-cell text-xs text-center">{company.uf || "–"}</td>
                        <td className="table-cell text-xs">{company.status}</td>
                        <td className="table-cell text-xs max-w-[110px] truncate">{company.respFiscal?.name || "–"}</td>
                        <td className="table-cell text-xs max-w-[110px] truncate">{company.respDp?.name || "–"}</td>
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
