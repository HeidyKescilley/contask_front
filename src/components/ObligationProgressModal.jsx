"use client";

import { useState, useEffect, useCallback } from "react";
import { FiX, FiCheck, FiClock, FiSlash, FiRefreshCw, FiMinus } from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";

// ── Badge de status ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    completed:      { label: "Concluída",      cls: "badge-green" },
    pending:        { label: "Pendente",       cls: "badge-amber" },
    disabled:       { label: "Desabilitada",   cls: "badge-gray" },
    not_applicable: { label: "Não se aplica",  cls: "badge-gray" },
  };
  const { label, cls } = map[status] || map.pending;
  return <span className={cls}>{label}</span>;
};

// ── Barra de progresso ────────────────────────────────────────────────────────
const ProgressBar = ({ completed, total }) => {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const color = pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-400" : "bg-gray-200 dark:bg-dark-border";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-dark-text-secondary whitespace-nowrap">
        {completed}/{total}
      </span>
    </div>
  );
};

// ── Item de imposto ────────────────────────────────────────────────────────────
const TaxItem = ({ tax, onToggle, updating }) => {
  const isCompleted = tax.status === "completed";
  const isDisabled  = tax.status === "disabled";
  const isLoading   = updating === tax.statusId;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
      isDisabled
        ? "border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface/50 opacity-60"
        : isCompleted
        ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10"
        : "border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card hover:border-amber-200"
    }`}>
      <button
        type="button"
        onClick={() => !isDisabled && onToggle(tax)}
        disabled={isDisabled || isLoading}
        className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
          isDisabled
            ? "border-gray-200 dark:border-dark-border bg-gray-100 dark:bg-dark-surface cursor-not-allowed"
            : isCompleted
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-emerald-400"
        }`}
      >
        {isLoading
          ? <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
          : isDisabled ? <FiSlash size={10} className="text-gray-400" />
          : isCompleted ? <FiCheck size={11} strokeWidth={3} /> : null}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${isDisabled ? "text-gray-400" : isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-gray-800 dark:text-dark-text"}`}>
            {tax.name}
          </span>
          <StatusBadge status={tax.status} />
        </div>
        {isCompleted && tax.completedAt && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            Apurado em {new Date(tax.completedAt).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Modal principal ───────────────────────────────────────────────────────────
const ObligationProgressModal = ({ company, onClose, currentPeriod, department = "Fiscal" }) => {
  const [obligations, setObligations] = useState([]);
  const [excludedObligations, setExcludedObligations] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [excludedTaxes, setExcludedTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // statusId being updated

  const fetchData = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ department });
      if (currentPeriod) params.set("period", currentPeriod);

      const taxParams = new URLSearchParams({ department });
      if (currentPeriod) taxParams.set("period", currentPeriod);

      const [oblRes, taxRes] = await Promise.all([
        api.get(`/obligation/company/${company.id}?${params}`),
        api.get(`/tax/company/${company.id}?${taxParams}`),
      ]);
      setObligations(oblRes.data.filter((o) => !o.isManuallyExcluded));
      setExcludedObligations(oblRes.data.filter((o) => o.isManuallyExcluded));
      setTaxes(taxRes.data.filter((t) => !t.isManuallyExcluded && t.statusId));
      setExcludedTaxes(taxRes.data.filter((t) => t.isManuallyExcluded));
    } catch {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [company?.id, currentPeriod, department]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleObligationToggle = async (obl) => {
    if (obl.status === "disabled" || obl.status === "not_applicable") return;
    const newStatus = obl.status === "completed" ? "pending" : "completed";
    setUpdating(obl.statusId);
    try {
      await api.patch(`/obligation/status/${obl.statusId}`, { status: newStatus });
      setObligations((prev) =>
        prev.map((o) => o.statusId === obl.statusId
          ? { ...o, status: newStatus, completedAt: newStatus === "completed" ? new Date().toISOString() : null }
          : o
        )
      );
    } catch { toast.error("Erro ao atualizar obrigação."); }
    finally { setUpdating(null); }
  };

  const handleNotApplicableToggle = async (obl) => {
    const newStatus = obl.status === "not_applicable" ? "pending" : "not_applicable";
    setUpdating(`na_${obl.statusId}`);
    try {
      await api.patch(`/obligation/status/${obl.statusId}`, { status: newStatus });
      setObligations((prev) =>
        prev.map((o) => o.statusId === obl.statusId
          ? { ...o, status: newStatus, completedAt: null }
          : o
        )
      );
    } catch { toast.error("Erro ao atualizar obrigação."); }
    finally { setUpdating(null); }
  };

  const handleTaxToggle = async (tax) => {
    const newStatus = tax.status === "completed" ? "pending" : "completed";
    setUpdating(tax.statusId);
    try {
      await api.patch(`/tax/status/${tax.statusId}`, { status: newStatus });
      setTaxes((prev) =>
        prev.map((t) => t.statusId === tax.statusId
          ? { ...t, status: newStatus, completedAt: newStatus === "completed" ? new Date().toISOString() : null }
          : t
        )
      );
    } catch { toast.error("Erro ao atualizar imposto."); }
    finally { setUpdating(null); }
  };

  const activeTaxes    = taxes.filter((t) => t.status !== "disabled");
  const taxCompleted   = activeTaxes.filter((t) => t.status === "completed").length;
  const taxTotal       = activeTaxes.length;
  const activeObls     = obligations.filter((o) => o.status !== "disabled" && o.status !== "not_applicable");
  const oblCompleted   = activeObls.filter((o) => o.status === "completed").length;
  const oblTotal       = activeObls.length;

  const periodLabel = (() => {
    if (!currentPeriod) return "";
    const parts = currentPeriod.split("-");
    if (parts.length === 1) return parts[0];
    if (parts.length === 3) {
      const [y, m, half] = parts;
      const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      return `${months[parseInt(m, 10) - 1]}/${y} — ${half === "1" ? "1ª quinzena" : "2ª quinzena"}`;
    }
    const [y, m] = parts;
    const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    return `${months[parseInt(m, 10) - 1]} de ${y}`;
  })();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box w-full max-w-lg" onClick={(e) => e.stopPropagation()}>

        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-dark-text leading-tight">
              {company?.name?.length > 40 ? company.name.slice(0, 40) + "…" : company?.name}
            </h2>
            <p className="text-xs text-gray-400 dark:text-dark-text-secondary mt-0.5">
              {department} · {periodLabel}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={fetchData} className="btn-ghost !p-1.5 text-gray-400" title="Recarregar">
              <FiRefreshCw size={13} />
            </button>
            <button onClick={onClose} className="btn-ghost !p-1.5">
              <FiX size={15} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">Carregando...</div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

            {/* ── Impostos ── */}
            {taxes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Impostos Apurados</p>
                  <span className="text-xs text-gray-500">{taxCompleted}/{taxTotal}</span>
                </div>
                <div className="mb-2">
                  <ProgressBar completed={taxCompleted} total={taxTotal} />
                </div>
                <div className="space-y-1.5">
                  {taxes.map((tax) => (
                    <TaxItem key={tax.statusId} tax={tax} onToggle={handleTaxToggle} updating={updating} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Obrigações ── */}
            {obligations.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Obrigações Acessórias</p>
                  <span className="text-xs text-gray-500">{oblCompleted}/{oblTotal}</span>
                </div>
                <div className="mb-2">
                  <ProgressBar completed={oblCompleted} total={oblTotal} />
                </div>
                <div className="space-y-1.5">
                  {obligations.map((obl) => {
                    const isDisabled      = obl.status === "disabled";
                    const isNotApplicable = obl.status === "not_applicable";
                    const isCompleted     = obl.status === "completed";
                    const isLoading       = updating === obl.statusId;
                    const isNaLoading     = updating === `na_${obl.statusId}`;
                    const isInactive      = isDisabled || isNotApplicable;
                    return (
                      <div
                        key={obl.statusId}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                          isDisabled
                            ? "border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface/50 opacity-60"
                            : isNotApplicable
                            ? "border-amber-100 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-900/10 opacity-75"
                            : isCompleted
                            ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10"
                            : "border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card hover:border-amber-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleObligationToggle(obl)}
                          disabled={isInactive || isLoading}
                          className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded flex items-center justify-center border transition-colors ${
                            isDisabled
                              ? "border-gray-200 dark:border-dark-border bg-gray-100 dark:bg-dark-surface cursor-not-allowed"
                              : isNotApplicable
                              ? "border-amber-200 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/30 cursor-not-allowed"
                              : isCompleted
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-emerald-400"
                          }`}
                        >
                          {isLoading ? (
                            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : isDisabled ? (
                            <FiSlash size={10} className="text-gray-400" />
                          ) : isNotApplicable ? (
                            <FiMinus size={10} className="text-amber-500" />
                          ) : isCompleted ? (
                            <FiCheck size={11} strokeWidth={3} />
                          ) : null}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${isInactive ? "text-gray-400" : "text-gray-800 dark:text-dark-text"}`}>
                              {obl.name}
                            </span>
                            <StatusBadge status={obl.status} />
                          </div>
                          {obl.description && (
                            <p className="text-xs text-gray-400 dark:text-dark-text-secondary mt-0.5">{obl.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {obl.deadlineFormatted && !isNotApplicable && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <FiClock size={10} />
                                Prazo: {obl.deadlineFormatted}
                              </span>
                            )}
                            {isCompleted && obl.completedAt && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                Concluída em {new Date(obl.completedAt).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                            {obl.isConditional && !isDisabled && (
                              <button
                                type="button"
                                onClick={() => handleNotApplicableToggle(obl)}
                                disabled={isNaLoading}
                                className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                              >
                                {isNaLoading ? (
                                  <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                                ) : isNotApplicable ? "Restaurar" : "Não se aplica"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {taxes.length === 0 && obligations.length === 0 && excludedTaxes.length === 0 && excludedObligations.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">
                Nenhum imposto ou obrigação aplicável a esta empresa.
              </p>
            )}

            {/* ── Excluídos desta empresa ── */}
            {(excludedTaxes.length > 0 || excludedObligations.length > 0) && (
              <div className="border-t border-dashed border-gray-200 dark:border-dark-border pt-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Excluídos desta empresa</p>
                <div className="space-y-1">
                  {excludedTaxes.map((tax) => (
                    <div key={`excl-tax-${tax.id}`} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-200 dark:border-dark-border opacity-60">
                      <FiSlash size={11} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-400 line-through truncate">{tax.name}</span>
                      <span className="ml-auto text-[10px] badge-gray">Imposto excluído</span>
                    </div>
                  ))}
                  {excludedObligations.map((obl) => (
                    <div key={`excl-obl-${obl.id}`} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-200 dark:border-dark-border opacity-60">
                      <FiSlash size={11} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-400 line-through truncate">{obl.name}</span>
                      <span className="ml-auto text-[10px] badge-gray">Obrigação excluída</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end mt-4 pt-3 border-t border-gray-100 dark:border-dark-border">
          <button onClick={onClose} className="btn-ghost">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default ObligationProgressModal;
