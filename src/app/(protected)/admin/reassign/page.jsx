// src/app/(protected)/admin/reassign/page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import { useAuth } from "../../../../hooks/useAuth";
import { FiRefreshCw, FiCheck } from "react-icons/fi";

const DEPT_FIELD = {
  Fiscal: "respFiscalId",
  Pessoal: "respDpId",
  "Contábil": "respContabilId",
};

const DEPARTMENTS = ["Fiscal", "Pessoal", "Contábil"];

const ReassignPage = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [department, setDepartment] = useState("Fiscal");
  const [fromUserId, setFromUserId] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, companiesRes] = await Promise.all([
          api.get("/users"),
          api.get("/company/all"),
        ]);
        setAllUsers(usersRes.data.users || []);
        setAllCompanies(companiesRes.data || []);
      } catch {
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Empresas do responsável selecionado no departamento escolhido
  const filteredCompanies = useMemo(() => {
    if (!fromUserId || !department) return [];
    const field = DEPT_FIELD[department];
    return allCompanies
      .filter((c) => String(c[field]) === String(fromUserId))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [allCompanies, fromUserId, department]);

  // Sincronizar seleção quando a lista muda
  useEffect(() => {
    setSelectedIds(filteredCompanies.map((c) => c.id));
  }, [filteredCompanies]);

  const allSelected = filteredCompanies.length > 0 && selectedIds.length === filteredCompanies.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(filteredCompanies.map((c) => c.id));
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!fromUserId || !toUserId) return toast.warn("Selecione o responsável de origem e destino.");
    if (fromUserId === toUserId) return toast.warn("Origem e destino não podem ser o mesmo usuário.");
    if (selectedIds.length === 0) return toast.warn("Selecione ao menos uma empresa.");

    setSubmitting(true);
    try {
      const res = await api.post("/company/bulk-reassign", {
        fromUserId: Number(fromUserId),
        toUserId: Number(toUserId),
        department,
        companyIds: selectedIds,
      });
      toast.success(res.data.message);
      // Atualizar lista local
      const field = DEPT_FIELD[department];
      setAllCompanies((prev) =>
        prev.map((c) =>
          selectedIds.includes(c.id) ? { ...c, [field]: Number(toUserId) } : c
        )
      );
      setSelectedIds([]);
      setFromUserId("");
      setToUserId("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao realizar troca.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermissions={{ roles: ["admin"] }}>
        <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={{ roles: ["admin"] }}>
      <div className="p-4 max-w-4xl mx-auto">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <FiRefreshCw size={22} className="text-primary-600 dark:text-primary-400" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
              Troca de Responsáveis em Lote
            </h1>
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
              Reatribua empresas de um responsável para outro por departamento
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-base">Departamento</label>
              <select
                className="input-base"
                value={department}
                onChange={(e) => { setDepartment(e.target.value); setFromUserId(""); setToUserId(""); }}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-base">De (origem)</label>
              <select
                className="input-base"
                value={fromUserId}
                onChange={(e) => setFromUserId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {allUsers
                  .filter((u) => u.id !== Number(toUserId))
                  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="label-base">Para (destino)</label>
              <select
                className="input-base"
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {allUsers
                  .filter((u) => u.id !== Number(fromUserId))
                  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de empresas */}
        {fromUserId ? (
          filteredCompanies.length === 0 ? (
            <div className="card text-center py-10 text-gray-400 dark:text-dark-text-secondary text-sm">
              Nenhuma empresa encontrada para este responsável no departamento {department}.
            </div>
          ) : (
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-dark-text-primary">
                  {filteredCompanies.length} empresa{filteredCompanies.length > 1 ? "s" : ""} encontrada{filteredCompanies.length > 1 ? "s" : ""}
                  {selectedIds.length < filteredCompanies.length && (
                    <span className="ml-2 text-primary-600 dark:text-primary-400">
                      ({selectedIds.length} selecionada{selectedIds.length !== 1 ? "s" : ""})
                    </span>
                  )}
                </p>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4"
                  />
                  Selecionar todas
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
                {filteredCompanies.map((company) => (
                  <label
                    key={company.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer select-none transition-all text-sm
                      ${selectedIds.includes(company.id)
                        ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500/50 text-gray-900 dark:text-dark-text-primary"
                        : "border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-gray-300"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(company.id)}
                      onChange={() => toggleOne(company.id)}
                      className="w-4 h-4 flex-shrink-0"
                    />
                    <span className="truncate">{company.name}</span>
                    {company.num && (
                      <span className="ml-auto flex-shrink-0 text-xs text-gray-400">#{company.num}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="card text-center py-10 text-gray-400 dark:text-dark-text-secondary text-sm">
            Selecione o departamento e o responsável de origem para ver as empresas.
          </div>
        )}

        {/* Botão de confirmação */}
        {filteredCompanies.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedIds.length === 0 || !toUserId}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <FiCheck size={15} />
              {submitting
                ? "Transferindo..."
                : `Confirmar Troca (${selectedIds.length} empresa${selectedIds.length !== 1 ? "s" : ""})`}
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default ReassignPage;
