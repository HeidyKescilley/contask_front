// src/components/EmailDispatchHistoryModal.jsx
"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { FiX, FiPrinter, FiArrowLeft, FiCheckCircle, FiXCircle, FiChevronRight, FiChevronDown } from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";

const STATUS_BADGE = {
  running: { label: "Em andamento", cls: "badge-blue" },
  completed: { label: "Concluída", cls: "badge-green" },
  completed_with_errors: { label: "Concluída com erros", cls: "badge-amber" },
  failed: { label: "Falhou", cls: "badge-red" },
};

const fmt = (d) => (d ? new Date(d).toLocaleString("pt-BR") : "–");

const renderIndividualOpenStatus = (r) => {
  if (r.status !== "sent") return <span className="text-gray-300 dark:text-gray-600">–</span>;
  if (!r.trackingToken) return <span className="badge-gray">Sem confirmação (texto)</span>;
  if (r.openedAt) {
    return (
      <span className="badge-green" title={`Última abertura: ${fmt(r.lastOpenedAt)} (${r.openCount}x)`}>
        Aberto em {fmt(r.openedAt)}
      </span>
    );
  }
  return <span className="badge-amber">Não aberto (ainda)</span>;
};

const renderAggregateStatus = (sentCount, failedCount) => {
  if (failedCount === 0) return <span className="badge-green">Enviado ({sentCount})</span>;
  if (sentCount === 0) return <span className="badge-red">Falhou ({failedCount})</span>;
  return <span className="badge-amber">Parcial ({sentCount}/{sentCount + failedCount})</span>;
};

const renderAggregateOpen = (items) => {
  const trackable = items.filter((i) => i.status === "sent" && i.trackingToken);
  if (trackable.length === 0) return <span className="badge-gray">Sem confirmação</span>;
  const opened = trackable.filter((i) => i.openedAt);
  if (opened.length === 0) return <span className="badge-amber">Não aberto</span>;
  if (opened.length === trackable.length) return <span className="badge-green">Lido</span>;
  return <span className="badge-green">Lido ({opened.length}/{trackable.length})</span>;
};

export default function EmailDispatchHistoryModal({ dispatch, onClose }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState(new Set());

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/email-dispatch/${dispatch.id}/runs`);
      setRuns(res.data.runs || []);
    } catch {
      toast.error("Erro ao carregar histórico.");
    } finally {
      setLoading(false);
    }
  };

  const openRunDetail = async (runId) => {
    setDetailLoading(true);
    setExpandedCompanies(new Set());
    try {
      const res = await api.get(`/email-dispatch/runs/${runId}`);
      setSelectedRun(res.data);
    } catch {
      toast.error("Erro ao carregar detalhe da execução.");
    } finally {
      setDetailLoading(false);
    }
  };

  const groupedByCompany = useMemo(() => {
    if (!selectedRun?.recipients) return [];
    const map = new Map();
    for (const r of selectedRun.recipients) {
      if (!map.has(r.companyId)) {
        map.set(r.companyId, { companyId: r.companyId, company: r.company, items: [] });
      }
      map.get(r.companyId).items.push(r);
    }
    return [...map.values()];
  }, [selectedRun]);

  const toggleCompany = (companyId) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      next.has(companyId) ? next.delete(companyId) : next.add(companyId);
      return next;
    });
  };

  // O comprovante impresso deve sempre trazer o detalhe completo por e-mail,
  // independente do que estiver expandido na tela no momento do clique.
  const handlePrint = () => {
    setExpandedCompanies(new Set(groupedByCompany.map((g) => g.companyId)));
    setTimeout(() => window.print(), 50);
  };

  return (
    <div className="modal-overlay print:static print:bg-white print:p-0 print:block" onClick={onClose}>
      <div
        className="modal-box max-w-4xl relative print:max-w-none print:max-h-none print:overflow-visible print:shadow-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600
            hover:bg-gray-100 dark:hover:bg-dark-card-hover dark:hover:text-dark-text transition-colors print:hidden"
        >
          <FiX size={20} />
        </button>

        {!selectedRun ? (
          <>
            <h2 className="text-xl font-bold mb-1">Histórico de Execuções</h2>
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary mb-5">{dispatch.name}</p>

            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-400 text-sm">Carregando…</div>
            ) : runs.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-400 text-sm">Nenhuma execução registrada ainda.</div>
            ) : (
              <div className="border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="table-header whitespace-nowrap">Início</th>
                        <th className="table-header whitespace-nowrap">Origem</th>
                        <th className="table-header whitespace-nowrap">Status</th>
                        <th className="table-header text-center whitespace-nowrap">Sucesso</th>
                        <th className="table-header text-center whitespace-nowrap">Falha</th>
                        <th className="table-header"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((run) => {
                        const badge = STATUS_BADGE[run.status] || STATUS_BADGE.completed;
                        return (
                          <tr
                            key={run.id}
                            onClick={() => openRunDetail(run.id)}
                            className="cursor-pointer border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
                          >
                            <td className="table-cell text-xs whitespace-nowrap">{fmt(run.startedAt)}</td>
                            <td className="table-cell text-xs whitespace-nowrap">
                              {run.triggerType === "manual" ? `Manual (${run.triggeredBy?.name || "—"})` : "Automática"}
                            </td>
                            <td className="table-cell whitespace-nowrap"><span className={badge.cls}>{badge.label}</span></td>
                            <td className="table-cell text-center text-xs">{run.successCount}</td>
                            <td className="table-cell text-center text-xs">{run.failureCount}</td>
                            <td className="table-cell text-right whitespace-nowrap">
                              <span className="text-xs text-primary-500 hover:underline">Ver comprovante</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5 print:hidden">
              <button onClick={() => setSelectedRun(null)} className="btn-ghost text-xs">
                <FiArrowLeft size={13} /> Voltar
              </button>
              <button onClick={handlePrint} className="btn-secondary text-xs">
                <FiPrinter size={13} /> Imprimir comprovante
              </button>
            </div>

            <h2 className="text-xl font-bold mb-1">Comprovante de Envio</h2>
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary mb-1">{selectedRun.dispatch?.name}</p>
            <div className="text-xs text-gray-500 dark:text-dark-text-secondary mb-4 space-y-0.5">
              <p>Assunto: {selectedRun.dispatch?.subject}</p>
              <p>Remetente: {selectedRun.dispatch?.fromName} &lt;{selectedRun.dispatch?.fromEmail}&gt;</p>
              <p>Início: {fmt(selectedRun.startedAt)} — Fim: {fmt(selectedRun.finishedAt)}</p>
              <p>Origem: {selectedRun.triggerType === "manual" ? `Manual (${selectedRun.triggeredBy?.name || "—"})` : "Automática"}</p>
              {selectedRun.errorMessage && (
                <p className="text-red-600 dark:text-red-400 flex items-center gap-1"><FiXCircle size={12} /> {selectedRun.errorMessage}</p>
              )}
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400 text-sm">Carregando…</div>
            ) : (
              <div className="border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="table-header w-6"></th>
                        <th className="table-header">Empresa</th>
                        <th className="table-header whitespace-nowrap">Status</th>
                        <th className="table-header whitespace-nowrap">Abertura</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedByCompany.map((group) => {
                        const sentCount = group.items.filter((i) => i.status === "sent").length;
                        const failedCount = group.items.filter((i) => i.status === "failed").length;
                        const isExpanded = expandedCompanies.has(group.companyId);
                        return (
                          <Fragment key={group.companyId}>
                            <tr
                              onClick={() => toggleCompany(group.companyId)}
                              className="cursor-pointer border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
                            >
                              <td className="table-cell text-center !px-2">
                                {isExpanded ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
                              </td>
                              <td className="table-cell text-xs font-medium">
                                {group.company?.name || `Empresa #${group.companyId}`}
                                <span className="text-gray-400 font-normal ml-1">({group.items.length} e-mail{group.items.length !== 1 ? "s" : ""})</span>
                              </td>
                              <td className="table-cell whitespace-nowrap">{renderAggregateStatus(sentCount, failedCount)}</td>
                              <td className="table-cell whitespace-nowrap">{renderAggregateOpen(group.items)}</td>
                            </tr>
                            {isExpanded && (
                              <tr className="print:table-row">
                                <td colSpan={4} className="bg-gray-50 dark:bg-dark-surface p-0">
                                  <table className="min-w-full">
                                    <thead>
                                      <tr>
                                        <th className="table-header !py-1.5 pl-8">E-mail</th>
                                        <th className="table-header !py-1.5 whitespace-nowrap">Status</th>
                                        <th className="table-header !py-1.5">Detalhe do servidor</th>
                                        <th className="table-header !py-1.5 whitespace-nowrap">Abertura</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.items.map((r) => (
                                        <tr key={r.id} className="border-t border-gray-100 dark:border-dark-border">
                                          <td className="table-cell text-xs pl-8">{r.emailTo || "–"}</td>
                                          <td className="table-cell whitespace-nowrap">
                                            {r.status === "sent" ? (
                                              <span className="badge-green"><FiCheckCircle size={11} className="inline mr-1" />Enviado</span>
                                            ) : (
                                              <span className="badge-red"><FiXCircle size={11} className="inline mr-1" />Falhou</span>
                                            )}
                                          </td>
                                          <td className="table-cell text-xs max-w-[260px] truncate" title={r.smtpResponse || r.errorMessage || ""}>
                                            {r.smtpResponse || r.errorMessage || "–"}
                                          </td>
                                          <td className="table-cell whitespace-nowrap">{renderIndividualOpenStatus(r)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
