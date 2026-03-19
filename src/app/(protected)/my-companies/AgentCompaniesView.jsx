"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  FiSearch, FiX, FiCheck, FiMinus, FiList, FiGrid,
  FiExternalLink,
} from "react-icons/fi";
import api from "../../../utils/api";
import { toast } from "react-toastify";
import { formatDate } from "../../../utils/utils";
import ObligationProgressModal from "../../../components/ObligationProgressModal";

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

const DeptHeader = ({ label, colSpan, color, minWidth, wrap }) => {
  const colors = {
    blue:   "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
    green:  "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
    yellow: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
  };
  return (
    <th
      colSpan={colSpan}
      style={minWidth ? { minWidth } : undefined}
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
  const [filters, setFilters] = useState({
    sentToClient: null, isZeroed: null, regime: [], classi: [],
  });

  // ── Obrigações (Fiscal) ────────────────────────────────────────────────────
  const [obligations, setObligations] = useState([]);
  const [obligationStatuses, setObligationStatuses] = useState({});
  const [obligationsLoading, setObligationsLoading] = useState(false);
  // ── Impostos (Fiscal) ─────────────────────────────────────────────────────
  const [taxes, setTaxes] = useState([]);
  const [taxStatuses, setTaxStatuses] = useState({});
  const [taxesLoading, setTaxesLoading] = useState(false);

  const [fiscalViewMode, setFiscalViewMode] = useState("compact"); // "compact" | "table"
  const [obligationModal, setObligationModal] = useState(null); // company object or null
  const [currentPeriod, setCurrentPeriod] = useState(null);

  const activeDepartment = viewDepartment || user?.department;
  const showFiscalColumns  = activeDepartment === "Fiscal";
  const showDpColumns      = activeDepartment === "Pessoal";
  const showContabilColumns = activeDepartment === "Contábil";

  const canEditFiscal   = !isReadOnly && user?.department === "Fiscal";
  const canEditDp       = !isReadOnly && user?.department === "Pessoal";
  const canEditContabil = !isReadOnly && user?.department === "Contábil";

  const regimes        = ["Simples", "Presumido", "Real", "MEI", "Isenta", "Doméstica"];
  const classificacoes = ["ICMS", "ISS", "ICMS/ISS", "Outros"];

  // Inicializa valores dos inputs (DP/Contábil)
  useEffect(() => {
    const initial = {};
    companies.forEach((c) => {
      initial[c.id] = {
        employeesCount:       c.employeesCount       ?? "",
        accountingMonthsCount: c.accountingMonthsCount ?? "",
      };
    });
    setTempValues(initial);
  }, [companies]);

  // Carrega obrigações e impostos quando o modo Fiscal está ativo
  useEffect(() => {
    if (!showFiscalColumns) return;

    const fetchObligations = async () => {
      setObligationsLoading(true);
      try {
        const res = await api.get("/obligation/period-summary?department=Fiscal");
        setObligations(res.data.obligations || []);
        setCurrentPeriod(res.data.period || null);
        const map = {};
        (res.data.companies || []).forEach((c) => { map[c.companyId] = c.obligations; });
        setObligationStatuses(map);
      } catch {} finally {
        setObligationsLoading(false);
      }
    };

    const fetchTaxes = async () => {
      setTaxesLoading(true);
      try {
        const res = await api.get("/tax/period-summary");
        setTaxes(res.data.taxes || []);
        const map = {};
        (res.data.companies || []).forEach((c) => { map[c.companyId] = c.taxes; });
        setTaxStatuses(map);
      } catch {} finally {
        setTaxesLoading(false);
      }
    };

    fetchObligations();
    fetchTaxes();
  }, [showFiscalColumns, companies]);

  // ── Handlers de checkbox (Fiscal: envio/zerado) e DP/Contábil ──────────────
  const handleCheckboxChange = useCallback(async (companyId, field, currentValue) => {
    if (isReadOnly) return;
    try {
      const newValue = !currentValue;
      await api.patch(`/company/update-agent-data/${companyId}`, { [field]: newValue });
      toast.success("Dados atualizados!");
      fetchCompanies();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao atualizar.");
    }
  }, [fetchCompanies, isReadOnly]);

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
      if (!company.sentToClientDp || !company.declarationsCompletedDp) {
        toast.error("Marque Envio e Obrigações do DP antes de salvar o número de funcionários.");
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
    } catch {
      toast.error("Erro ao atualizar imposto.");
    }
  }, [isReadOnly, canEditFiscal]);

  // ── Atualizar status de obrigação (modo tabela Fiscal) ────────────────────
  const handleObligationToggle = useCallback(async (statusId, currentStatus) => {
    if (isReadOnly || !canEditFiscal) return;
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await api.patch(`/obligation/status/${statusId}`, { status: newStatus });
      // Atualiza localmente sem refetch completo
      setObligationStatuses((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((companyId) => {
          next[companyId] = next[companyId].map((o) =>
            o.statusId === statusId ? { ...o, status: newStatus } : o
          );
        });
        return next;
      });
    } catch {
      toast.error("Erro ao atualizar obrigação.");
    }
  }, [isReadOnly, canEditFiscal]);

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
    setFilters({ sentToClient: null, isZeroed: null, regime: [], classi: [] });
  }, []);

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
      if (filters.sentToClient !== null)
        result = result.filter((c) => c.sentToClientDp === filters.sentToClient);
      if (filters.isZeroed !== null)
        result = result.filter((c) => c.isZeroedDp === filters.isZeroed);
    }
    if (filters.regime.length > 0) result = result.filter((c) => filters.regime.includes(c.rule));
    if (filters.classi.length  > 0) result = result.filter((c) => filters.classi.includes(c.classi));
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [companies, searchTerm, filters, showFiscalColumns, showDpColumns]);

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
    const txs = taxStatuses[companyId] || [];
    return { total: txs.length, completed: txs.filter((t) => t.status === "completed").length };
  };

  const getTaxStatus = (companyId, taxId) =>
    (taxStatuses[companyId] || []).find((t) => t.taxId === taxId);

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
                  onClick={() => setFiscalViewMode("compact")}
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
                  onClick={() => setFiscalViewMode("table")}
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
          {(showFiscalColumns || showDpColumns) && (
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
        </div>
      </div>

      {/* ── Tabela ──────────────────────────────────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-header w-12">Nº</th>
                <th className="table-header" style={{ minWidth: "180px" }}>Razão Social</th>
                <th className="table-header w-12 text-center">Filial</th>
                <th className="table-header w-20">Regime</th>
                <th className="table-header w-10 text-center">UF</th>
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
                  </>
                )}

                {/* ── Colunas Fiscal — Modo Tabela (imposto/obrigação por coluna) ── */}
                {showFiscalColumns && fiscalViewMode === "table" && (
                  <>
                    <DeptHeader label="Zerado" colSpan={1} color="blue" />
                    {taxes.map((tax) => (
                      <DeptHeader key={`tax-${tax.id}`} label={tax.name} colSpan={1} color="blue" minWidth="64px" wrap />
                    ))}
                    {taxesLoading && <DeptHeader label="…" colSpan={1} color="blue" />}
                    {obligations.map((obl) => (
                      <DeptHeader key={`obl-${obl.id}`} label={obl.name} colSpan={1} color="blue" minWidth="72px" wrap />
                    ))}
                    {obligationsLoading && <DeptHeader label="…" colSpan={1} color="blue" />}
                  </>
                )}

                {/* ── Colunas DP ── */}
                {showDpColumns && (
                  <>
                    <DeptHeader label="Envio"      colSpan={1} color="green" />
                    <DeptHeader label="Obrigações" colSpan={1} color="green" />
                    <DeptHeader label="Sem Obrig." colSpan={1} color="green" />
                    <DeptHeader label="Zerado"     colSpan={1} color="green" />
                    <DeptHeader label="Func."      colSpan={1} color="green" minWidth="60px" />
                    <DeptHeader label="Conclusão"  colSpan={1} color="green" />
                  </>
                )}

                {/* ── Colunas Contábil ── */}
                {showContabilColumns && (
                  <DeptHeader label="Meses Contabilizados" colSpan={1} color="yellow" />
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
                    <td className="table-cell max-w-[180px]">
                      <span className="block truncate text-xs" title={company.name}>
                        {company.name.length > 35 ? `${company.name.slice(0, 35)}…` : company.name}
                      </span>
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
                          <ObligationBar
                            completed={taxCompleted}
                            total={taxTotal}
                            onOpen={() => setObligationModal(company)}
                          />
                        </td>
                        <td className="table-cell border-l border-gray-100 dark:border-dark-border">
                          <ObligationBar
                            completed={oblCompleted}
                            total={oblTotal}
                            onOpen={() => setObligationModal(company)}
                          />
                        </td>
                        <td className="table-cell text-xs whitespace-nowrap text-gray-500 dark:text-dark-text-secondary">
                          {company.fiscalCompletedAt ? formatDate(company.fiscalCompletedAt) : "–"}
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
                        {taxes.map((tax) => {
                          const taxSt = getTaxStatus(company.id, tax.id);
                          const status = taxSt?.status;
                          const statusId = taxSt?.statusId;
                          const isCompleted = status === "completed";
                          return (
                            <td key={`tax-${tax.id}`} className="table-cell text-center border-l border-gray-100 dark:border-dark-border !px-1">
                              {!taxSt ? (
                                <span className="text-gray-200 dark:text-gray-700 text-xs">–</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => !isReadOnly && canEditFiscal && handleTaxToggle(statusId, status)}
                                  disabled={isReadOnly || !canEditFiscal}
                                  title={tax.name}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center mx-auto transition-colors ${
                                    isCompleted
                                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                      : "border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-emerald-400"
                                  }`}
                                >
                                  {isCompleted && <FiCheck size={10} strokeWidth={3} />}
                                </button>
                              )}
                            </td>
                          );
                        })}
                        {/* Colunas de Obrigações */}
                        {obligations.map((obl) => {
                          const oblStatus = getOblStatus(company.id, obl.id);
                          const status = oblStatus?.status;
                          const statusId = oblStatus?.statusId;
                          const isDisabled = status === "disabled" || !obligationStatuses[company.id];
                          const isCompleted = status === "completed";
                          return (
                            <td key={`obl-${obl.id}`} className="table-cell text-center border-l border-gray-100 dark:border-dark-border !px-1">
                              {!oblStatus ? (
                                <span className="text-gray-200 dark:text-gray-700 text-xs">–</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => !isDisabled && !isReadOnly && canEditFiscal && handleObligationToggle(statusId, status)}
                                  disabled={isDisabled || isReadOnly || !canEditFiscal}
                                  title={obl.name}
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
                      </>
                    )}

                    {/* ── DP ──────────────────────────────────────────────────── */}
                    {showDpColumns && (
                      <>
                        <td className="table-cell text-center border-l border-gray-100 dark:border-dark-border">
                          {isReadOnly ? <StatusDot checked={company.sentToClientDp} />
                            : <AgentCheckbox checked={company.sentToClientDp}
                                onChange={() => handleCheckboxChange(company.id, "sentToClientDp", company.sentToClientDp)}
                                disabled={!canEditDp || company.isZeroedDp} />
                          }
                        </td>
                        <td className="table-cell text-center">
                          {isReadOnly ? <StatusDot checked={company.declarationsCompletedDp} />
                            : <AgentCheckbox checked={company.declarationsCompletedDp}
                                onChange={() => handleCheckboxChange(company.id, "declarationsCompletedDp", company.declarationsCompletedDp)}
                                disabled={!canEditDp || company.hasNoDpObligations} />
                          }
                        </td>
                        <td className="table-cell text-center">
                          {isReadOnly ? <StatusDot checked={company.hasNoDpObligations} variant="red" />
                            : <AgentCheckbox checked={company.hasNoDpObligations}
                                onChange={() => handleCheckboxChange(company.id, "hasNoDpObligations", company.hasNoDpObligations)}
                                disabled={!canEditDp} variant="red" />
                          }
                        </td>
                        <td className="table-cell text-center">
                          {isReadOnly ? <StatusDot checked={company.isZeroedDp} variant="purple" />
                            : <AgentCheckbox checked={company.isZeroedDp}
                                onChange={() => handleCheckboxChange(company.id, "isZeroedDp", company.isZeroedDp)}
                                disabled={!canEditDp} variant="purple" />
                          }
                        </td>
                        <td className="table-cell overflow-hidden !px-1">
                          <input type="text" value={tempValues[company.id]?.employeesCount ?? ""}
                            onChange={(e) => handleValueChange(company.id, "employeesCount", e.target.value)}
                            onBlur={() => handleSaveOnBlur(company.id, "employeesCount")}
                            disabled={isReadOnly || !canEditDp || !company.sentToClientDp || !company.declarationsCompletedDp || company.isZeroedDp}
                            className="input-base text-center !py-1 !text-xs !w-full disabled:opacity-40" />
                        </td>
                        <td className="table-cell text-xs whitespace-nowrap text-gray-500 dark:text-dark-text-secondary">
                          {company.dpCompletedAt ? formatDate(company.dpCompletedAt) : "–"}
                        </td>
                      </>
                    )}

                    {/* ── Contábil ────────────────────────────────────────────── */}
                    {showContabilColumns && (
                      <td className="table-cell border-l border-gray-100 dark:border-dark-border">
                        <input type="number" value={tempValues[company.id]?.accountingMonthsCount ?? ""}
                          onChange={(e) => handleValueChange(company.id, "accountingMonthsCount", e.target.value)}
                          onBlur={() => handleSaveOnBlur(company.id, "accountingMonthsCount")}
                          disabled={isReadOnly || !canEditContabil}
                          className="input-base text-center !py-1 !text-xs disabled:opacity-40" />
                      </td>
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
      {obligationModal && (
        <ObligationProgressModal
          company={obligationModal}
          currentPeriod={currentPeriod}
          onClose={() => setObligationModal(null)}
        />
      )}
    </>
  );
};

export default AgentCompaniesView;
