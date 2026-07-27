// src/components/EmailDispatchHistoryModal.jsx
"use client";

import { useState, useEffect } from "react";
import { FiX, FiPrinter, FiArrowLeft, FiCheckCircle, FiXCircle } from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";

const STATUS_BADGE = {
  running: { label: "Em andamento", cls: "badge-blue" },
  completed: { label: "Concluída", cls: "badge-green" },
  completed_with_errors: { label: "Concluída com erros", cls: "badge-amber" },
  failed: { label: "Falhou", cls: "badge-red" },
};

const fmt = (d) => (d ? new Date(d).toLocaleString("pt-BR") : "–");

export default function EmailDispatchHistoryModal({ dispatch, onClose }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
    try {
      const res = await api.get(`/email-dispatch/runs/${runId}`);
      setSelectedRun(res.data);
    } catch {
      toast.error("Erro ao carregar detalhe da execução.");
    } finally {
      setDetailLoading(false);
    }
  };

  const renderOpenStatus = (r) => {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-4xl relative" onClick={(e) => e.stopPropagation()}>
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
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="table-header">Início</th>
                      <th className="table-header">Origem</th>
                      <th className="table-header">Status</th>
                      <th className="table-header text-center">Sucesso</th>
                      <th className="table-header text-center">Falha</th>
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
                          <td className="table-cell text-xs">{fmt(run.startedAt)}</td>
                          <td className="table-cell text-xs">
                            {run.triggerType === "manual" ? `Manual (${run.triggeredBy?.name || "—"})` : "Automática"}
                          </td>
                          <td className="table-cell"><span className={badge.cls}>{badge.label}</span></td>
                          <td className="table-cell text-center text-xs">{run.successCount}</td>
                          <td className="table-cell text-center text-xs">{run.failureCount}</td>
                          <td className="table-cell text-right">
                            <span className="text-xs text-primary-500 hover:underline">Ver comprovante</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5 print:hidden">
              <button onClick={() => setSelectedRun(null)} className="btn-ghost text-xs">
                <FiArrowLeft size={13} /> Voltar
              </button>
              <button onClick={() => window.print()} className="btn-secondary text-xs">
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
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="table-header">Empresa</th>
                      <th className="table-header">E-mail</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Detalhe do servidor</th>
                      <th className="table-header">Abertura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedRun.recipients || []).map((r) => (
                      <tr key={r.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                        <td className="table-cell text-xs">{r.company?.name || `Empresa #${r.companyId}`}</td>
                        <td className="table-cell text-xs">{r.emailTo || "–"}</td>
                        <td className="table-cell">
                          {r.status === "sent" ? (
                            <span className="badge-green"><FiCheckCircle size={11} className="inline mr-1" />Enviado</span>
                          ) : (
                            <span className="badge-red"><FiXCircle size={11} className="inline mr-1" />Falhou</span>
                          )}
                        </td>
                        <td className="table-cell text-xs max-w-[220px] truncate" title={r.smtpResponse || r.errorMessage || ""}>
                          {r.smtpResponse || r.errorMessage || "–"}
                        </td>
                        <td className="table-cell">{renderOpenStatus(r)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
