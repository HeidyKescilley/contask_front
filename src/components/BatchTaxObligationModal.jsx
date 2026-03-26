"use client";

import { useState, useEffect, useMemo } from "react";
import { FiX, FiSearch, FiCheck } from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";
import { invalidateCacheByPrefix } from "../hooks/useCachedFetch";

/**
 * Modal para adicionar/remover impostos ou obrigações em lote para múltiplas empresas.
 * Props:
 *   onClose: () => void
 *   companies: array de empresas do usuário
 *   onSuccess: () => void — callback após aplicar ação com sucesso
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

  // Buscar impostos e obrigações filtrados pelo departamento do usuário
  useEffect(() => {
    const deptParam = userDepartment ? `?department=${encodeURIComponent(userDepartment)}` : "";
    api.get(`/tax/all${deptParam}`).then((r) => setTaxes(r.data || [])).catch(() => {});
    api.get(`/obligation/all${deptParam}`).then((r) => setObligations(r.data || [])).catch(() => {});
  }, [userDepartment]);

  const items = type === "tax" ? taxes : obligations;

  const filteredCompanies = useMemo(() => {
    if (!search) return companies;
    const q = search.toLowerCase();
    return companies.filter(
      (c) => c.name.toLowerCase().includes(q) || String(c.num || "").includes(q)
    );
  }, [companies, search]);

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
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao aplicar ação em lote.");
    } finally {
      setLoading(false);
    }
  };

  const actionLabel = action === "add" ? "Adicionar" : "Remover";
  const typeLabel   = type === "tax" ? "Imposto" : "Obrigação";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
          <h2 className="text-base font-semibold text-light-text dark:text-dark-text">
            Gerenciar em Lote
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Linha 1: Ação + Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base mb-2">Ação</label>
              <div className="flex border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
                {["add", "remove"].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAction(a)}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      action === a
                        ? "bg-primary-500 text-white"
                        : "bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50"
                    } ${a === "remove" ? "border-l border-gray-200 dark:border-dark-border" : ""}`}
                  >
                    {a === "add" ? "Adicionar" : "Remover"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-base mb-2">Tipo</label>
              <div className="flex border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
                {["tax", "obligation"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); setItemId(""); }}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      type === t
                        ? "bg-primary-500 text-white"
                        : "bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50"
                    } ${t === "obligation" ? "border-l border-gray-200 dark:border-dark-border" : ""}`}
                  >
                    {t === "tax" ? "Imposto" : "Obrigação"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seleção do item */}
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

          {/* Lista de empresas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-base">Empresas ({selectedIds.size} selecionada{selectedIds.size !== 1 ? "s" : ""})</label>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-xs text-primary-500 hover:underline">Todas</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={clearAll} className="text-xs text-gray-400 hover:underline">Limpar</button>
              </div>
            </div>
            <div className="relative mb-2">
              <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar empresas…"
                className="input-base pl-8 py-1.5 text-xs w-full"
              />
            </div>
            <div className="border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              {filteredCompanies.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nenhuma empresa encontrada.</p>
              ) : (
                filteredCompanies.map((company) => {
                  const checked = selectedIds.has(company.id);
                  return (
                    <label
                      key={company.id}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-surface border-b border-gray-100 dark:border-dark-border last:border-0 transition-colors ${
                        checked ? "bg-primary-50 dark:bg-primary-900/10" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCompany(company.id)}
                        className="accent-primary-500 h-3.5 w-3.5"
                      />
                      <span className="flex-1 text-xs text-light-text dark:text-dark-text truncate">
                        {company.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{company.num}</span>
                    </label>
                  );
                })
              )}
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
