"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  FiSearch,
  FiX,
  FiCheck,
  FiMinus,
} from "react-icons/fi";
import api from "../../../utils/api";
import { toast } from "react-toastify";
import { formatDate } from "../../../utils/utils";

// ── Checkbox visual somente-leitura ──────────────────────────────────────────
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

// ── Checkbox interativo ───────────────────────────────────────────────────────
const AgentCheckbox = ({ checked, onChange, disabled, variant = "green" }) => {
  const accentColors = {
    green:  "accent-emerald-500",
    purple: "accent-purple-500",
    red:    "accent-red-400",
  };
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={`h-4 w-4 rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${accentColors[variant]}`}
    />
  );
};

// ── Grupo de filtro ───────────────────────────────────────────────────────────
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

// ── Cabeçalho de grupo de departamento ───────────────────────────────────────
const DeptHeader = ({ label, colSpan, color, width }) => {
  const colors = {
    blue:   "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
    green:  "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
    yellow: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
  };
  return (
    <th
      colSpan={colSpan}
      style={width ? { width, minWidth: width, maxWidth: width } : undefined}
      className={`table-header text-center border-l border-gray-200 dark:border-dark-border ${colors[color]}`}
    >
      {label}
    </th>
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
    sentToClient: null,
    declarationsCompleted: null,
    bonusFilled: null,
    isZeroed: null,
    regime: [],
    classi: [],
  });

  const regimes        = ["Simples", "Presumido", "Real", "MEI", "Isenta", "Doméstica"];
  const classificacoes = ["ICMS", "ISS", "ICMS/ISS", "Outros"];

  const activeDepartment  = viewDepartment || user?.department;
  const showFiscalColumns  = activeDepartment === "Fiscal";
  const showDpColumns      = activeDepartment === "Pessoal";
  const showContabilColumns = activeDepartment === "Contábil";

  const canEditFiscal   = !isReadOnly && user?.department === "Fiscal";
  const canEditDp       = !isReadOnly && user?.department === "Pessoal";
  const canEditContabil = !isReadOnly && user?.department === "Contábil";

  useEffect(() => {
    const initial = {};
    companies.forEach((c) => {
      initial[c.id] = {
        bonusValue:           c.bonusValue           ?? "",
        employeesCount:       c.employeesCount       ?? "",
        accountingMonthsCount: c.accountingMonthsCount ?? "",
      };
    });
    setTempValues(initial);
  }, [companies]);

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleCheckboxChange = useCallback(
    async (companyId, field, currentValue) => {
      if (isReadOnly) return;
      try {
        const newValue = !currentValue;
        const updateData = { [field]: newValue };
        if (field === "isZeroedFiscal" && newValue) {
          updateData.bonusValue       = 1;
          updateData.sentToClientFiscal = false;
        }
        if (field === "isZeroedDp" && newValue) {
          updateData.employeesCount = 0;
          updateData.sentToClientDp = false;
        }
        if (field === "hasNoFiscalObligations" && newValue) updateData.declarationsCompletedFiscal = false;
        if (field === "hasNoDpObligations"     && newValue) updateData.declarationsCompletedDp     = false;
        await api.patch(`/company/update-agent-data/${companyId}`, updateData);
        toast.success("Dados atualizados com sucesso!");
        fetchCompanies();
      } catch (error) {
        toast.error(error.response?.data?.message || "Erro ao atualizar.");
      }
    },
    [fetchCompanies, isReadOnly]
  );

  const handleValueChange = useCallback(
    (companyId, field, value) => {
      if (isReadOnly) return;
      setTempValues((prev) => ({ ...prev, [companyId]: { ...prev[companyId], [field]: value } }));
    },
    [isReadOnly]
  );

  const handleSaveOnBlur = useCallback(
    async (companyId, field) => {
      if (isReadOnly) return;
      const company = companies.find((c) => c.id === companyId);
      if (!company) return;
      const valueToSave = tempValues[companyId]?.[field];
      if (valueToSave === (company[field] ?? "") || valueToSave === "") return;
      const updateData = {};
      if (field === "bonusValue") {
        if (!company.sentToClientFiscal || !company.declarationsCompletedFiscal) {
          toast.error("Marque 'Envio' e 'Obrigações' do Fiscal antes de salvar a bonificação.");
          return;
        }
        const v = parseInt(valueToSave, 10);
        if (isNaN(v) || v < 0 || v > 5) { toast.error("A nota para o Fiscal deve ser entre 0 e 5."); return; }
        updateData[field] = v;
      } else if (field === "employeesCount") {
        if (!company.sentToClientDp || !company.declarationsCompletedDp) {
          toast.error("Marque 'Envio' e 'Obrigações' do DP antes de salvar o número de funcionários.");
          return;
        }
        const v = parseInt(valueToSave, 10);
        if (isNaN(v) || v < 0) { toast.error("O número de funcionários deve ser um número válido."); return; }
        updateData[field] = v;
      } else if (field === "accountingMonthsCount") {
        const v = parseInt(valueToSave, 10);
        if (isNaN(v) || v < 0) {
          toast.error("O número de meses deve ser um número válido (0 ou maior).");
          setTempValues((prev) => ({ ...prev, [companyId]: { ...prev[companyId], [field]: company[field] ?? "" } }));
          return;
        }
        updateData[field] = v;
      }
      try {
        await api.patch(`/company/update-agent-data/${companyId}`, updateData);
        toast.success("Valor salvo com sucesso!");
        fetchCompanies();
      } catch (error) {
        toast.error(error.response?.data?.message || "Erro ao salvar o valor.");
      }
    },
    [companies, tempValues, fetchCompanies, isReadOnly]
  );

  const toggleBoolFilter = useCallback((category, value) => {
    setFilters((prev) => ({ ...prev, [category]: prev[category] === value ? null : value }));
  }, []);

  const toggleArrayFilter = useCallback((category, value) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((i) => i !== value)
        : [...prev[category], value],
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilters({ sentToClient: null, declarationsCompleted: null, bonusFilled: null, isZeroed: null, regime: [], classi: [] });
  }, []);

  // ── filtragem ────────────────────────────────────────────────────────────────
  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.num?.toString().includes(q) ||
          c.cnpj?.includes(q) ||
          c.uf?.toLowerCase().includes(q)
      );
    }

    const dept = activeDepartment;
    if (dept === "Fiscal" || dept === "Pessoal") {
      const sfx = dept === "Fiscal" ? "Fiscal" : "Dp";
      if (filters.sentToClient !== null)
        result = result.filter((c) => c[`sentToClient${sfx}`] === filters.sentToClient);
      if (filters.declarationsCompleted !== null)
        result = result.filter((c) => c[`declarationsCompleted${sfx}`] === filters.declarationsCompleted);
      if (filters.isZeroed !== null)
        result = result.filter((c) => c[`isZeroed${sfx}`] === filters.isZeroed);
      if (filters.bonusFilled !== null) {
        const bonusField = dept === "Fiscal" ? "bonusValue" : "employeesCount";
        result = result.filter(
          (c) => (c[bonusField] !== null && c[bonusField] !== undefined) === filters.bonusFilled
        );
      }
    }
    if (filters.regime.length > 0) result = result.filter((c) => filters.regime.includes(c.rule));
    if (filters.classi.length  > 0) result = result.filter((c) => filters.classi.includes(c.classi));

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [companies, searchTerm, filters, activeDepartment]);

  // ── contagem de filtros ativos ───────────────────────────────────────────────
  const activeFilterCount = [
    filters.sentToClient !== null ? 1 : 0,
    filters.declarationsCompleted !== null ? 1 : 0,
    filters.bonusFilled !== null ? 1 : 0,
    filters.isZeroed !== null ? 1 : 0,
    filters.regime.length,
    filters.classi.length,
  ].reduce((a, b) => a + b, 0);

  const showAdvancedFilters = showFiscalColumns || showDpColumns;

  return (
    <>
      {/* ── Filtros ──────────────────────────────────────────────────────────── */}
      <div className="card mb-4 space-y-4">

        {/* Linha de busca */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="label-base">Pesquisa</label>
            <div className="relative">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, número, CNPJ ou UF..."
                className="input-base pl-8"
              />
            </div>
          </div>
          <div className="flex items-end gap-2 pb-px">
            {activeFilterCount > 0 && (
              <span className="text-[11px] text-gray-400 dark:text-dark-text-secondary whitespace-nowrap">
                {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""} ativo{activeFilterCount > 1 ? "s" : ""}
              </span>
            )}
            <button onClick={clearFilters} className="btn-danger text-xs">
              <FiX size={13} />
              Limpar
            </button>
          </div>
        </div>

        {/* Filtros avançados (Fiscal / DP) */}
        {showAdvancedFilters && (
          <>
            <div className="border-t border-gray-100 dark:border-dark-border" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4">
              <FilterGroup label="Envio">
                <CheckItem label="Enviados"     checked={filters.sentToClient === true}  onChange={() => toggleBoolFilter("sentToClient", true)}  />
                <CheckItem label="Não enviados" checked={filters.sentToClient === false} onChange={() => toggleBoolFilter("sentToClient", false)} />
              </FilterGroup>
              <FilterGroup label="Obrigações">
                <CheckItem label="Concluídas"     checked={filters.declarationsCompleted === true}  onChange={() => toggleBoolFilter("declarationsCompleted", true)}  />
                <CheckItem label="Não concluídas" checked={filters.declarationsCompleted === false} onChange={() => toggleBoolFilter("declarationsCompleted", false)} />
              </FilterGroup>
              <FilterGroup label={showFiscalColumns ? "Nota" : "Funcionários"}>
                <CheckItem label="Preenchido" checked={filters.bonusFilled === true}  onChange={() => toggleBoolFilter("bonusFilled", true)}  />
                <CheckItem label="Vazio"      checked={filters.bonusFilled === false} onChange={() => toggleBoolFilter("bonusFilled", false)} />
              </FilterGroup>
              <FilterGroup label="Zerado">
                <CheckItem label="Zeradas"     checked={filters.isZeroed === true}  onChange={() => toggleBoolFilter("isZeroed", true)}  />
                <CheckItem label="Não zeradas" checked={filters.isZeroed === false} onChange={() => toggleBoolFilter("isZeroed", false)} />
              </FilterGroup>
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
          </>
        )}
      </div>

      {/* ── Tabela ───────────────────────────────────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead>
              <tr>
                <th className="table-header w-12">Nº</th>
                <th className="table-header" style={{ minWidth: "200px" }}>Razão Social</th>
                <th className="table-header w-12 text-center">Filial</th>
                <th className="table-header w-20">Regime</th>
                <th className="table-header w-10 text-center">UF</th>
                {viewDepartment && viewDepartment !== "all" && (
                  <th className="table-header w-32">Responsável</th>
                )}
                <th className="table-header w-14 text-center">Matriz</th>

                {showFiscalColumns && (
                  <>
                    <DeptHeader label="Envio"           colSpan={1} color="blue" />
                    <DeptHeader label="Obrigações"      colSpan={1} color="blue" />
                    <DeptHeader label="Sem Obrig."      colSpan={1} color="blue" />
                    <DeptHeader label="Zerado"          colSpan={1} color="blue" />
                    <DeptHeader label="Nota"            colSpan={1} color="blue" width="60px" />
                    <DeptHeader label="Conclusão"       colSpan={1} color="blue" />
                  </>
                )}
                {showDpColumns && (
                  <>
                    <DeptHeader label="Envio"           colSpan={1} color="green" />
                    <DeptHeader label="Obrigações"      colSpan={1} color="green" />
                    <DeptHeader label="Sem Obrig."      colSpan={1} color="green" />
                    <DeptHeader label="Zerado"          colSpan={1} color="green" />
                    <DeptHeader label="Func."           colSpan={1} color="green" width="60px" />
                    <DeptHeader label="Conclusão"       colSpan={1} color="green" />
                  </>
                )}
                {showContabilColumns && (
                  <DeptHeader label="Meses Contabilizados" colSpan={1} color="yellow" />
                )}
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="table-row">
                  <td className="table-cell font-mono text-xs">{company.num}</td>
                  <td className="table-cell max-w-[200px]">
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
                       (viewDepartment === "Contábil" && company.respContabil?.name) ||
                       "–"}
                    </td>
                  )}
                  <td className="table-cell text-center">
                    {company.isHeadquarters ? (
                      <span className="w-2 h-2 bg-primary-500 rounded-full inline-block" title="Matriz" />
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 text-xs">–</span>
                    )}
                  </td>

                  {showFiscalColumns && (
                    <>
                      {/* Envio */}
                      <td className="table-cell text-center border-l border-gray-100 dark:border-dark-border">
                        {isReadOnly
                          ? <StatusDot checked={company.sentToClientFiscal} />
                          : <AgentCheckbox
                              checked={company.sentToClientFiscal}
                              onChange={() => handleCheckboxChange(company.id, "sentToClientFiscal", company.sentToClientFiscal)}
                              disabled={!canEditFiscal || company.isZeroedFiscal}
                            />
                        }
                      </td>
                      {/* Obrigações */}
                      <td className="table-cell text-center">
                        {isReadOnly
                          ? <StatusDot checked={company.declarationsCompletedFiscal} />
                          : <AgentCheckbox
                              checked={company.declarationsCompletedFiscal}
                              onChange={() => handleCheckboxChange(company.id, "declarationsCompletedFiscal", company.declarationsCompletedFiscal)}
                              disabled={!canEditFiscal || company.hasNoFiscalObligations}
                            />
                        }
                      </td>
                      {/* Sem Obrigações */}
                      <td className="table-cell text-center">
                        {isReadOnly
                          ? <StatusDot checked={company.hasNoFiscalObligations} variant="red" />
                          : <AgentCheckbox
                              checked={company.hasNoFiscalObligations}
                              onChange={() => handleCheckboxChange(company.id, "hasNoFiscalObligations", company.hasNoFiscalObligations)}
                              disabled={!canEditFiscal}
                              variant="red"
                            />
                        }
                      </td>
                      {/* Zerado */}
                      <td className="table-cell text-center">
                        {isReadOnly
                          ? <StatusDot checked={company.isZeroedFiscal} variant="purple" />
                          : <AgentCheckbox
                              checked={company.isZeroedFiscal}
                              onChange={() => handleCheckboxChange(company.id, "isZeroedFiscal", company.isZeroedFiscal)}
                              disabled={!canEditFiscal}
                              variant="purple"
                            />
                        }
                      </td>
                      {/* Nota */}
                      <td className="table-cell overflow-hidden !px-1">
                        <input
                          type="text"
                          value={tempValues[company.id]?.bonusValue ?? ""}
                          onChange={(e) => handleValueChange(company.id, "bonusValue", e.target.value)}
                          onBlur={() => handleSaveOnBlur(company.id, "bonusValue")}
                          disabled={isReadOnly || !canEditFiscal || !company.sentToClientFiscal || !company.declarationsCompletedFiscal || company.isZeroedFiscal}
                          className="input-base text-center !py-1 !text-xs !w-full disabled:opacity-40"
                        />
                      </td>
                      {/* Conclusão */}
                      <td className="table-cell text-xs whitespace-nowrap text-gray-500 dark:text-dark-text-secondary">
                        {company.fiscalCompletedAt ? formatDate(company.fiscalCompletedAt) : "–"}
                      </td>
                    </>
                  )}

                  {showDpColumns && (
                    <>
                      {/* Envio */}
                      <td className="table-cell text-center border-l border-gray-100 dark:border-dark-border">
                        {isReadOnly
                          ? <StatusDot checked={company.sentToClientDp} />
                          : <AgentCheckbox
                              checked={company.sentToClientDp}
                              onChange={() => handleCheckboxChange(company.id, "sentToClientDp", company.sentToClientDp)}
                              disabled={!canEditDp || company.isZeroedDp}
                            />
                        }
                      </td>
                      {/* Obrigações */}
                      <td className="table-cell text-center">
                        {isReadOnly
                          ? <StatusDot checked={company.declarationsCompletedDp} />
                          : <AgentCheckbox
                              checked={company.declarationsCompletedDp}
                              onChange={() => handleCheckboxChange(company.id, "declarationsCompletedDp", company.declarationsCompletedDp)}
                              disabled={!canEditDp || company.hasNoDpObligations}
                            />
                        }
                      </td>
                      {/* Sem Obrigações */}
                      <td className="table-cell text-center">
                        {isReadOnly
                          ? <StatusDot checked={company.hasNoDpObligations} variant="red" />
                          : <AgentCheckbox
                              checked={company.hasNoDpObligations}
                              onChange={() => handleCheckboxChange(company.id, "hasNoDpObligations", company.hasNoDpObligations)}
                              disabled={!canEditDp}
                              variant="red"
                            />
                        }
                      </td>
                      {/* Zerado */}
                      <td className="table-cell text-center">
                        {isReadOnly
                          ? <StatusDot checked={company.isZeroedDp} variant="purple" />
                          : <AgentCheckbox
                              checked={company.isZeroedDp}
                              onChange={() => handleCheckboxChange(company.id, "isZeroedDp", company.isZeroedDp)}
                              disabled={!canEditDp}
                              variant="purple"
                            />
                        }
                      </td>
                      {/* Funcionários */}
                      <td className="table-cell overflow-hidden !px-1">
                        <input
                          type="text"
                          value={tempValues[company.id]?.employeesCount ?? ""}
                          onChange={(e) => handleValueChange(company.id, "employeesCount", e.target.value)}
                          onBlur={() => handleSaveOnBlur(company.id, "employeesCount")}
                          disabled={isReadOnly || !canEditDp || !company.sentToClientDp || !company.declarationsCompletedDp || company.isZeroedDp}
                          className="input-base text-center !py-1 !text-xs !w-full disabled:opacity-40"
                        />
                      </td>
                      {/* Conclusão */}
                      <td className="table-cell text-xs whitespace-nowrap text-gray-500 dark:text-dark-text-secondary">
                        {company.dpCompletedAt ? formatDate(company.dpCompletedAt) : "–"}
                      </td>
                    </>
                  )}

                  {showContabilColumns && (
                    <td className="table-cell border-l border-gray-100 dark:border-dark-border">
                      <input
                        type="number"
                        value={tempValues[company.id]?.accountingMonthsCount ?? ""}
                        onChange={(e) => handleValueChange(company.id, "accountingMonthsCount", e.target.value)}
                        onBlur={() => handleSaveOnBlur(company.id, "accountingMonthsCount")}
                        disabled={isReadOnly || !canEditContabil}
                        className="input-base text-center !py-1 !text-xs disabled:opacity-40"
                      />
                    </td>
                  )}
                </tr>
              ))}

              {filteredCompanies.length === 0 && (
                <tr>
                  <td
                    colSpan={20}
                    className="table-cell text-center py-8 text-gray-400 dark:text-dark-text-secondary"
                  >
                    Nenhuma empresa encontrada para os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AgentCompaniesView;
