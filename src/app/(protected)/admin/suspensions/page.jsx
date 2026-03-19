"use client";

import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useState, useEffect, useCallback } from "react";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import {
  FiPause,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiCheck,
  FiClock,
} from "react-icons/fi";
import SuspensionModal from "../../../../components/SuspensionModal";

// Returns today's date as YYYY-MM-DD
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Format YYYY-MM-DD → DD/MM/YYYY
function fmtDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

// Compute days remaining from endDate string
function daysRemaining(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end - today) / 86400000);
}

const DaysBadge = ({ days, isActive }) => {
  if (!isActive) {
    return <span className="badge-gray">Encerrada</span>;
  }
  if (days === null) return <span className="badge-gray">—</span>;

  if (days <= 15) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        {days}d
      </span>
    );
  }
  if (days <= 30) {
    return <span className="badge-amber">{days}d</span>;
  }
  return <span className="badge-green">{days}d</span>;
};

const FILTERS = [
  { key: "active", label: "Ativas" },
  { key: "ended", label: "Encerradas" },
  { key: "all", label: "Todas" },
];

const SuspensionsAdminPage = () => {
  const [suspensions, setSuspensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [extendTarget, setExtendTarget] = useState(null); // suspension object

  const fetchSuspensions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/activity-suspension?filter=${filter}`);
      setSuspensions(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Erro ao carregar paralisações.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSuspensions();
  }, [fetchSuspensions]);

  const handleEnd = async (suspension) => {
    const companyName = suspension.company?.name || `#${suspension.companyId}`;
    if (
      !confirm(
        `Encerrar a paralisação de "${companyName}"? Esta ação não pode ser desfeita.`
      )
    )
      return;

    try {
      await api.patch(`/activity-suspension/${suspension.id}/end`);
      toast.success("Paralisação encerrada.");
      fetchSuspensions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao encerrar paralisação.");
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaved = () => {
    fetchSuspensions();
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiPause size={18} className="text-amber-500" />
            <h1 className="text-lg font-bold text-gray-800 dark:text-dark-text">
              Paralisações de Atividades
            </h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <FiPlus size={15} />
            Nova Paralisação
          </button>
        </div>

        {/* Filter tabs */}
        <div className="card flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === f.key
                  ? "bg-primary-500 text-white border-primary-500"
                  : "border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-primary-300"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">
            {suspensions.length} paralisaç{suspensions.length !== 1 ? "ões" : "ão"}
          </span>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Carregando...
            </div>
          ) : suspensions.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Nenhuma paralisação encontrada.{" "}
              {filter === "active" && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-primary-500 hover:underline"
                >
                  Registrar agora
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="table-header w-6" />
                    <th className="table-header">Empresa</th>
                    <th className="table-header">CNPJ</th>
                    <th className="table-header">Início</th>
                    <th className="table-header">Fim</th>
                    <th className="table-header text-center">Dias Restantes</th>
                    <th className="table-header">Motivo</th>
                    <th className="table-header" />
                  </tr>
                </thead>
                <tbody>
                  {suspensions.map((s) => {
                    const isExpanded = expandedIds.has(s.id);
                    const remaining = daysRemaining(s.endDate);
                    const extensions = s.extensions || [];

                    return (
                      <>
                        <tr
                          key={s.id}
                          className={`table-row cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-surface/60 transition-colors ${
                            isExpanded
                              ? "bg-gray-50 dark:bg-dark-surface/40"
                              : ""
                          }`}
                          onClick={() => toggleExpand(s.id)}
                        >
                          {/* Expand toggle */}
                          <td className="table-cell text-gray-400 w-6">
                            {extensions.length > 0 ? (
                              isExpanded ? (
                                <FiChevronUp size={14} />
                              ) : (
                                <FiChevronDown size={14} />
                              )
                            ) : null}
                          </td>

                          {/* Company */}
                          <td className="table-cell">
                            <div className="font-medium text-gray-800 dark:text-dark-text text-sm">
                              {s.company?.name || `#${s.companyId}`}
                            </div>
                            {s.createdBy && (
                              <div className="text-xs text-gray-400 dark:text-dark-text-secondary mt-0.5">
                                Por {s.createdBy.name}
                              </div>
                            )}
                          </td>

                          {/* CNPJ */}
                          <td className="table-cell text-sm text-gray-600 dark:text-dark-text-secondary whitespace-nowrap">
                            {s.company?.cnpj || "—"}
                          </td>

                          {/* Start */}
                          <td className="table-cell text-sm whitespace-nowrap">
                            {fmtDate(s.startDate)}
                          </td>

                          {/* End */}
                          <td className="table-cell text-sm whitespace-nowrap">
                            <div>{fmtDate(s.endDate)}</div>
                            {extensions.length > 0 && (
                              <div className="text-xs text-blue-500 mt-0.5">
                                {extensions.length} prorrogaç{extensions.length !== 1 ? "ões" : "ão"}
                              </div>
                            )}
                          </td>

                          {/* Days badge */}
                          <td
                            className="table-cell text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DaysBadge days={remaining} isActive={s.isActive} />
                          </td>

                          {/* Reason */}
                          <td className="table-cell">
                            {s.reason ? (
                              <span
                                className="text-xs text-gray-600 dark:text-dark-text-secondary line-clamp-2 max-w-[180px] block"
                                title={s.reason}
                              >
                                {s.reason}
                              </span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600 text-xs">
                                —
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td
                            className="table-cell"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {s.isActive ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExtendTarget(s);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors"
                                  title="Prorrogar prazo"
                                >
                                  Prorrogar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEnd(s);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                                  title="Encerrar paralisação"
                                >
                                  Encerrar
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <FiCheck size={12} />
                                <span>
                                  {s.endedAt ? fmtDate(s.endedAt) : "Encerrada"}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Expanded row — extension history */}
                        {isExpanded && extensions.length > 0 && (
                          <tr key={`${s.id}-ext`} className="bg-blue-50/50 dark:bg-blue-900/10">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="text-xs font-semibold text-gray-500 dark:text-dark-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                                <FiClock size={12} />
                                Histórico de Prorrogações
                              </div>
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-200 dark:border-dark-border">
                                      <th className="text-left pb-2 font-semibold text-gray-500 dark:text-dark-text-secondary pr-6">
                                        Prorrogado em
                                      </th>
                                      <th className="text-left pb-2 font-semibold text-gray-500 dark:text-dark-text-secondary pr-6">
                                        Prazo Anterior
                                      </th>
                                      <th className="text-left pb-2 font-semibold text-gray-500 dark:text-dark-text-secondary pr-6">
                                        Novo Prazo
                                      </th>
                                      <th className="text-left pb-2 font-semibold text-gray-500 dark:text-dark-text-secondary pr-6">
                                        Por
                                      </th>
                                      <th className="text-left pb-2 font-semibold text-gray-500 dark:text-dark-text-secondary">
                                        Motivo
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {extensions.map((ext, idx) => (
                                      <tr
                                        key={idx}
                                        className="border-b border-gray-100 dark:border-dark-border/50 last:border-0"
                                      >
                                        <td className="py-2 pr-6 text-gray-700 dark:text-dark-text whitespace-nowrap">
                                          {fmtDate(ext.extendedAt)}
                                        </td>
                                        <td className="py-2 pr-6 text-gray-500 dark:text-dark-text-secondary line-through whitespace-nowrap">
                                          {fmtDate(ext.previousEndDate)}
                                        </td>
                                        <td className="py-2 pr-6 font-medium text-gray-800 dark:text-dark-text whitespace-nowrap">
                                          {fmtDate(ext.newEndDate)}
                                        </td>
                                        <td className="py-2 pr-6 text-gray-600 dark:text-dark-text-secondary whitespace-nowrap">
                                          {ext.extendedByName || "—"}
                                        </td>
                                        <td className="py-2 text-gray-500 dark:text-dark-text-secondary">
                                          {ext.reason || (
                                            <span className="text-gray-300 dark:text-gray-600">
                                              —
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <SuspensionModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Extend modal */}
      {extendTarget && (
        <SuspensionModal
          mode="extend"
          suspension={extendTarget}
          companyName={extendTarget.company?.name}
          onClose={() => setExtendTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </ProtectedRoute>
  );
};

export default SuspensionsAdminPage;
