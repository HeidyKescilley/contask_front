"use client";

import { useState, useEffect, useCallback } from "react";
import { FiX, FiRefreshCw } from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: "Pendentes",    cls: "badge-amber",  tabCls: "border-amber-400 text-amber-600" },
  completed: { label: "Concluídas",   cls: "badge-green",  tabCls: "border-emerald-400 text-emerald-600" },
  disabled:  { label: "Desabilitadas", cls: "badge-gray",  tabCls: "border-gray-300 text-gray-500" },
};

// ── Modal ─────────────────────────────────────────────────────────────────────
const CompanyListModal = ({ type, item, period, onClose }) => {
  // type: "obligation" | "tax"
  // item: { id, name }
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  const fetchData = useCallback(async () => {
    if (!item?.id) return;
    setLoading(true);
    try {
      const endpoint = type === "tax"
        ? `/tax/companies/${item.id}${period ? `?period=${period}` : ""}`
        : `/obligation/companies/${item.id}${period ? `?period=${period}` : ""}`;
      const res = await api.get(endpoint);
      setCompanies(res.data.companies || []);
    } catch {
      toast.error("Erro ao carregar lista de empresas.");
    } finally {
      setLoading(false);
    }
  }, [type, item?.id, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pending   = companies.filter((c) => c.status === "pending");
  const completed = companies.filter((c) => c.status === "completed");
  const disabled  = companies.filter((c) => c.status === "disabled");

  // Taxes have no disabled state — default to pending; skip disabled tab
  const tabs = type === "tax"
    ? ["pending", "completed"]
    : ["pending", "completed", "disabled"];

  const currentList =
    activeTab === "pending"   ? pending   :
    activeTab === "completed" ? completed :
    disabled;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-dark-text leading-tight">
              {item?.name}
            </h2>
            <p className="text-xs text-gray-400 dark:text-dark-text-secondary mt-0.5">
              {type === "tax" ? "Imposto" : "Obrigação"} · {period || "Período atual"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={fetchData} className="btn-ghost !p-1.5 text-gray-400" title="Recarregar">
              <FiRefreshCw size={13} />
            </button>
            <button onClick={onClose} className="btn-ghost !p-1.5">
              <FiX size={15} />
            </button>
          </div>
        </div>

        {/* Tabs de status */}
        <div className="flex gap-1 mb-4 border-b border-gray-100 dark:border-dark-border">
          {tabs.map((tab) => {
            const count = tab === "pending" ? pending.length : tab === "completed" ? completed.length : disabled.length;
            const cfg = STATUS_CONFIG[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? `${cfg.tabCls} border-b-2`
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {cfg.label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab ? "" : "bg-gray-100 dark:bg-dark-surface text-gray-500"
                } ${activeTab === tab ? cfg.cls : ""}`}>
                  {count}
                </span>
              </button>
            );
          })}
          <span className="ml-auto text-xs text-gray-400 self-center pr-1">
            Total: {companies.length}
          </span>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">Carregando...</div>
        ) : currentList.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Nenhuma empresa {STATUS_CONFIG[activeTab].label.toLowerCase()}.
          </div>
        ) : (
          <div className="max-h-[55vh] overflow-y-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 bg-white dark:bg-dark-card z-10">
                <tr>
                  <th className="table-header w-10">Nº</th>
                  <th className="table-header">Empresa</th>
                  <th className="table-header w-12">UF</th>
                  <th className="table-header">Responsável</th>
                  <th className="table-header w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((c) => (
                  <tr key={c.companyId} className="table-row">
                    <td className="table-cell text-xs text-gray-400">{c.num}</td>
                    <td className="table-cell">
                      <div className="font-medium text-sm text-gray-800 dark:text-dark-text">{c.companyName}</div>
                      {c.isZeroedFiscal && (
                        <span className="text-[10px] text-gray-400">zerada</span>
                      )}
                    </td>
                    <td className="table-cell text-xs text-gray-500">{c.uf}</td>
                    <td className="table-cell text-xs text-gray-500">
                      {(c.respFiscalName || c.respName) || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="table-cell">
                      <span className={STATUS_CONFIG[c.status]?.cls || "badge-gray"}>
                        {c.status === "pending"   ? "Pendente"    :
                         c.status === "completed" ? "Concluído"   :
                         "Desabilitado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-4 pt-3 border-t border-gray-100 dark:border-dark-border">
          <button onClick={onClose} className="btn-ghost">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default CompanyListModal;
