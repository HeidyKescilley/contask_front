"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import useCachedFetch from "../../../hooks/useCachedFetch";
import {
  FiSearch, FiX, FiCheck, FiMinus, FiList, FiGrid,
  FiExternalLink, FiLoader, FiArrowUp, FiArrowDown, FiBookOpen,
} from "react-icons/fi";
import api from "../../../utils/api";
import { toast } from "react-toastify";
import { formatDate } from "../../../utils/utils";
import ObligationProgressModal from "../../../components/ObligationProgressModal";
import OrientationsModal from "../../../components/OrientationsModal";
import { useCompetencia } from "../../../hooks/useCompetencia";

// ── Helpers de design ─────────────────────────────────────────────────────────
const StatusDot = ({ checked, variant = "green" }) => {
  const variants = {
    green:  checked ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-300 dark:bg-dark-surface dark:text-gray-600",
    purple: checked ? "bg-purple-500 text-white"  : "bg-gray-100 text-gray-300 dark:bg-dark-surface dark:text-gray-600",
    red:    checked ? "bg-red-400 text-white"      : "bg-gray-100 text-gray-300 dark:bg-dark-surface dark:text-gray-600",
  };
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-colors ${variants[variant]}`}>
      {checked ? <FiCheck size={11} strokeWidth={3} /> : <FiMinus size={10} strokeWidth={2} />}
    </span>
  );
};

const AgentCheckbox = ({ checked, onChange, disabled, variant = "green" }) => {
  const accents = { green: "accent-emerald-500", purple: "accent-purple-500", red: "accent-red-400" };
  return (
    <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled}
      className={`h-4 w-4 rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${accents[variant]}`} />
  );
};

const FilterGroup = ({ label, children }) => (
  <div>
    <p className="label-base mb-2">{label}</p>
    <div className="flex flex-wrap gap-x-3 gap-y-1.5">{children}</div>
  </div>
);

const CheckItem = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-dark-text-secondary cursor-pointer whitespace-nowrap select-none">
    <input type="checkbox" checked={checked} onChange={onChange} />
    {label}
  </label>
);

const DeptHeader = ({ label, colSpan, color, minWidth, maxWidth, wrap, vertical }) => {
  const colors = {
    blue:   "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
    green:  "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
    yellow: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
  };
  if (vertical) {
    return (
      <th
        colSpan={colSpan}
        style={{ width: "32px", maxWidth: "32px", minWidth: "32px" }}
        className={`table-header text-center border-l border-gray-200 dark:border-dark-border ${colors[color]}`}
      >
        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap" }}>
          {label}
        </div>
      </th>
    );
  }
  const style = (minWidth || maxWidth) ? { ...(minWidth ? { minWidth } : {}), ...(maxWidth ? { width: maxWidth, maxWidth } : {}) } : undefined;
  return (
    <th
      colSpan={colSpan}
      style={style}
      className={`table-header text-center border-l border-gray-200 dark:border-dark-border ${colors[color]} ${wrap ? "whitespace-normal leading-tight" : ""}`}
    >
      {label}
    </th>
  );
};

// ── Barra de progresso de obrigações ─────────────────────────────────────────
const ObligationBar = ({ completed, total, onOpen }) => {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const barColor = total === 0
    ? "bg-gray-200 dark:bg-dark-border"
    : pct === 100
    ? "bg-emerald-500"
    : pct > 0
    ? "bg-amber-400"
    : "bg-gray-200 dark:bg-dark-border";

  return (
    <div className="flex items-center gap-1.5 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-500 dark:text-dark-text-secondary whitespace-nowrap w-8 text-right">
        {completed}/{total}
      </span>
      <button onClick={onOpen} className="btn-ghost !p-0.5 text-gray-400 hover:text-primary-500" title="Ver obrigações">
        <FiExternalLink size={11} />
      </button>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const AgentCompaniesView = ({
  companies,
  user,
  fetchCompanies,
  isReadOnly = false,
  viewDepartment = null,
}) => {
  const [tempValues, setTempValues] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const { data: gruposData } = useCachedFetch("/company/grupos");
  const [filters, setFilters] = useState({
    sentToClient: null, isZeroed: null, regime: [], classi: [], grupo: [],
  });
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir]     = useState("asc");

  // ── Competência selecionada ───────────────────────────────────────────────
  const { selectedPeriod, isCurrentMonth } = useCompetencia();

  // ── Colunas ativas por departamento ───────────────────────────────────────
  const activeDepartment = viewDepartment || user?.department;
  const showFiscalColumns  = activeDepartment === "Fiscal";
  const showDpColumns      = activeDepartment === "Pessoal";
  const showContabilColumns = activeDepartment === "Contábil";

  // ── Obrigações e Impostos (Fiscal) via cache 5 min ────────────────────────
  const { data: oblData, loading: obligationsLoading, refresh: refreshOblData } = useCachedFetch(
    `/obligation/period-summary?department=Fiscal&period=${selectedPeriod}`,
    { enabled: showFiscalColumns }
  );
  const { data: taxData, loading: taxesLoading, refresh: refreshTaxData } = useCachedFetch(
    `/tax/period-summary?department=Fiscal&period=${selectedPeriod}`,
    { enabled: showFiscalColumns }
  );

  // ── Obrigações e Impostos (DP) ────────────────────────────────────────────
  const { data: dpOblData, loading: dpOblLoading, refresh: refreshDpOblData } = useCachedFetch(
    `/obligation/period-summary?department=Pessoal&period=${selectedPeriod}`,
    { enabled: showDpColumns }
  );
  const { data: dpTaxData, loading: dpTaxLoading, refresh: refreshDpTaxData } = useCachedFetch(
    `/tax/period-summary?department=Pessoal&period=${selectedPeriod}`,
    { enabled: showDpColumns }
  );

  // ── Obrigações e Impostos (Contábil) ─────────────────────────────────────
  const { data: contabilOblData, loading: contabilOblLoading, refresh: refreshContabilOblData } = useCachedFetch(
    `/obligation/period-summary?department=Contábil&period=${selectedPeriod}`,
    { enabled: showContabilColumns }
  );
  const { data: contabilTaxData, loading: contabilTaxLoading, refresh: refreshContabilTaxData } = useCachedFetch(
    `/tax/period-summary?department=Contábil&period=${selectedPeriod}`,
    { enabled: showContabilColumns }
  );

  // Dados derivados do cache (memoizados)
  const obligations = useMemo(() => oblData?.obligations || [], [oblData]);
  const currentPeriod = useMemo(() => oblData?.period || null, [oblData]);
  const taxes = useMemo(() => taxData?.taxes || [], [taxData]);

  const dpTaxes       = useMemo(() => dpTaxData?.taxes        || [], [dpTaxData]);
  const dpObligations = useMemo(() => dpOblData?.obligations   || [], [dpOblData]);
  const contabilTaxes = useMemo(() => contabilTaxData?.taxes   || [], [contabilTaxData]);
  const contabilObls  = useMemo(() => contabilOblData?.obligations || [], [contabilOblData]);

  const dpCurrentPeriod = useMemo(() => dpOblData?.period || dpTaxData?.period || null, [dpOblData, dpTaxData]);
  const contabilCurrentPeriod = useMemo(() => contabilOblData?.period || contabilTaxData?.period || null, [contabilOblData, contabilTaxData]);

  // Estado local para atualizações otimistas — inicializado a partir do cache
  const [obligationStatuses, setObligationStatuses] = useState({});
  const [taxStatuses, setTaxStatuses] = useState({});
  const [dpObligationStatuses, setDpObligationStatuses] = useState({});
  const [dpTaxStatuses, setDpTaxStatuses] = useState({});
  const [contabilObligationStatuses, setContabilObligationStatuses] = useState({});
  const [contabilTaxStatuses, setContabilTaxStatuses] = useState({});

  const [fiscalViewMode, setFiscalViewMode] = useState(() => {
    if (typeof window === "undefined") return "compact";
    return localStorage.getItem("contask_fiscal_view_mode") || "compact";
  });

  const handleSetFiscalViewMode = useCallback((mode) => {
    setFiscalViewMode(mode);
    if (typeof window !== "undefined") localStorage.setItem("contask_fiscal_view_mode", mode);
  }, []);

  const [dpViewMode, setDpViewMode] = useState(() => {
    if (typeof window === "undefined") return "compact";
    return localStorage.getItem("contask_dp_view_mode") || "compact";
  });
  const handleSetDpViewMode = useCallback((mode) => {
    setDpViewMode(mode);
    if (typeof window !== "undefined") localStorage.setItem("contask_dp_view_mode", mode);
  }, []);

  const [contabilViewMode, setContabilViewMode] = useState(() => {
    if (typeof window === "undefined") return "compact";
    return localStorage.getItem("contask_contabil_view_mode") || "compact";
  });
  const handleSetContabilViewMode = useCallback((mode) => {
    setContabilViewMode(mode);
    if (typeof window !== "undefined") localStorage.setItem("contask_contabil_view_mode", mode);
  }, []);

  const [obligationModal, setObligationModal] = useState(null); // { company, department }
  const [orientationModal, setOrientationModal] = useState(null); // company object or null


  // Permite edição no mês atual e no mês anterior (período de trabalho do contador)
  const canEditFiscal   = !isReadOnly && user?.department === "Fiscal";
  const canEditDp       = !isReadOnly && user?.department === "Pessoal";
  const canEditContabil = !isReadOnly && user?.department === "Contábil";

  const regimes        = ["Simples", "Presumido", "Real", "MEI", "Isenta", "Doméstica"];
  const classificacoes = ["ICMS", "ISS", "ICMS/ISS", "Outros"];

  // Inicializa valores dos inputs (DP/Contábil/Fiscal)
  useEffect(() => {
    const initial = {};
    companies.forEach((c) => {
      initial[c.id] = {
        employeesCount:       c.employeesCount       ?? "",
        accountingMonthsCount: c.accountingMonthsCount ?? "",
        bonusValue:            c.bonusValue           ?? "",
      };
    });
    setTempValues(initial);
  }, [companies]);

  // Popula obrigações locais quando dados do cache chegam/atualizam
  useEffect(() => {
    if (!oblData?.companies) return;
    const map = {};
    oblData.companies.forEach((c) => { map[c.companyId] = c.obligations; });
    setObligationStatuses(map);
  }, [oblData]);

  // Popula impostos locais quando dados do cache chegam/atualizam
  useEffect(() => {
    if (!taxData?.companies) return;
    const map = {};
    taxData.companies.forEach((c) => { map[c.companyId] = c.taxes; });
    setTaxStatuses(map);
  }, [taxData]);

  // Popula DP obrigações/impostos
  useEffect(() => {
    if (!dpOblData?.companies) return;
    const map = {};
    dpOblData.companies.forEach((c) => { map[c.companyId] = c.obligations; });
    setDpObligationStatuses(map);
  }, [dpOblData]);

  useEffect(() => {
    if (!dpTaxData?.companies) return;
    const map = {};
    dpTaxData.companies.forEach((c) => { map[c.companyId] = c.taxes; });
    setDpTaxStatuses(map);
  }, [dpTaxData]);

  // Popula Contábil obrigações/impostos
  useEffect(() => {
    if (!contabilOblData?.companies) return;
    const map = {};
    contabilOblData.companies.forEach((c) => { map[c.companyId] = c.obligations; });
    setContabilObligationStatuses(map);
  }, [contabilOblData]);

  useEffect(() => {
    if (!contabilTaxData?.companies) return;
    const map = {};
    contabilTaxData.companies.forEach((c) => { map[c.companyId] = c.taxes; });
    setContabilTaxStatuses(map);
  }, [contabilTaxData]);

  // ── Handlers de checkbox (Fiscal: envio/zerado) e DP/Contábil ──────────────
  const handleCheckboxChange = useCallback(async (companyId, field, currentValue) => {
    if (isReadOnly) return;
    try {
      const newValue = !currentValue;
      const payload = { [field]: newValue };
      if (field === "isZeroedFiscal" && newValue === true) {
        payload.bonusValue = 1;
      }
      await api.patch(`/company/update-agent-data/${companyId}`, payload);
      if (field === "isZeroedFiscal" && newValue === true) {
        setTempValues((prev) => ({ ...prev, [companyId]: { ...prev[companyId], bonusValue: 1 } }));
      }
      toast.success("Dados atualizados!");
      fetchCompanies();
      // Quando zerado é alterado, refreshar dados de impostos e obrigações
      if (field === "isZeroedFiscal") { refreshOblData(); refreshTaxData(); }
      if (field === "isZeroedDp") { refreshDpOblData(); refreshDpTaxData(); }
      if (field === "isZeroedContabil") { refreshContabilOblData(); refreshContabilTaxData(); }
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao atualizar.");
    }
  }, [fetchCompanies, isReadOnly, refreshOblData, refreshTaxData, refreshDpOblData, refreshDpTaxData, refreshContabilOblData, refreshContabilTaxData]);

  const handleValueChange = useCallback((companyId, field, value) => {
    if (isReadOnly) return;
    setTempValues((prev) => ({ ...prev, [companyId]: { ...prev[companyId], [field]: value } }));
  }, [isReadOnly]);

  const handleSaveOnBlur = useCallback(async (companyId, field) => {
    if (isReadOnly) return;
    const company = companies.find((c) => c.id === companyId);
    if (!company) return;
    const valueToSave = tempValues[companyId]?.[field];
    if (valueToSave === (company[field] ?? "") || valueToSave === "") return;

    if (field === "employeesCount") {
      if (!company.dpCompletedAt) {
        toast.error("Conclua todas as obrigações do DP antes de salvar o número de funcionários.");
        return;
      }
      const v = parseInt(valueToSave, 10);
      if (isNaN(v) || v < 0) { toast.error("Valor inválido."); return; }
    } else if (field === "accountingMonthsCount") {
      const v = parseInt(valueToSave, 10);
      if (isNaN(v) || v < 0) {
        toast.error("Valor inválido.");
        setTempValues((prev) => ({ ...prev, [companyId]: { ...prev[companyId], [field]: company[field] ?? "" } }));
        return;
      }
    } else if (field === "bonusValue") {
      const v = parseInt(valueToSave, 10);
      if (isNaN(v) || v < 0) {
        toast.error("Valor inválido.");
        setTempValues((prev) => ({ ...prev, [companyId]: { ...prev[companyId], [field]: company[field] ?? "" } }));
        return;
      }
    }

    try {
      await api.patch(`/company/update-agent-data/${companyId}`, { [field]: parseInt(valueToSave, 10) });
      toast.success("Valor salvo!");
      fetchCompanies();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar.");
    }
  }, [companies, tempValues, fetchCompanies, isReadOnly]);

  // ── Atualizar status de imposto (modo tabela Fiscal) ─────────────────────
  const handleTaxToggle = useCallback(async (statusId, currentStatus) => {
    if (isReadOnly || !canEditFiscal) return;
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await api.patch(`/tax/status/${statusId}`, { status: newStatus });
      setTaxStatuses((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((companyId) => {
          next[companyId] = next[companyId].map((t) =>
            t.statusId === statusId ? { ...t, status: newStatus } : t
          );
        });
        return next;
      });
      refreshTaxData();
    } catch {
      toast.error("Erro ao atualizar imposto.");
    }
  }, [isReadOnly, canEditFiscal, refreshTaxData]);

  // ── Atualizar status de imposto (modo tabela DP) ─────────────────────────
  const handleDpTaxToggle = useCallback(async (statusId, currentStatus) => {
    if (isReadOnly || !canEditDp) return;
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await api.patch(`/tax/status/${statusId}`, { status: newStatus });
      setDpTaxStatuses((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((companyId) => {
          next[companyId] = next[companyId].map((t) =>
            t.statusId === statusId ? { ...t, status: newStatus } : t
          );
        });
        return next;
      });
      refreshDpTaxData();
    } catch {
      toast.error("Erro ao atualizar imposto.");
    }
  }, [isReadOnly, canEditDp, refreshDpTaxData]);

  // ── Atualizar status de obrigação (modo tabela DP) ────────────────────────
  const handleDpObligationToggle = useCallback(async (statusId, currentStatus, isConditional) => {
    if (isReadOnly || !canEditDp) return;
    let newStatus;
    if (isConditional) {
      if (currentStatus === "pending") newStatus = "completed";
      else if (currentStatus === "completed") newStatus = "not_applicable";
      else newStatus = "pending";
    } else {
      newStatus = currentStatus === "completed" ? "pending" : "completed";
    }
    try {
      await api.patch(`/obligation/status/${statusId}`, { status: newStatus });
      setDpObligationStatuses((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((companyId) => {
          next[companyId] = next[companyId].map((o) =>
            o.statusId === statusId ? { ...o, status: newStatus } : o
          );
        });
        return next;
      });
      refreshDpOblData();
    } catch {
      toast.error("Erro ao atualizar obrigação.");
    }
  }, [isReadOnly, canEditDp, refreshDpOblData]);

  // ── Atualizar status de imposto (modo tabela Contábil) ────────────────────
  const handleContabilTaxToggle = useCallback(async (statusId, currentStatus) => {
    if (isReadOnly || !canEditContabil) return;
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await api.patch(`/tax/status/${statusId}`, { status: newStatus });
      setContabilTaxStatuses((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((companyId) => {
          next[companyId] = next[companyId].map((t) =>
            t.statusId === statusId ? { ...t, status: newStatus } : t
          );
        });
        return next;
      });
      refreshContabilTaxData();
    } catch {
      toast.error("Erro ao atualizar imposto.");
    }
  }, [isReadOnly, canEditContabil, refreshContabilTaxData]);

  // ── Atualizar status de obrigação (modo tabela Contábil) ──────────────────
  const handleContabilObligationToggle = useCallback(async (statusId, currentStatus, isConditional) => {
    if (isReadOnly || !canEditContabil) return;
    let newStatus;
    if (isConditional) {
      if (currentStatus === "pending") newStatus = "completed";
      else if (currentStatus === "completed") newStatus = "not_applicable";
      else newStatus = "pending";
    } else {
      newStatus = currentStatus === "completed" ? "pending" : "completed";
    }
    try {
      await api.patch(`/obligation/status/${statusId}`, { status: newStatus });
      setContabilObligationStatuses((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((companyId) => {
          next[companyId] = next[companyId].map((o) =>
            o.statusId === statusId ? { ...o, status: newStatus } : o
          );
        });
        return next;
      });
      refreshContabilOblData();
    } catch {
      toast.error("Erro ao atualizar obrigação.");
    }
  }, [isReadOnly, canEditContabil, refreshContabilOblData]);

  // ── Atualizar status de obrigação (modo tabela Fiscal) ────────────────────
  const handleObligationToggle = useCallback(async (statusId, currentStatus, isConditional) => {
    if (isReadOnly || !canEditFiscal) return;
    let newStatus;
    if (isConditional) {
      // Ciclo: pending → completed → not_applicable → pending
      if (currentStatus === "pending") newStatus = "completed";
      else if (currentStatus === "completed") newStatus = "not_applicable";
      else newStatus = "pending";
    } else {
      newStatus = currentStatus === "completed" ? "pending" : "completed";
    }
    try {
      await api.patch(`/obligation/status/${statusId}`, { status: newStatus });
      setObligationStatuses((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((companyId) => {
          next[companyId] = next[companyId].map((o) =>
            o.statusId === statusId ? { ...o, status: newStatus } : o
          );
        });
        return next;
      });
      refreshOblData();
    } catch {
      toast.error("Erro ao atualizar obrigação.");
    }
  }, [isReadOnly, canEditFiscal, refreshOblData]);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const toggleBoolFilter = useCallback((cat, val) => {
    setFilters((p) => ({ ...p, [cat]: p[cat] === val ? null : val }));
  }, []);

  const toggleArrayFilter = useCallback((cat, val) => {
    setFilters((p) => ({
      ...p,
      [cat]: p[cat].includes(val) ? p[cat].filter((i) => i !== val) : [...p[cat], val],
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilters({ sentToClient: null, isZeroed: null, regime: [], classi: [], grupo: [] });
  }, []);

  const handleSort = useCallback((field) => {
    setSortDir((prev) => sortField === field && prev === "asc" ? "desc" : "asc");
    setSortField(field);
  }, [sortField]);

  const activeFilterCount = [
    filters.sentToClient !== null ? 1 : 0,
    filters.isZeroed !== null ? 1 : 0,
    filters.regime.length,
    filters.classi.length,
  ].reduce((a, b) => a + b, 0);

  // ── Filtragem ──────────────────────────────────────────────────────────────
  const filteredCompanies = useMemo(() => {
    let result = [...companies];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) || c.num?.toString().includes(q) ||
        c.cnpj?.includes(q) || c.uf?.toLowerCase().includes(q)
      );
    }
    if (showFiscalColumns) {
      if (filters.sentToClient !== null)
        result = result.filter((c) => c.sentToClientFiscal === filters.sentToClient);
      if (filters.isZeroed !== null)
        result = result.filter((c) => c.isZeroedFiscal === filters.isZeroed);
    }
    if (showDpColumns) {
      if (filters.isZeroed !== null)
        result = result.filter((c) => c.isZeroedDp === filters.isZeroed);
    }
    if (showContabilColumns) {
      if (filters.isZeroed !== null)
        result = result.filter((c) => c.isZeroedContabil === filters.isZeroed);
    }
    if (filters.regime.length > 0) result = result.filter((c) => filters.regime.includes(c.rule));
    if (filters.classi.length  > 0) result = result.filter((c) => filters.classi.includes(c.classi));
    if (filters.grupo.length   > 0) result = result.filter((c) => filters.grupo.includes(String(c.grupoId)));
    return result.sort((a, b) => {
      const va = String(a[sortField] ?? ""); const vb = String(b[sortField] ?? "");
      const cmp = va.localeCompare(vb, "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [companies, searchTerm, filters, showFiscalColumns, showDpColumns, sortField, sortDir]);

  // ── Obrigações por empresa (lookup rápido) ─────────────────────────────────
  const getCompanyOblStats = (companyId) => {
    const obls = obligationStatuses[companyId] || [];
    return {
      total: obls.length,
      completed: obls.filter((o) => o.status === "completed").length,
    };
  };

  const getOblStatus = (companyId, obligationId) =>
    (obligationStatuses[companyId] || []).find((o) => o.obligationId === obligationId);

  const getCompanyTaxStats = (companyId) => {
    const txs = (taxStatuses[companyId] || []).filter((t) => t.status !== "disabled");
    return { total: txs.length, completed: txs.filter((t) => t.status === "completed").length };
  };

  const getTaxStatus = (companyId, taxId) =>
    (taxStatuses[companyId] || []).find((t) => t.taxId === taxId);

  const getDpTaxStatus = (companyId, taxId) =>
    (dpTaxStatuses[companyId] || []).find((t) => t.taxId === taxId);
  const getDpOblStatus = (companyId, oblId) =>
    (dpObligationStatuses[companyId] || []).find((o) => o.obligationId === oblId);
  const getContabilTaxStatus = (companyId, taxId) =>
    (contabilTaxStatuses[companyId] || []).find((t) => t.taxId === taxId);
  const getContabilOblStatus = (companyId, oblId) =>
    (contabilObligationStatuses[companyId] || []).find((o) => o.obligationId === oblId);

  const getDpOblStats = (companyId) => {
    const obls = (dpObligationStatuses[companyId] || []).filter((o) => o.status !== "disabled");
    return { total: obls.length, completed: obls.filter((o) => o.status === "completed").length };
  };
  const getDpTaxStats = (companyId) => {
    const txs = (dpTaxStatuses[companyId] || []).filter((t) => t.status !== "disabled");
    return { total: txs.length, completed: txs.filter((t) => t.status === "completed").length };
  };
  const getContabilOblStats = (companyId) => {
    const obls = (contabilObligationStatuses[companyId] || []).filter((o) => o.status !== "disabled");
    return { total: obls.length, completed: obls.filter((o) => o.status === "completed").length };
  };
  const getContabilTaxStats = (companyId) => {
    const txs = (contabilTaxStatuses[companyId] || []).filter((t) => t.status !== "disabled");
    return { total: txs.length, completed: txs.filter((t) => t.status === "completed").length };
  };

  // ── Colunas visíveis no modo tabela (só impostos/obrigações que o usuário possui) ──
  const visibleTaxes = useMemo(() => {
    if (!showFiscalColumns || fiscalViewMode !== "table") return taxes;
    if (Object.keys(taxStatuses).length === 0) return taxes;
    return taxes.filter((tax) =>
      companies.some((c) => (taxStatuses[c.id] || []).some((t) => t.taxId === tax.id))
    );
  }, [taxes, taxStatuses, companies, showFiscalColumns, fiscalViewMode]);

  const visibleObligations = useMemo(() => {
    if (!showFiscalColumns || fiscalViewMode !== "table") return obligations;
    if (Object.keys(obligationStatuses).length === 0) return obligations;
    return obligations.filter((obl) =>
      companies.some((c) => (obligationStatuses[c.id] || []).some((o) => o.obligationId === obl.id))
    );
  }, [obligations, obligationStatuses, companies, showFiscalColumns, fiscalViewMode]);

  const visibleDpTaxes = useMemo(() => {
    if (!showDpColumns || dpViewMode !== "table") return dpTaxes;
    if (Object.keys(dpTaxStatuses).length === 0) return dpTaxes;
    return dpTaxes.filter((tax) =>
      companies.some((c) => (dpTaxStatuses[c.id] || []).some((t) => t.taxId === tax.id))
    );
  }, [dpTaxes, dpTaxStatuses, companies, showDpColumns, dpViewMode]);

  const visibleDpObligations = useMemo(() => {
    if (!showDpColumns || dpViewMode !== "table") return dpObligations;
    if (Object.keys(dpObligationStatuses).length === 0) return dpObligations;
    return dpObligations.filter((obl) =>
      companies.some((c) => (dpObligationStatuses[c.id] || []).some((o) => o.obligationId === obl.id))
    );
  }, [dpObligations, dpObligationStatuses, companies, showDpColumns, dpViewMode]);

  const visibleContabilTaxes = useMemo(() => {
    if (!showContabilColumns || contabilViewMode !== "table") return contabilTaxes;
    if (Object.keys(contabilTaxStatuses).length === 0) return contabilTaxes;
    return contabilTaxes.filter((tax) =>
      companies.some((c) => (contabilTaxStatuses[c.id] || []).some((t) => t.taxId === tax.id))
    );
  }, [contabilTaxes, contabilTaxStatuses, companies, showContabilColumns, contabilViewMode]);

  const visibleContabilObls = useMemo(() => {
    if (!showContabilColumns || contabilViewMode !== "table") return contabilObls;
    if (Object.keys(contabilObligationStatuses).length === 0) return contabilObls;
    return contabilObls.filter((obl) =>
      companies.some((c) => (contabilObligationStatuses[c.id] || []).some((o) => o.obligationId === obl.id))
    );
  }, [contabilObls, contabilObligationStatuses, companies, showContabilColumns, contabilViewMode]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <div className="card mb-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="label-base">Pesquisa</label>
            <div className="relative">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, número, CNPJ ou UF..." className="input-base pl-8" />
            </div>
          </div>
          {/* Toggle modo Fiscal */}
          {showFiscalColumns && (
            <div className="flex flex-col gap-1">
              <label className="label-base">Visualização</label>
              <div className="flex border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleSetFiscalViewMode("compact")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    fiscalViewMode === "compact"
                      ? "bg-primary-500 text-white"
                      : "bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50"
                  }`}
                >
                  <FiList size={13} /> Compacto
                </button>
                <button
                  type="button"
                  onClick={() => handleSetFiscalViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-l border-gray-200 dark:border-dark-border transition-colors ${
                    fiscalViewMode === "table"
                      ? "bg-primary-500 text-white"
                      : "bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50"
                  }`}
                >
                  <FiGrid size={13} /> Tabela
                </button>
              </div>
            </div>
          )}
          {/* Toggle modo DP */}
          {showDpColumns && (
            <div className="flex flex-col gap-1">
              <label className="label-base">Visualização</label>
              <div className="flex border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleSetDpViewMode("compact")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    dpViewMode === "compact"
                      ? "bg-primary-500 text-white"
                      : "bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50"
                  }`}
                >
                  <FiList size={13} /> Compacto
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDpViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-l border-gray-200 dark:border-dark-border transition-colors ${
                    dpViewMode === "table"
                      ? "bg-primary-500 text-white"
                      : "bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50"
                  }`}
                >
                  <FiGrid size={13} /> Tabela
                </button>
              </div>
            </div>
          )}
          {/* Toggle modo Contábil */}
          {showContabilColumns && (
            <div className="flex flex-col gap-1">
              <label className="label-base">Visualização</label>
              <div className="flex border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleSetContabilViewMode("compact")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    contabilViewMode === "compact"
                      ? "bg-primary-500 text-white"
                      : "bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50"
                  }`}
                >
                  <FiList size={13} /> Compacto
                </button>
                <button
                  type="button"
                  onClick={() => handleSetContabilViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-l border-gray-200 dark:border-dark-border transition-colors ${
                    contabilViewMode === "table"
                      ? "bg-primary-500 text-white"
                      : "bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50"
                  }`}
                >
                  <FiGrid size={13} /> Tabela
                </button>
              </div>
            </div>
          )}
          <div className="flex items-end gap-2 pb-px">
            {activeFilterCount > 0 && (
              <span className="text-[11px] text-gray-400 whitespace-nowrap">
                {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""} ativo{activeFilterCount > 1 ? "s" : ""}
              </span>
            )}
            <button onClick={clearFilters} className="btn-danger text-xs">
              <FiX size={13} /> Limpar
            </button>
          </div>
        </div>

        {/* Filtros avançados */}
        <div className="border-t border-gray-100 dark:border-dark-border" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">
          {showFiscalColumns && (
            <>
              <FilterGroup label="Envio">
                <CheckItem label="Enviados"     checked={filters.sentToClient === true}  onChange={() => toggleBoolFilter("sentToClient", true)}  />
                <CheckItem label="Não enviados" checked={filters.sentToClient === false} onChange={() => toggleBoolFilter("sentToClient", false)} />
              </FilterGroup>
              <FilterGroup label="Zerado">
                <CheckItem label="Zeradas"     checked={filters.isZeroed === true}  onChange={() => toggleBoolFilter("isZeroed", true)}  />
                <CheckItem label="Não zeradas" checked={filters.isZeroed === false} onChange={() => toggleBoolFilter("isZeroed", false)} />
              </FilterGroup>
            </>
          )}
          {(showDpColumns || showContabilColumns) && (
            <FilterGroup label="Zerado">
              <CheckItem label="Zeradas"     checked={filters.isZeroed === true}  onChange={() => toggleBoolFilter("isZeroed", true)}  />
              <CheckItem label="Não zeradas" checked={filters.isZeroed === false} onChange={() => toggleBoolFilter("isZeroed", false)} />
            </FilterGroup>
          )}
          <FilterGroup label="Regime">
            {regimes.map((r) => (
              <CheckItem key={r} label={r} checked={filters.regime.includes(r)} onChange={() => toggleArrayFilter("regime", r)} />
            ))}
          </FilterGroup>
          <FilterGroup label="Classificação">
            {classificacoes.map((c) => (
              <CheckItem key={c} label={c} checked={filters.classi.includes(c)} onChange={() => toggleArrayFilter("classi", c)} />
            ))}
          </FilterGroup>
          {(gruposData || []).length > 0 && (
            <FilterGroup label="Grupo">
              {(gruposData || []).map((g) => (
                <CheckItem key={g.id} label={g.name} checked={filters.grupo.includes(String(g.id))} onChange={() => toggleArrayFilter("grupo", String(g.id))} />
              ))}
            </FilterGroup>
          )}
        </div>
      </div>

      {/* ── Indicador de carregamento de impostos/obrigações (sempre invisível para evitar deformação do layout) ── */}
      <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 mb-2 px-1 invisible">
        <FiLoader size={12} className="animate-spin" />
        <span>Carregando impostos e obrigações…</span>
      </div>

      {/* ── Tabela ──────────────────────────────────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-header w-12 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-surface select-none" onClick={() => handleSort("num")}>
                  <span className="inline-flex items-center">Nº{sortField === "num" ? (sortDir === "asc" ? <FiArrowUp size={11} className="ml-1 text-primary-500" /> : <FiArrowDown size={11} className="ml-1 text-primary-500" />) : <FiArrowUp size={11} className="ml-1 opacity-30" />}</span>
                </th>
                <th className="table-header cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-surface select-none" style={{ minWidth: "180px" }} onClick={() => handleSort("name")}>
                  <span className="inline-flex items-center">Razão Social{sortField === "name" ? (sortDir === "asc" ? <FiArrowUp size={11} className="ml-1 text-primary-500" /> : <FiArrowDown size={11} className="ml-1 text-primary-500" />) : <FiArrowUp size={11} className="ml-1 opacity-30" />}</span>
                </th>
                <th className="table-header w-12 text-center">Filial</th>
                <th className="table-header w-20 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-surface select-none" onClick={() => handleSort("rule")}>
                  <span className="inline-flex items-center">Regime{sortField === "rule" ? (sortDir === "asc" ? <FiArrowUp size={11} className="ml-1 text-primary-500" /> : <FiArrowDown size={11} className="ml-1 text-primary-500" />) : <FiArrowUp size={11} className="ml-1 opacity-30" />}</span>
                </th>
                <th className="table-header w-10 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-surface select-none" onClick={() => handleSort("uf")}>
                  <span className="inline-flex items-center">UF{sortField === "uf" ? (sortDir === "asc" ? <FiArrowUp size={11} className="ml-1 text-primary-500" /> : <FiArrowDown size={11} className="ml-1 text-primary-500" />) : <FiArrowUp size={11} className="ml-1 opacity-30" />}</span>
                </th>
                {viewDepartment && viewDepartment !== "all" && (
                  <th className="table-header w-28">Responsável</th>
                )}
                <th className="table-header w-14 text-center">Matriz</th>

                {/* ── Colunas Fiscal — Modo Compacto ── */}
                {showFiscalColumns && fiscalViewMode === "compact" && (
                  <>
                    <DeptHeader label="Zerado"      colSpan={1} color="blue" />
                    <DeptHeader label="Impostos"    colSpan={1} color="blue" minWidth="150px" />
                    <DeptHeader label="Obrigações"  colSpan={1} color="blue" minWidth="150px" />
                    <DeptHeader label="Conclusão"   colSpan={1} color="blue" />
                    <DeptHeader label="Nota"        colSpan={1} color="blue" maxWidth="56px" />
                  </>
                )}

                {/* ── Colunas Fiscal — Modo Tabela (imposto/obrigação por coluna) ── */}
                {showFiscalColumns && fiscalViewMode === "table" && (
                  <>
                    <DeptHeader label="Zerado" colSpan={1} color="blue" />
                    {visibleTaxes.map((tax) => (
                      <DeptHeader key={`tax-${tax.id}`} label={tax.name} colSpan={1} color="blue" vertical />
                    ))}
                    {visibleObligations.map((obl) => (
                      <DeptHeader key={`obl-${obl.id}`} label={obl.name} colSpan={1} color="blue" vertical />
                    ))}
                    <DeptHeader label="Nota" colSpan={1} color="blue" />
                  </>
                )}

                {/* ── Colunas DP — Modo Compacto ── */}
                {showDpColumns && dpViewMode === "compact" && (
                  <>
                    <DeptHeader label="Zerado"     colSpan={1} color="green" />
                    <DeptHeader label="Impostos"   colSpan={1} color="green" minWidth="150px" />
                    <DeptHeader label="Obrigações" colSpan={1} color="green" minWidth="150px" />
                    <DeptHeader label="Func."      colSpan={1} color="green" minWidth="60px" />
                    <DeptHeader label="Conclusão"  colSpan={1} color="green" />
                  </>
                )}

                {/* ── Colunas DP — Modo Tabela ── */}
                {showDpColumns && dpViewMode === "table" && (
                  <>
                    <DeptHeader label="Zerado" colSpan={1} color="green" />
                    {visibleDpTaxes.map((tax) => (
                      <DeptHeader key={`dp-tax-${tax.id}`} label={tax.name} colSpan={1} color="green" vertical />
                    ))}
                    {visibleDpObligations.map((obl) => (
                      <DeptHeader key={`dp-obl-${obl.id}`} label={obl.name} colSpan={1} color="green" vertical />
                    ))}
                    <DeptHeader label="Func."     colSpan={1} color="green" minWidth="60px" />
                    <DeptHeader label="Conclusão" colSpan={1} color="green" />
                  </>
                )}

                {/* ── Colunas Contábil — Modo Compacto ── */}
                {showContabilColumns && contabilViewMode === "compact" && (
                  <>
                    <DeptHeader label="Zerado"      colSpan={1} color="yellow" />
                    <DeptHeader label="Impostos"    colSpan={1} color="yellow" minWidth="150px" />
                    <DeptHeader label="Obrigações"  colSpan={1} color="yellow" minWidth="150px" />
                    <DeptHeader label="Meses Cont." colSpan={1} color="yellow" minWidth="60px" />
                    <DeptHeader label="Conclusão"   colSpan={1} color="yellow" />
                  </>
                )}

                {/* ── Colunas Contábil — Modo Tabela ── */}
                {showContabilColumns && contabilViewMode === "table" && (
                  <>
                    <DeptHeader label="Zerado" colSpan={1} color="yellow" />
                    {visibleContabilTaxes.map((tax) => (
                      <DeptHeader key={`cont-tax-${tax.id}`} label={tax.name} colSpan={1} color="yellow" vertical />
                    ))}
                    {visibleContabilObls.map((obl) => (
                      <DeptHeader key={`cont-obl-${obl.id}`} label={obl.name} colSpan={1} color="yellow" vertical />
                    ))}
                    <DeptHeader label="Meses Cont." colSpan={1} color="yellow" minWidth="60px" />
                    <DeptHeader label="Conclusão"   colSpan={1} color="yellow" />
                  </>
                )}

              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => {
                const { completed: oblCompleted, total: oblTotal } = getCompanyOblStats(company.id);
                const { completed: taxCompleted, total: taxTotal } = getCompanyTaxStats(company.id);
                return (
                  <tr key={company.id} className="table-row">
                    <td className="table-cell font-mono text-xs">{company.num}</td>
                    <td className="table-cell max-w-[200px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button
                          onClick={() => setOrientationModal(company)}
                          className="flex-shrink-0 text-purple-400 hover:text-purple-600 dark:text-purple-500 dark:hover:text-purple-300 transition-colors"
                          title="Orientações da empresa"
                        >
                          <FiBookOpen size={12} />
                        </button>
                        <span className="block truncate text-xs" title={company.name}>
                          {company.name.length > 33 ? `${company.name.slice(0, 33)}…` : company.name}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-center text-xs">{company.branchNumber || "–"}</td>
                    <td className="table-cell text-xs">{company.rule}</td>
                    <td className="table-cell text-center text-xs">{company.uf || "–"}</td>
                    {viewDepartment && viewDepartment !== "all" && (
                      <td className="table-cell text-xs truncate">
                        {(viewDepartment === "Fiscal"   && company.respFiscal?.name)  ||
                         (viewDepartment === "Pessoal"  && company.respDp?.name)      ||
                         (viewDepartment === "Contábil" && company.respContabil?.name) || "–"}
                      </td>
                    )}
                    <td className="table-cell text-center">
                      {company.isHeadquarters
                        ? <span className="w-2 h-2 bg-primary-500 rounded-full inline-block" title="Matriz" />
                        : <span className="text-gray-300 dark:text-gray-600 text-xs">–</span>
                      }
                    </td>

                    {/* ── Fiscal Compacto ─────────────────────────────────────── */}
                    {showFiscalColumns && fiscalViewMode === "compact" && (
                      <>
                        <td className="table-cell text-center border-l border-gray-100 dark:border-dark-border">
                          {isReadOnly
                            ? <StatusDot checked={company.isZeroedFiscal} variant="purple" />
                            : <AgentCheckbox checked={company.isZeroedFiscal}
                                onChange={() => handleCheckboxChange(company.id, "isZeroedFiscal", company.isZeroedFiscal)}
                                disabled={!canEditFiscal} variant="purple" />
                          }
                        </td>
                        <td className="table-cell border-l border-gray-100 dark:border-dark-border">
                          {taxesLoading ? (
                            <div className="h-1.5 w-24 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                          ) : (
                            <ObligationBar
                              completed={taxCompleted}
                              total={taxTotal}
                              onOpen={() => setObligationModal(company)}
                            />
                          )}
                        </td>
                        <td className="table-cell border-l border-gray-100 dark:border-dark-border">
                          {obligationsLoading ? (
                            <div className="h-1.5 w-24 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                          ) : (
                            <ObligationBar
                              completed={oblCompleted}
                              total={oblTotal}
                              onOpen={() => setObligationModal(company)}
                            />
                          )}
                        </td>
                        <td className="table-cell text-xs whitespace-nowrap text-gray-500 dark:text-dark-text-secondary">
                          {company.fiscalCompletedAt ? formatDate(company.fiscalCompletedAt) : "–"}
                        </td>
                        <td className="table-cell border-l border-gray-100 dark:border-dark-border !px-1" style={{ width: "56px", minWidth: "56px", maxWidth: "56px" }}>
                          <input type="text" inputMode="numeric" pattern="[0-9]*" value={tempValues[company.id]?.bonusValue ?? ""}
                            onChange={(e) => handleValueChange(company.id, "bonusValue", e.target.value)}
                            onBlur={() => handleSaveOnBlur(company.id, "bonusValue")}
                            disabled={isReadOnly || !canEditFiscal}
                            className="input-base text-center !py-1 !text-xs disabled:opacity-40" />
                        </td>
                      </>
                    )}

                    {/* ── Fiscal Tabela ────────────────────────────────────────── */}
                    {showFiscalColumns && fiscalViewMode === "table" && (
                      <>
                        <td className="table-cell text-center border-l border-gray-100 dark:border-dark-border">
                          {isReadOnly
                            ? <StatusDot checked={company.isZeroedFiscal} variant="purple" />
                            : <AgentCheckbox checked={company.isZeroedFiscal}
                                onChange={() => handleCheckboxChange(company.id, "isZeroedFiscal", company.isZeroedFiscal)}
                                disabled={!canEditFiscal} variant="purple" />
                          }
                        </td>
                        {/* Colunas de Impostos */}
                        {visibleTaxes.map((tax) => {
                          const taxSt = getTaxStatus(company.id, tax.id);
                          const status = taxSt?.status;
                          const statusId = taxSt?.statusId;
                          const isDisabled = status === "disabled";
                          const isCompleted = status === "completed";
                          return (
                            <td key={`tax-${tax.id}`} className="table-cell text-center border-l border-gray-100 dark:border-dark-border !px-1">
                              {!taxSt ? (
                                <span className="text-gray-200 dark:text-gray-700 text-xs">–</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => !isDisabled && !isReadOnly && canEditFiscal && handleTaxToggle(statusId, status)}
                                  disabled={isDisabled || isReadOnly || !canEditFiscal}
                                  title={tax.name}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center mx-auto transition-colors ${
                                    isDisabled
                                      ? "bg-gray-100 dark:bg-dark-surface text-gray-300 cursor-not-allowed"
                                      : isCompleted
                                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                      : "border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-emerald-400"
                                  }`}
                                >
                                  {isDisabled ? <FiMinus size={9} className="text-gray-300" /> : isCompleted ? <FiCheck size={10} strokeWidth={3} /> : null}
                                </button>
                              )}
                            </td>
                          );
                        })}
                        {/* Colunas de Obrigações */}
                        {visibleObligations.map((obl) => {
                          const oblStatus = getOblStatus(company.id, obl.id);
                          const status = oblStatus?.status;
                          const statusId = oblStatus?.statusId;
                          const isDisabled = status === "disabled" || !obligationStatuses[company.id];
                          const isNotApplicable = status === "not_applicable";
                          const isCompleted = status === "completed";
                          // Condicional + not_applicable → clicável para restaurar
                          const isInactive = isDisabled || (isNotApplicable && !obl.isConditional);
                          return (
                            <td key={`obl-${obl.id}`} className="table-cell text-center border-l border-gray-100 dark:border-dark-border !px-1">
                              {!oblStatus ? (
                                <span className="text-gray-200 dark:text-gray-700 text-xs">–</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => !isInactive && !isReadOnly && canEditFiscal && handleObligationToggle(statusId, status, obl.isConditional)}
                                  disabled={isInactive || isReadOnly || !canEditFiscal}
                                  title={
                                    isNotApplicable
                                      ? `${obl.name} (Não se aplica — clique para restaurar)`
                                      : obl.isConditional
                                      ? `${obl.name} (Condicional)`
                                      : obl.name
                                  }
                                  className={`w-5 h-5 rounded-full flex items-center justify-center mx-auto transition-colors ${
                                    isDisabled
                                      ? "bg-gray-100 dark:bg-dark-surface text-gray-300 cursor-not-allowed"
                                      : isNotApplicable
                                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-400 hover:bg-amber-200 cursor-pointer"
                                      : isCompleted
                                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                      : "border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-emerald-400"
                                  }`}
                                >
                                  {isDisabled ? <FiMinus size={9} className="text-gray-300" /> : isNotApplicable ? <FiMinus size={9} className="text-amber-400" /> : isCompleted ? <FiCheck size={10} strokeWidth={3} /> : null}
                                </button>
                              )}
                            </td>
                          );
                        })}
                        <td className="table-cell border-l border-gray-100 dark:border-dark-border !px-1" style={{ width: "56px", minWidth: "56px", maxWidth: "56px" }}>
                          <input type="text" inputMode="numeric" pattern="[0-9]*" value={tempValues[company.id]?.bonusValue ?? ""}
                            onChange={(e) => handleValueChange(company.id, "bonusValue", e.target.value)}
                            onBlur={() => handleSaveOnBlur(company.id, "bonusValue")}
                            disabled={isReadOnly || !canEditFiscal}
                            className="input-base text-center !py-1 !text-xs disabled:opacity-40" />
                        </td>
                      </>
                    )}

                    {/* ── DP Compacto ─────────────────────────────────────────── */}
                    {showDpColumns && dpViewMode === "compact" && (() => {
                      const { completed: dpTaxComp, total: dpTaxTot } = getDpTaxStats(company.id);
                      const { completed: dpOblComp, total: dpOblTot } = getDpOblStats(company.id);
                      return (
                        <>
                          <td className="table-cell text-center border-l border-gray-100 dark:border-dark-border">
                            {isReadOnly ? <StatusDot checked={company.isZeroedDp} variant="purple" />
                              : <AgentCheckbox checked={company.isZeroedDp}
                                  onChange={() => handleCheckboxChange(company.id, "isZeroedDp", company.isZeroedDp)}
                                  disabled={!canEditDp} variant="purple" />
                            }
                          </td>
                          <td className="table-cell border-l border-gray-100 dark:border-dark-border">
                            {dpTaxLoading ? (
                              <div className="h-1.5 w-24 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                            ) : (
                              <ObligationBar completed={dpTaxComp} total={dpTaxTot} onOpen={() => setObligationModal({ company, department: "Pessoal" })} />
                            )}
                          </td>
                          <td className="table-cell border-l border-gray-100 dark:border-dark-border">
                            {dpOblLoading ? (
                              <div className="h-1.5 w-24 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                            ) : (
                              <ObligationBar completed={dpOblComp} total={dpOblTot} onOpen={() => setObligationModal({ company, department: "Pessoal" })} />
                            )}
                          </td>
                          <td className="table-cell overflow-hidden !px-1">
                            <input type="text" value={tempValues[company.id]?.employeesCount ?? ""}
                              onChange={(e) => handleValueChange(company.id, "employeesCount", e.target.value)}
                              onBlur={() => handleSaveOnBlur(company.id, "employeesCount")}
                              disabled={isReadOnly || !canEditDp || company.isZeroedDp}
                              className="input-base text-center !py-1 !text-xs !w-full disabled:opacity-40" />
                          </td>
                          <td className="table-cell text-xs whitespace-nowrap text-gray-500 dark:text-dark-text-secondary">
                            {company.dpCompletedAt ? formatDate(company.dpCompletedAt) : "–"}
                          </td>
                        </>
                      );
                    })()}

                    {/* ── DP Tabela ────────────────────────────────────────────── */}
                    {showDpColumns && dpViewMode === "table" && (
                      <>
                        <td className="table-cell text-center border-l border-gray-100 dark:border-dark-border">
                          {isReadOnly ? <StatusDot checked={company.isZeroedDp} variant="purple" />
                            : <AgentCheckbox checked={company.isZeroedDp}
                                onChange={() => handleCheckboxChange(company.id, "isZeroedDp", company.isZeroedDp)}
                                disabled={!canEditDp} variant="purple" />
                          }
                        </td>
                        {visibleDpTaxes.map((tax) => {
                          const taxSt = getDpTaxStatus(company.id, tax.id);
                          const status = taxSt?.status;
                          const statusId = taxSt?.statusId;
                          const isDisabled = status === "disabled";
                          const isCompleted = status === "completed";
                          return (
                            <td key={`dp-tax-${tax.id}`} className="table-cell text-center border-l border-gray-100 dark:border-dark-border !px-1">
                              {!taxSt ? (
                                <span className="text-gray-200 dark:text-gray-700 text-xs">–</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => !isDisabled && !isReadOnly && canEditDp && handleDpTaxToggle(statusId, status)}
                                  disabled={isDisabled || isReadOnly || !canEditDp}
                                  title={tax.name}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center mx-auto transition-colors ${
                                    isDisabled ? "bg-gray-100 dark:bg-dark-surface text-gray-300 cursor-not-allowed"
                                    : isCompleted ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                    : "border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-emerald-400"
                                  }`}
                                >
                                  {isDisabled ? <FiMinus size={9} className="text-gray-300" /> : isCompleted ? <FiCheck size={10} strokeWidth={3} /> : null}
                                </button>
                              )}
                            </td>
                          );
                        })}
                        {visibleDpObligations.map((obl) => {
                          const oblStatus = getDpOblStatus(company.id, obl.id);
                          const status = oblStatus?.status;
                          const statusId = oblStatus?.statusId;
                          const isDisabled = status === "disabled" || !dpObligationStatuses[company.id];
                          const isNotApplicable = status === "not_applicable";
                          const isCompleted = status === "completed";
                          const isInactive = isDisabled || (isNotApplicable && !obl.isConditional);
                          return (
                            <td key={`dp-obl-${obl.id}`} className="table-cell text-center border-l border-gray-100 dark:border-dark-border !px-1">
                              {!oblStatus ? (
                                <span className="text-gray-200 dark:text-gray-700 text-xs">–</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => !isInactive && !isReadOnly && canEditDp && handleDpObligationToggle(statusId, status, obl.isConditional)}
                                  disabled={isInactive || isReadOnly || !canEditDp}
                                  title={isNotApplicable ? `${obl.name} (Não se aplica)` : obl.name}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center mx-auto transition-colors ${
                                    isDisabled ? "bg-gray-100 dark:bg-dark-surface text-gray-300 cursor-not-allowed"
                                    : isNotApplicable ? "bg-amber-100 dark:bg-amber-900/30 text-amber-400 hover:bg-amber-200 cursor-pointer"
                                    : isCompleted ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                    : "border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-emerald-400"
                                  }`}
                                >
                                  {isDisabled ? <FiMinus size={9} className="text-gray-300" /> : isNotApplicable ? <FiMinus size={9} className="text-amber-400" /> : isCompleted ? <FiCheck size={10} strokeWidth={3} /> : null}
                                </button>
                              )}
                            </td>
                          );
                        })}
                        <td className="table-cell overflow-hidden !px-1">
                          <input type="text" value={tempValues[company.id]?.employeesCount ?? ""}
                            onChange={(e) => handleValueChange(company.id, "employeesCount", e.target.value)}
                            onBlur={() => handleSaveOnBlur(company.id, "employeesCount")}
                            disabled={isReadOnly || !canEditDp || company.isZeroedDp}
                            className="input-base text-center !py-1 !text-xs !w-full disabled:opacity-40" />
                        </td>
                        <td className="table-cell text-xs whitespace-nowrap text-gray-500 dark:text-dark-text-secondary">
                          {company.dpCompletedAt ? formatDate(company.dpCompletedAt) : "–"}
                        </td>
                      </>
                    )}

                    {/* ── Contábil Compacto ────────────────────────────────────── */}
                    {showContabilColumns && contabilViewMode === "compact" && (() => {
                      const { completed: cTaxComp, total: cTaxTot } = getContabilTaxStats(company.id);
                      const { completed: cOblComp, total: cOblTot } = getContabilOblStats(company.id);
                      return (
                        <>
                          <td className="table-cell text-center border-l border-gray-100 dark:border-dark-border">
                            {isReadOnly ? <StatusDot checked={company.isZeroedContabil} variant="purple" />
                              : <AgentCheckbox checked={company.isZeroedContabil}
                                  onChange={() => handleCheckboxChange(company.id, "isZeroedContabil", company.isZeroedContabil)}
                                  disabled={!canEditContabil} variant="purple" />
                            }
                          </td>
                          <td className="table-cell border-l border-gray-100 dark:border-dark-border">
                            {contabilTaxLoading ? (
                              <div className="h-1.5 w-24 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                            ) : (
                              <ObligationBar completed={cTaxComp} total={cTaxTot} onOpen={() => setObligationModal({ company, department: "Contábil" })} />
                            )}
                          </td>
                          <td className="table-cell border-l border-gray-100 dark:border-dark-border">
                            {contabilOblLoading ? (
                              <div className="h-1.5 w-24 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                            ) : (
                              <ObligationBar completed={cOblComp} total={cOblTot} onOpen={() => setObligationModal({ company, department: "Contábil" })} />
                            )}
                          </td>
                          <td className="table-cell border-l border-gray-100 dark:border-dark-border !px-1">
                            <input type="text" inputMode="numeric" pattern="[0-9]*" value={tempValues[company.id]?.accountingMonthsCount ?? ""}
                              onChange={(e) => handleValueChange(company.id, "accountingMonthsCount", e.target.value)}
                              onBlur={() => handleSaveOnBlur(company.id, "accountingMonthsCount")}
                              disabled={isReadOnly || !canEditContabil}
                              className="input-base text-center !py-1 !text-xs disabled:opacity-40" />
                          </td>
                          <td className="table-cell text-xs whitespace-nowrap text-gray-500 dark:text-dark-text-secondary">
                            {company.contabilCompletedAt ? formatDate(company.contabilCompletedAt) : "–"}
                          </td>
                        </>
                      );
                    })()}

                    {/* ── Contábil Tabela ──────────────────────────────────────── */}
                    {showContabilColumns && contabilViewMode === "table" && (
                      <>
                        <td className="table-cell text-center border-l border-gray-100 dark:border-dark-border">
                          {isReadOnly ? <StatusDot checked={company.isZeroedContabil} variant="purple" />
                            : <AgentCheckbox checked={company.isZeroedContabil}
                                onChange={() => handleCheckboxChange(company.id, "isZeroedContabil", company.isZeroedContabil)}
                                disabled={!canEditContabil} variant="purple" />
                          }
                        </td>
                        {visibleContabilTaxes.map((tax) => {
                          const taxSt = getContabilTaxStatus(company.id, tax.id);
                          const status = taxSt?.status;
                          const statusId = taxSt?.statusId;
                          const isDisabled = status === "disabled";
                          const isCompleted = status === "completed";
                          return (
                            <td key={`cont-tax-${tax.id}`} className="table-cell text-center border-l border-gray-100 dark:border-dark-border !px-1">
                              {!taxSt ? (
                                <span className="text-gray-200 dark:text-gray-700 text-xs">–</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => !isDisabled && !isReadOnly && canEditContabil && handleContabilTaxToggle(statusId, status)}
                                  disabled={isDisabled || isReadOnly || !canEditContabil}
                                  title={tax.name}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center mx-auto transition-colors ${
                                    isDisabled ? "bg-gray-100 dark:bg-dark-surface text-gray-300 cursor-not-allowed"
                                    : isCompleted ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                    : "border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-emerald-400"
                                  }`}
                                >
                                  {isDisabled ? <FiMinus size={9} className="text-gray-300" /> : isCompleted ? <FiCheck size={10} strokeWidth={3} /> : null}
                                </button>
                              )}
                            </td>
                          );
                        })}
                        {visibleContabilObls.map((obl) => {
                          const oblStatus = getContabilOblStatus(company.id, obl.id);
                          const status = oblStatus?.status;
                          const statusId = oblStatus?.statusId;
                          const isDisabled = status === "disabled" || !contabilObligationStatuses[company.id];
                          const isNotApplicable = status === "not_applicable";
                          const isCompleted = status === "completed";
                          const isInactive = isDisabled || (isNotApplicable && !obl.isConditional);
                          return (
                            <td key={`cont-obl-${obl.id}`} className="table-cell text-center border-l border-gray-100 dark:border-dark-border !px-1">
                              {!oblStatus ? (
                                <span className="text-gray-200 dark:text-gray-700 text-xs">–</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => !isInactive && !isReadOnly && canEditContabil && handleContabilObligationToggle(statusId, status, obl.isConditional)}
                                  disabled={isInactive || isReadOnly || !canEditContabil}
                                  title={isNotApplicable ? `${obl.name} (Não se aplica)` : obl.name}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center mx-auto transition-colors ${
                                    isDisabled ? "bg-gray-100 dark:bg-dark-surface text-gray-300 cursor-not-allowed"
                                    : isNotApplicable ? "bg-amber-100 dark:bg-amber-900/30 text-amber-400 hover:bg-amber-200 cursor-pointer"
                                    : isCompleted ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                    : "border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-emerald-400"
                                  }`}
                                >
                                  {isDisabled ? <FiMinus size={9} className="text-gray-300" /> : isNotApplicable ? <FiMinus size={9} className="text-amber-400" /> : isCompleted ? <FiCheck size={10} strokeWidth={3} /> : null}
                                </button>
                              )}
                            </td>
                          );
                        })}
                        <td className="table-cell border-l border-gray-100 dark:border-dark-border !px-1">
                          <input type="number" value={tempValues[company.id]?.accountingMonthsCount ?? ""}
                            onChange={(e) => handleValueChange(company.id, "accountingMonthsCount", e.target.value)}
                            onBlur={() => handleSaveOnBlur(company.id, "accountingMonthsCount")}
                            disabled={isReadOnly || !canEditContabil}
                            className="input-base text-center !py-1 !text-xs disabled:opacity-40" />
                        </td>
                        <td className="table-cell text-xs whitespace-nowrap text-gray-500 dark:text-dark-text-secondary">
                          {company.contabilCompletedAt ? formatDate(company.contabilCompletedAt) : "–"}
                        </td>
                      </>
                    )}

                  </tr>
                );
              })}

              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={20} className="table-cell text-center py-8 text-gray-400 dark:text-dark-text-secondary">
                    Nenhuma empresa encontrada para os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal de progresso de obrigações ───────────────────────────────── */}
      {obligationModal && (() => {
        const isNew = obligationModal.company !== undefined;
        const modalCompany = isNew ? obligationModal.company : obligationModal;
        const modalDept = isNew ? obligationModal.department : "Fiscal";
        const modalPeriod = selectedPeriod;
        return (
          <ObligationProgressModal
            company={modalCompany}
            currentPeriod={modalPeriod}
            department={modalDept}
            onClose={() => setObligationModal(null)}
          />
        );
      })()}

      {/* ── Modal de orientações ─────────────────────────────────────────────── */}
      {orientationModal && (
        <OrientationsModal
          company={orientationModal}
          onClose={() => setOrientationModal(null)}
        />
      )}
    </>
  );
};

export default AgentCompaniesView;
