"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FiX, FiAlertTriangle, FiCalendar } from "react-icons/fi";
import api from "../utils/api";

// Returns today's date as YYYY-MM-DD
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const SuspensionModal = ({ mode, companyId, companyName, suspension, onClose, onSaved }) => {
  const isCreate = mode === "create";
  const isExtend = mode === "extend";

  // Shared state
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  // Create mode state
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId || "");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState("");

  // Extend mode state
  const [newEndDate, setNewEndDate] = useState("");

  // Fetch companies list when in create mode and no companyId provided
  useEffect(() => {
    if (isCreate && !companyId) {
      setLoadingCompanies(true);
      api
        .get("/company/all")
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : res.data.companies || [];
          setCompanies(list);
        })
        .catch(() => {
          toast.error("Erro ao carregar lista de empresas.");
        })
        .finally(() => setLoadingCompanies(false));
    }
  }, [isCreate, companyId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const cId = companyId || selectedCompanyId;
    if (!cId) {
      toast.error("Selecione uma empresa.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Preencha as datas de início e fim.");
      return;
    }
    if (endDate <= startDate) {
      toast.error("A data de fim deve ser posterior à data de início.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/activity-suspension", {
        companyId: Number(cId),
        startDate,
        endDate,
        reason: reason.trim() || undefined,
      });
      toast.success("Paralisação registrada com sucesso.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao registrar paralisação.");
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async (e) => {
    e.preventDefault();
    if (!newEndDate) {
      toast.error("Informe a nova data de fim.");
      return;
    }
    if (newEndDate <= suspension.endDate) {
      toast.error("A nova data deve ser posterior à data de fim atual.");
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/activity-suspension/${suspension.id}/extend`, {
        newEndDate,
        reason: reason.trim() || undefined,
      });
      toast.success("Prazo prorrogado com sucesso.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao prorrogar prazo.");
    } finally {
      setLoading(false);
    }
  };

  // Format YYYY-MM-DD → DD/MM/YYYY for display
  const fmtDate = (d) => {
    if (!d) return "—";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FiAlertTriangle size={18} className="text-amber-500" />
            <h2 className="text-base font-bold text-gray-800 dark:text-dark-text">
              {isCreate ? "Nova Paralisação" : "Prorrogar Prazo"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost !p-1.5 text-gray-400"
            type="button"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Create Mode */}
        {isCreate && (
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Company selector (only if no companyId prop) */}
            {!companyId ? (
              <div>
                <label className="label-base">Empresa *</label>
                {loadingCompanies ? (
                  <div className="text-sm text-gray-400 py-2">
                    Carregando empresas...
                  </div>
                ) : (
                  <select
                    className="input-base"
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    required
                  >
                    <option value="">Selecione uma empresa</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.cnpj}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div>
                <label className="label-base">Empresa</label>
                <div className="input-base bg-gray-50 dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary cursor-not-allowed">
                  {companyName || `Empresa #${companyId}`}
                </div>
              </div>
            )}

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-base">
                  <FiCalendar size={12} className="inline mr-1" />
                  Início *
                </label>
                <input
                  type="date"
                  className="input-base"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label-base">
                  <FiCalendar size={12} className="inline mr-1" />
                  Previsão de Fim *
                </label>
                <input
                  type="date"
                  className="input-base"
                  value={endDate}
                  min={startDate || todayISO()}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="label-base">Motivo (opcional)</label>
              <textarea
                className="input-base resize-none"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo da paralisação..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Registrar Paralisação"}
              </button>
            </div>
          </form>
        )}

        {/* Extend Mode */}
        {isExtend && suspension && (
          <form onSubmit={handleExtend} className="space-y-4">
            {/* Current info (read-only) */}
            <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-dark-text-secondary">Empresa:</span>
                <span className="font-medium text-gray-800 dark:text-dark-text">
                  {suspension.company?.name || companyName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-dark-text-secondary">Período atual:</span>
                <span className="font-medium text-gray-800 dark:text-dark-text">
                  {fmtDate(suspension.startDate)} → {fmtDate(suspension.endDate)}
                </span>
              </div>
            </div>

            {/* New end date */}
            <div>
              <label className="label-base">
                <FiCalendar size={12} className="inline mr-1" />
                Nova Data de Fim *
              </label>
              <input
                type="date"
                className="input-base"
                value={newEndDate}
                min={
                  suspension.endDate
                    ? (() => {
                        const d = new Date(suspension.endDate + "T00:00:00");
                        d.setDate(d.getDate() + 1);
                        return d.toISOString().slice(0, 10);
                      })()
                    : todayISO()
                }
                onChange={(e) => setNewEndDate(e.target.value)}
                required
              />
              {suspension.endDate && (
                <p className="text-xs text-gray-400 mt-1">
                  Prazo atual: {fmtDate(suspension.endDate)}. A nova data deve ser posterior.
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="label-base">Motivo da Prorrogação (opcional)</label>
              <textarea
                className="input-base resize-none"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo da prorrogação..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Prorrogar Prazo"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SuspensionModal;
