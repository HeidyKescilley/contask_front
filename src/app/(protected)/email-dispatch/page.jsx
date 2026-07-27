// src/app/(protected)/email-dispatch/page.jsx
"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import EmailDispatchFormModal from "../../../components/EmailDispatchFormModal";
import EmailDispatchHistoryModal from "../../../components/EmailDispatchHistoryModal";
import api from "../../../utils/api";
import { toast } from "react-toastify";
import { FiPlus, FiEdit2, FiSend, FiClock, FiTrash2, FiMail } from "react-icons/fi";

const MODE_LABEL = { manual: "Manual", automatic: "Automático" };

const FREQUENCY_LABEL = { weekly: "Semanal", monthly: "Mensal", yearly: "Anual" };

const LAST_RUN_BADGE = {
  running: "badge-blue",
  completed: "badge-green",
  completed_with_errors: "badge-amber",
  failed: "badge-red",
};

const fmt = (d) => (d ? new Date(d).toLocaleString("pt-BR") : "–");

export default function EmailDispatchPage() {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState(null);
  const [historyDispatch, setHistoryDispatch] = useState(null);

  useEffect(() => {
    fetchDispatches();
  }, []);

  const fetchDispatches = async () => {
    setLoading(true);
    try {
      const res = await api.get("/email-dispatch/all");
      setDispatches(res.data || []);
    } catch {
      toast.error("Erro ao carregar automações.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunNow = async (dispatch) => {
    if (!window.confirm(`Enviar os e-mails da automação "${dispatch.name}" agora?`)) return;
    try {
      const res = await api.post(`/email-dispatch/${dispatch.id}/run`);
      toast.success(res.data.message);
      setTimeout(fetchDispatches, 2500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao iniciar envio.");
    }
  };

  const handleDelete = async (dispatch) => {
    if (!window.confirm(`Excluir a automação "${dispatch.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/email-dispatch/${dispatch.id}`);
      toast.success("Automação excluída.");
      fetchDispatches();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao excluir automação.");
    }
  };

  const describeSchedule = (d) => {
    if (d.mode !== "automatic") return "—";
    if (!d.nextRunAt) return `${FREQUENCY_LABEL[d.scheduleFrequency] || ""} · sem próxima execução`;
    return `${FREQUENCY_LABEL[d.scheduleFrequency] || ""} · próxima: ${fmt(d.nextRunAt)}`;
  };

  return (
    <ProtectedRoute>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><FiMail size={20} /> Disparo de E-mails</h1>
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
              Automações de envio de e-mail para empresas, manuais ou agendadas.
            </p>
          </div>
          <button onClick={() => { setEditingDispatch(null); setShowForm(true); }} className="btn-primary text-sm">
            <FiPlus size={16} /> Nova Automação
          </button>
        </div>

        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">Carregando…</div>
          ) : dispatches.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
              Nenhuma automação criada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="table-header">Nome</th>
                    <th className="table-header">Modo</th>
                    <th className="table-header">Agendamento</th>
                    <th className="table-header text-center">Empresas</th>
                    <th className="table-header">Última execução</th>
                    <th className="table-header">Status</th>
                    <th className="table-header text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatches.map((d) => {
                    const lastRun = d.runs?.[0];
                    return (
                      <tr key={d.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                        <td className="table-cell text-sm font-medium">{d.name}</td>
                        <td className="table-cell text-xs">{MODE_LABEL[d.mode]}</td>
                        <td className="table-cell text-xs whitespace-nowrap">{describeSchedule(d)}</td>
                        <td className="table-cell text-center text-xs">{d.companies?.length ?? 0}</td>
                        <td className="table-cell text-xs whitespace-nowrap">{lastRun ? fmt(lastRun.startedAt) : "Nunca executada"}</td>
                        <td className="table-cell">
                          {lastRun ? (
                            <span className={LAST_RUN_BADGE[lastRun.status] || "badge-gray"}>
                              {lastRun.successCount}/{lastRun.totalRecipients} enviados
                            </span>
                          ) : (
                            <span className="badge-gray">—</span>
                          )}
                          {!d.isActive && <span className="badge-gray ml-1.5">Pausada</span>}
                        </td>
                        <td className="table-cell">
                          <div className="flex justify-end gap-1.5">
                            <button title="Enviar agora" onClick={() => handleRunNow(d)} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                              <FiSend size={14} />
                            </button>
                            <button title="Histórico" onClick={() => setHistoryDispatch(d)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-card-hover">
                              <FiClock size={14} />
                            </button>
                            <button title="Editar" onClick={() => { setEditingDispatch(d); setShowForm(true); }} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-card-hover">
                              <FiEdit2 size={14} />
                            </button>
                            <button title="Excluir" onClick={() => handleDelete(d)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <EmailDispatchFormModal
          dispatch={editingDispatch}
          onClose={() => setShowForm(false)}
          onSuccess={fetchDispatches}
        />
      )}

      {historyDispatch && (
        <EmailDispatchHistoryModal dispatch={historyDispatch} onClose={() => setHistoryDispatch(null)} />
      )}
    </ProtectedRoute>
  );
}
