"use client";

import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useState, useEffect, useCallback } from "react";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign } from "react-icons/fi";
import TaxFormModal from "../../../../components/TaxFormModal";
import LoadingSpinner from "../../../../components/LoadingSpinner";

const DEPT_FILTER = ["Todos", "Fiscal", "Pessoal", "Contábil"];

const DEPT_BADGE = {
  Fiscal:   "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  Pessoal:  "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  "Contábil": "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
};

const TaxesAdminPage = () => {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deptFilter, setDeptFilter] = useState("Todos");

  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/tax/all");
      setTaxes(res.data);
    } catch {
      toast.error("Erro ao carregar impostos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTaxes(); }, [fetchTaxes]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Excluir o imposto "${name}"? Todos os históricos de status serão removidos.`)) return;
    try {
      await api.delete(`/tax/${id}`);
      toast.success("Imposto excluído.");
      fetchTaxes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao excluir.");
    }
  };

  const openEdit = (tax) => { setEditTarget(tax); setShowModal(true); };
  const openCreate = () => { setEditTarget(null); setShowModal(true); };

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

  const filteredTaxes = deptFilter === "Todos" ? taxes : taxes.filter((t) => t.department === deptFilter);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FiDollarSign size={18} className="text-primary-500" />
            <h1 className="text-lg font-bold text-gray-800 dark:text-dark-text">
              Impostos
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {DEPT_FILTER.map((d) => (
              <button
                key={d}
                onClick={() => setDeptFilter(d)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  deptFilter === d
                    ? "bg-primary-500 text-white border-primary-500"
                    : "border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary"
                }`}
              >
                {d}
              </button>
            ))}
            <button onClick={openCreate} className="btn-primary ml-2">
              <FiPlus size={15} />
              Novo Imposto
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="card">
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
            Impostos são aplicados automaticamente a empresas com base nos filtros definidos (regime, classificação e UF).
            Quando marcado no acompanhamento mensal, indica que aquele imposto foi apurado e enviado ao cliente.
          </p>
        </div>

        {/* Tabela */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <LoadingSpinner size="lg" />
          ) : filteredTaxes.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Nenhum imposto cadastrado ainda.{" "}
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
                    <th className="table-header">Departamento</th>
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
                          <button
                            onClick={() => openEdit(tax)}
                            className="btn-ghost !p-1.5 text-gray-500"
                            title="Editar"
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(tax.id, tax.name)}
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
        <TaxFormModal
          editData={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={fetchTaxes}
        />
      )}
    </ProtectedRoute>
  );
};

export default TaxesAdminPage;
