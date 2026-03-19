"use client";

import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useState, useEffect, useCallback } from "react";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import {
  FiPlus, FiEdit2, FiTrash2, FiClipboard,
  FiFilter, FiCheck,
} from "react-icons/fi";
import ObligationFormModal from "../../../../components/ObligationFormModal";
import LoadingSpinner from "../../../../components/LoadingSpinner";

const DEPT_COLORS = {
  Fiscal:   "badge-blue",
  Pessoal:  "badge-green",
  "Contábil": "badge-purple",
};

const PERIODICITY_LABELS = {
  monthly:  "Mensal",
  biweekly: "Quinzenal",
  annual:   "Anual",
};

const ObligationsAdminPage = () => {
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [filterDept, setFilterDept] = useState("all");

  const fetchObligations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/obligation/all");
      setObligations(res.data);
    } catch {
      toast.error("Erro ao carregar obrigações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchObligations(); }, [fetchObligations]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Excluir a obrigação "${name}"? Todos os históricos de status serão removidos.`)) return;
    try {
      await api.delete(`/obligation/${id}`);
      toast.success("Obrigação excluída.");
      fetchObligations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao excluir.");
    }
  };

  const openEdit = (obl) => { setEditTarget(obl); setShowModal(true); };
  const openCreate = () => { setEditTarget(null); setShowModal(true); };

  const displayed = filterDept === "all"
    ? obligations
    : obligations.filter((o) => o.department === filterDept);

  const renderFilters = (filters, label) => {
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

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiClipboard size={18} className="text-primary-500" />
            <h1 className="text-lg font-bold text-gray-800 dark:text-dark-text">
              Obrigações Acessórias
            </h1>
          </div>
          <button onClick={openCreate} className="btn-primary">
            <FiPlus size={15} />
            Nova Obrigação
          </button>
        </div>

        {/* Filtro de departamento */}
        <div className="card flex items-center gap-2 flex-wrap">
          <FiFilter size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-dark-text-secondary font-medium mr-1">Setor:</span>
          {["all", "Fiscal", "Pessoal", "Contábil"].map((dept) => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterDept === dept
                  ? "bg-primary-500 text-white border-primary-500"
                  : "border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-primary-300"
              }`}
            >
              {dept === "all" ? "Todos" : dept}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{displayed.length} obrigação{displayed.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Tabela */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <LoadingSpinner size="lg" />
          ) : displayed.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Nenhuma obrigação cadastrada ainda.{" "}
              <button onClick={openCreate} className="text-primary-500 hover:underline">
                Criar agora
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="table-header">Nome</th>
                    <th className="table-header">Setor</th>
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
                  {displayed.map((obl) => (
                    <tr key={obl.id} className="table-row">
                      <td className="table-cell">
                        <div className="font-medium text-gray-800 dark:text-dark-text text-sm">{obl.name}</div>
                        {obl.description && (
                          <div className="text-xs text-gray-400 dark:text-dark-text-secondary mt-0.5 truncate max-w-[200px]">
                            {obl.description}
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={DEPT_COLORS[obl.department] || "badge-gray"}>
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
                        {obl.sendWhenZeroed ? (
                          <FiCheck size={14} className="text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                      <td className="table-cell">{renderFilters(obl.applicableRegimes)}</td>
                      <td className="table-cell">{renderFilters(obl.applicableClassificacoes)}</td>
                      <td className="table-cell">{renderFilters(obl.applicableUFs)}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(obl)}
                            className="btn-ghost !p-1.5 text-gray-500"
                            title="Editar"
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(obl.id, obl.name)}
                            className="btn-ghost !p-1.5 text-red-400 hover:text-red-600"
                            title="Excluir"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ObligationFormModal
          editData={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={fetchObligations}
        />
      )}
    </ProtectedRoute>
  );
};

export default ObligationsAdminPage;
