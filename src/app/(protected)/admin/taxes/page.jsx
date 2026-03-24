"use client";

import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import {
  FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiClipboard,
  FiCheck, FiLayers, FiArrowUp, FiArrowDown,
} from "react-icons/fi";
import TaxFormModal from "../../../../components/TaxFormModal";
import ObligationFormModal from "../../../../components/ObligationFormModal";
import AdminBatchModal from "../../../../components/AdminBatchModal";
import LoadingSpinner from "../../../../components/LoadingSpinner";

const DEPT_FILTER = ["Todos", "Fiscal", "Pessoal", "Contábil"];

const DEPT_BADGE = {
  Fiscal:    "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  Pessoal:   "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  "Contábil": "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
};

const PERIODICITY_LABELS = { monthly: "Mensal", biweekly: "Quinzenal", annual: "Anual" };

const renderFilters = (filters) => {
  if (!filters || filters.length === 0) return <span className="text-gray-400 text-xs">Todos</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {filters.map((f) => (
        <span key={f} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary">
          {f}
        </span>
      ))}
    </div>
  );
};

const SortIcon = ({ field, sortField, sortDir }) => {
  if (field !== sortField) return <FiArrowUp size={11} className="opacity-30 ml-1" />;
  return sortDir === "asc"
    ? <FiArrowUp size={11} className="ml-1 text-primary-500" />
    : <FiArrowDown size={11} className="ml-1 text-primary-500" />;
};

const TaxesObligationsAdminPage = () => {
  const [view, setView] = useState("taxes"); // "taxes" | "obligations"
  const [taxes, setTaxes] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Sort state — taxes
  const [taxSortField, setTaxSortField]   = useState("name");
  const [taxSortDir, setTaxSortDir]       = useState("asc");
  // Sort state — obligations
  const [oblSortField, setOblSortField]   = useState("name");
  const [oblSortDir, setOblSortDir]       = useState("asc");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [taxRes, oblRes] = await Promise.all([
        api.get("/tax/all"),
        api.get("/obligation/all"),
      ]);
      setTaxes(taxRes.data || []);
      setObligations(oblRes.data || []);
    } catch {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDeleteTax = async (id, name) => {
    if (!confirm(`Excluir o imposto "${name}"? Todos os históricos de status serão removidos.`)) return;
    try {
      await api.delete(`/tax/${id}`);
      toast.success("Imposto excluído.");
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || "Erro ao excluir."); }
  };

  const handleDeleteObligation = async (id, name) => {
    if (!confirm(`Excluir a obrigação "${name}"? Todos os históricos de status serão removidos.`)) return;
    try {
      await api.delete(`/obligation/${id}`);
      toast.success("Obrigação excluída.");
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || "Erro ao excluir."); }
  };

  const openCreate = () => { setEditTarget(null); setShowModal(true); };
  const openEdit   = (item) => { setEditTarget(item); setShowModal(true); };

  const handleSort = (field, current, setField, setDir) => {
    setDir(prev => current === field && prev === "asc" ? "desc" : "asc");
    setField(field);
  };

  const filteredTaxes = useMemo(() => {
    const base = deptFilter === "Todos" ? taxes : taxes.filter((t) => t.department === deptFilter);
    return [...base].sort((a, b) => {
      const va = String(a[taxSortField] ?? ""); const vb = String(b[taxSortField] ?? "");
      const cmp = va.localeCompare(vb, "pt-BR");
      return taxSortDir === "asc" ? cmp : -cmp;
    });
  }, [taxes, deptFilter, taxSortField, taxSortDir]);

  const filteredObligations = useMemo(() => {
    const base = deptFilter === "Todos" ? obligations : obligations.filter((o) => o.department === deptFilter);
    return [...base].sort((a, b) => {
      const va = String(a[oblSortField] ?? ""); const vb = String(b[oblSortField] ?? "");
      const cmp = va.localeCompare(vb, "pt-BR");
      return oblSortDir === "asc" ? cmp : -cmp;
    });
  }, [obligations, deptFilter, oblSortField, oblSortDir]);

  const thClass = "table-header cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-surface select-none";
  const thInner = (label, field, sortField, sortDir) => (
    <span className="inline-flex items-center">
      {label}
      <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </span>
  );

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {view === "taxes"
              ? <FiDollarSign size={18} className="text-primary-500" />
              : <FiClipboard size={18} className="text-primary-500" />
            }
            <h1 className="text-lg font-bold text-gray-800 dark:text-dark-text">
              Impostos e Obrigações
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle de view */}
            <div className="flex border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
              <button
                onClick={() => setView("taxes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === "taxes"
                    ? "bg-primary-500 text-white"
                    : "bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50"
                }`}
              >
                <FiDollarSign size={13} /> Impostos
              </button>
              <button
                onClick={() => setView("obligations")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-l border-gray-200 dark:border-dark-border transition-colors ${
                  view === "obligations"
                    ? "bg-primary-500 text-white"
                    : "bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50"
                }`}
              >
                <FiClipboard size={13} /> Obrigações
              </button>
            </div>
            <button onClick={() => setShowBatchModal(true)} className="btn-ghost flex items-center gap-1.5 text-xs">
              <FiLayers size={13} /> Gerenciar em Lote
            </button>
            <button onClick={openCreate} className="btn-primary">
              <FiPlus size={15} />
              {view === "taxes" ? "Novo Imposto" : "Nova Obrigação"}
            </button>
          </div>
        </div>

        {/* Filtro de departamento */}
        <div className="card flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-dark-text-secondary font-medium mr-1">Setor:</span>
          {DEPT_FILTER.map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                deptFilter === d
                  ? "bg-primary-500 text-white border-primary-500"
                  : "border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-primary-300"
              }`}
            >
              {d}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">
            {view === "taxes"
              ? `${filteredTaxes.length} imposto${filteredTaxes.length !== 1 ? "s" : ""}`
              : `${filteredObligations.length} obrigação${filteredObligations.length !== 1 ? "s" : ""}`
            }
          </span>
        </div>

        {/* Tabela de Impostos */}
        {view === "taxes" && (
          <div className="card p-0 overflow-hidden">
            {loading ? (
              <LoadingSpinner size="lg" />
            ) : filteredTaxes.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Nenhum imposto cadastrado ainda.{" "}
                <button onClick={openCreate} className="text-primary-500 hover:underline">Criar agora</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className={thClass} onClick={() => handleSort("name", taxSortField, setTaxSortField, setTaxSortDir)}>
                        {thInner("Nome", "name", taxSortField, taxSortDir)}
                      </th>
                      <th className={thClass} onClick={() => handleSort("department", taxSortField, setTaxSortField, setTaxSortDir)}>
                        {thInner("Departamento", "department", taxSortField, taxSortDir)}
                      </th>
                      <th className="table-header">Regimes</th>
                      <th className="table-header">Classificações</th>
                      <th className="table-header">UFs</th>
                      <th className="table-header" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTaxes.map((tax) => (
                      <tr key={tax.id} className="table-row">
                        <td className="table-cell">
                          <span className="font-medium text-gray-800 dark:text-dark-text text-sm">{tax.name}</span>
                        </td>
                        <td className="table-cell">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${DEPT_BADGE[tax.department] || "bg-gray-100 text-gray-600"}`}>
                            {tax.department}
                          </span>
                        </td>
                        <td className="table-cell">{renderFilters(tax.applicableRegimes)}</td>
                        <td className="table-cell">{renderFilters(tax.applicableClassificacoes)}</td>
                        <td className="table-cell">{renderFilters(tax.applicableUFs)}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(tax)} className="btn-ghost !p-1.5 text-gray-500" title="Editar"><FiEdit2 size={13} /></button>
                            <button onClick={() => handleDeleteTax(tax.id, tax.name)} className="btn-ghost !p-1.5 text-red-400 hover:text-red-600" title="Excluir"><FiTrash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tabela de Obrigações */}
        {view === "obligations" && (
          <div className="card p-0 overflow-hidden">
            {loading ? (
              <LoadingSpinner size="lg" />
            ) : filteredObligations.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Nenhuma obrigação cadastrada ainda.{" "}
                <button onClick={openCreate} className="text-primary-500 hover:underline">Criar agora</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className={thClass} onClick={() => handleSort("name", oblSortField, setOblSortField, setOblSortDir)}>
                        {thInner("Nome", "name", oblSortField, oblSortDir)}
                      </th>
                      <th className={thClass} onClick={() => handleSort("department", oblSortField, setOblSortField, setOblSortDir)}>
                        {thInner("Setor", "department", oblSortField, oblSortDir)}
                      </th>
                      <th className="table-header">Periodicidade</th>
                      <th className="table-header">Prazo</th>
                      <th className="table-header text-center">Envia Zerado</th>
                      <th className="table-header">Regimes</th>
                      <th className="table-header">Classificações</th>
                      <th className="table-header">UFs</th>
                      <th className="table-header" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredObligations.map((obl) => (
                      <tr key={obl.id} className="table-row">
                        <td className="table-cell">
                          <div className="font-medium text-gray-800 dark:text-dark-text text-sm">{obl.name}</div>
                          {obl.description && (
                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{obl.description}</div>
                          )}
                        </td>
                        <td className="table-cell">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${DEPT_BADGE[obl.department] || "bg-gray-100 text-gray-600"}`}>
                            {obl.department}
                          </span>
                        </td>
                        <td className="table-cell text-sm">{PERIODICITY_LABELS[obl.periodicity]}</td>
                        <td className="table-cell text-sm whitespace-nowrap">
                          {obl.deadlineType === "last_business_day" ? (
                            <span className="text-gray-600 dark:text-dark-text-secondary text-xs">Último dia útil</span>
                          ) : (
                            <>
                              {obl.deadline}{" "}
                              <span className="text-gray-400 text-xs">
                                {obl.deadlineType === "calendar_day" ? "do mês" : "dias úteis"}
                              </span>
                            </>
                          )}
                          {obl.periodicity === "annual" && obl.deadlineMonth && (
                            <span className="text-gray-400 text-xs ml-1">
                              ({["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][obl.deadlineMonth - 1]})
                            </span>
                          )}
                        </td>
                        <td className="table-cell text-center">
                          {obl.sendWhenZeroed
                            ? <FiCheck size={14} className="text-emerald-500 mx-auto" />
                            : <span className="text-gray-300 dark:text-gray-600">—</span>
                          }
                        </td>
                        <td className="table-cell">{renderFilters(obl.applicableRegimes)}</td>
                        <td className="table-cell">{renderFilters(obl.applicableClassificacoes)}</td>
                        <td className="table-cell">{renderFilters(obl.applicableUFs)}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(obl)} className="btn-ghost !p-1.5 text-gray-500" title="Editar"><FiEdit2 size={13} /></button>
                            <button onClick={() => handleDeleteObligation(obl.id, obl.name)} className="btn-ghost !p-1.5 text-red-400 hover:text-red-600" title="Excluir"><FiTrash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modais */}
      {showModal && view === "taxes" && (
        <TaxFormModal
          editData={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={fetchAll}
        />
      )}
      {showModal && view === "obligations" && (
        <ObligationFormModal
          editData={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={fetchAll}
        />
      )}
      {showBatchModal && (
        <AdminBatchModal
          onClose={() => setShowBatchModal(false)}
          onSuccess={fetchAll}
          initialType={view === "taxes" ? "tax" : "obligation"}
        />
      )}
    </ProtectedRoute>
  );
};

export default TaxesObligationsAdminPage;
