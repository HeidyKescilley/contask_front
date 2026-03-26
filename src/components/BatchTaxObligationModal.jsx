"use client";

import { useState, useEffect, useMemo } from "react";
import { FiX, FiSearch, FiCheck, FiArrowUp, FiArrowDown } from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";
import { invalidateCacheByPrefix } from "../hooks/useCachedFetch";

const REGIMES = ["Simples", "Presumido", "Real", "MEI", "Isenta", "Doméstica"];
const CLASSIFICACOES = ["ICMS", "ISS", "ICMS/ISS", "Outros"];
const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
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

const SortIcon = ({ field, sortField, sortDir }) => {
  if (field !== sortField) return <FiArrowUp size={10} className="opacity-30 ml-0.5" />;
  return sortDir === "asc"
    ? <FiArrowUp size={10} className="ml-0.5 text-primary-500" />
    : <FiArrowDown size={10} className="ml-0.5 text-primary-500" />;
};

/**
 * Modal para adicionar/remover impostos ou obrigações em lote para múltiplas empresas.
 * Props:
 *   onClose: () => void
 *   companies: array de empresas do usuário
 *   onSuccess: () => void — callback após aplicar ação com sucesso
 *   userDepartment: string
 */
export default function BatchTaxObligationModal({ onClose, companies = [], onSuccess, userDepartment }) {
  const [action, setAction]           = useState("add");     // "add" | "remove"
  const [type, setType]               = useState("tax");     // "tax" | "obligation"
  const [itemId, setItemId]           = useState("");
  const [taxes, setTaxes]             = useState([]);
  const [obligations, setObligations] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(false);

  // Filtros
  const [filterUFs, setFilterUFs]         = useState([]);
  const [filterRegimes, setFilterRegimes] = useState([]);
  const [filterClassi, setFilterClassi]   = useState([]);

  // Ordenação
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir]     = useState("asc");

  // Buscar impostos e obrigações filtrados pelo departamento do usuário
  useEffect(() => {
    const deptParam = userDepartment ? `?department=${encodeURIComponent(userDepartment)}` : "";
    api.get(`/tax/all${deptParam}`).then((r) => setTaxes(r.data || [])).catch(() => {});
    api.get(`/obligation/all${deptParam}`).then((r) => setObligations(r.data || [])).catch(() => {});
  }, [userDepartment]);

  const items = type === "tax" ? taxes : obligations;

  const handleSort = (field) => {
    setSortDir((prev) => sortField === field && prev === "asc" ? "desc" : "asc");
    setSortField(field);
  };

  const filteredCompanies = useMemo(() => {
    let result = companies;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          String(c.num || "").includes(q) ||
          String(c.branchNumber || "").includes(q)
      );
    }
    if (filterUFs.length > 0)     result = result.filter((c) => filterUFs.includes(c.uf));
    if (filterRegimes.length > 0) result = result.filter((c) => filterRegimes.includes(c.rule));
    if (filterClassi.length > 0)  result = result.filter((c) => filterClassi.includes(c.classi));

    return [...result].sort((a, b) => {
      const va = String(a[sortField] ?? "");
      const vb = String(b[sortField] ?? "");
      const cmp = va.localeCompare(vb, "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [companies, search, filterUFs, filterRegimes, filterClassi, sortField, sortDir]);

  const toggleCompany = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filteredCompanies.map((c) => c.id)));
  const clearAll  = () => setSelectedIds(new Set());

  const handleSubmit = async () => {
    if (!itemId) { toast.error("Selecione um imposto ou obrigação."); return; }
    if (selectedIds.size === 0) { toast.error("Selecione ao menos uma empresa."); return; }

    setLoading(true);
    try {
      const endpoint = type === "tax" ? "/tax/batch-update" : "/obligation/batch-update";
      const body = type === "tax"
        ? { action, taxId: Number(itemId), companyIds: [...selectedIds] }
        : { action, obligationId: Number(itemId), companyIds: [...selectedIds] };

      const res = await api.post(endpoint, body);
      toast.success(res.data.message);
      invalidateCacheByPrefix("/tax/period-summary");
      invalidateCacheByPrefix("/obligation/period-summary");
      onSuccess?.();
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao aplicar ação em lote.");
    } finally {
      setLoading(false);
    }
  };

  const actionLabel = action === "add" ? "Adicionar" : "Remover";
  const typeLabel   = type === "tax" ? "Imposto" : "Obrigação";
  const thClass = "table-header text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-surface select-none whitespace-nowrap";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
          <h2 className="text-base font-semibold text-light-text dark:text-dark-text">
            Gerenciar em Lote
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Linha 1: Ação + Tipo + Item */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-base mb-2">Ação</label>
              <div className="flex border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
                {[["add", "Adicionar"], ["remove", "Remover"]].map(([val, lbl], i) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAction(val)}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      action === val
                        ? "bg-primary-500 text-white"
                        : "bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50"
                    } ${i > 0 ? "border-l border-gray-200 dark:border-dark-border" : ""}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-base mb-2">Tipo</label>
              <div className="flex border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
                {[["tax", "Imposto"], ["obligation", "Obrigação"]].map(([val, lbl], i) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setType(val); setItemId(""); }}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      type === val
                        ? "bg-primary-500 text-white"
                        : "bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50"
                    } ${i > 0 ? "border-l border-gray-200 dark:border-dark-border" : ""}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-base mb-2">
                {typeLabel} a {actionLabel.toLowerCase()}
              </label>
              <select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="input-base w-full"
              >
                <option value="">Selecione…</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.department && item.department !== type ? `(${item.department})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtros */}
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
          </div>

          {/* Lista de empresas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label-base">
                Empresas ({selectedIds.size} selecionada{selectedIds.size !== 1 ? "s" : ""} de {filteredCompanies.length})
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-xs text-primary-500 hover:underline">Todas visíveis</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={clearAll} className="text-xs text-gray-400 hover:underline">Limpar</button>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="min-w-full">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="table-header w-8 text-center">
                        <input
                          type="checkbox"
                          checked={filteredCompanies.length > 0 && filteredCompanies.every((c) => selectedIds.has(c.id))}
                          onChange={(e) => e.target.checked ? selectAll() : clearAll()}
                          className="accent-primary-500 h-3.5 w-3.5"
                        />
                      </th>
                      <th className={thClass} onClick={() => handleSort("num")}>
                        <span className="inline-flex items-center">Nº <SortIcon field="num" sortField={sortField} sortDir={sortDir} /></span>
                      </th>
                      <th className={thClass} onClick={() => handleSort("name")}>
                        <span className="inline-flex items-center">Razão Social <SortIcon field="name" sortField={sortField} sortDir={sortDir} /></span>
                      </th>
                      <th className={thClass} onClick={() => handleSort("uf")}>
                        <span className="inline-flex items-center">UF <SortIcon field="uf" sortField={sortField} sortDir={sortDir} /></span>
                      </th>
                      <th className={thClass} onClick={() => handleSort("rule")}>
                        <span className="inline-flex items-center">Regime <SortIcon field="rule" sortField={sortField} sortDir={sortDir} /></span>
                      </th>
                      <th className={thClass} onClick={() => handleSort("classi")}>
                        <span className="inline-flex items-center">Classificação <SortIcon field="classi" sortField={sortField} sortDir={sortDir} /></span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.length === 0 ? (
                      <tr><td colSpan={6} className="py-6 text-center text-xs text-gray-400">Nenhuma empresa encontrada.</td></tr>
                    ) : (
                      filteredCompanies.map((company) => {
                        const checked = selectedIds.has(company.id);
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
                            <td className="table-cell text-xs">{company.rule || "–"}</td>
                            <td className="table-cell text-xs">{company.classi || "–"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-dark-border flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary text-sm">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !itemId || selectedIds.size === 0}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <span className="inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiCheck size={14} />
            )}
            {actionLabel} para {selectedIds.size} empresa{selectedIds.size !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
