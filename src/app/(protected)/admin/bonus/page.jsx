// src/app/(protected)/admin/bonus/page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import {
  FiRefreshCw,
  FiSave,
  FiDollarSign,
  FiTrash2,
} from "react-icons/fi";
import Loading from "../../../../components/Loading";

const BonusPage = () => {
  const [view, setView] = useState("dp");
  const [factors, setFactors] = useState({
    dp_fator_1: "0.00",
    dp_fator_2: "0.00",
    fiscal_valor_base_c: "0.00",
    contabil_valor_mes: "0.00",
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [selectedDpUserId, setSelectedDpUserId] = useState("");
  const [selectedFiscalUserId, setSelectedFiscalUserId] = useState("");
  const [selectedContabilUserId, setSelectedContabilUserId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [factorsRes, resultsRes] = await Promise.all([
        api.get("/bonus/factors"),
        api.get("/bonus/results"),
      ]);
      setFactors(factorsRes.data);
      setResults(resultsRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados da pagina de bonus.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFactorChange = (e) => {
    const { name, value } = e.target;
    setFactors((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveFactors = async () => {
    try {
      await api.post("/bonus/factors", factors);
      toast.success("Fatores de calculo salvos com sucesso!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar fatores.");
    }
  };

  const handleRecalculate = async () => {
    if (
      !confirm(
        "Tem certeza que deseja recalcular todos os bonus? Os dados atuais serao substituidos."
      )
    )
      return;
    setCalculating(true);
    try {
      const res = await api.post("/bonus/calculate");
      toast.success(res.data.message);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao recalcular bonus.");
    } finally {
      setCalculating(false);
    }
  };

  const handleResetMonth = async () => {
    if (
      !confirm(
        "ATENCAO: Esta acao e irreversivel!\n\nTem certeza que deseja zerar todos os dados de progresso mensal de TODOS os agentes?"
      )
    )
      return;
    setResetting(true);
    try {
      const res = await api.post("/admin/reset-agent-data");
      toast.success(res.data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao zerar os dados do mes."
      );
    } finally {
      setResetting(false);
    }
  };

  const dpUsers = useMemo(
    () => results.filter((r) => r.department === "Pessoal"),
    [results]
  );
  const fiscalUsers = useMemo(
    () => results.filter((r) => r.department === "Fiscal"),
    [results]
  );
  const contabilUsers = useMemo(
    () => results.filter((r) => r.department === "Contabil"),
    [results]
  );

  const selectedDpResult = useMemo(
    () => dpUsers.find((u) => u.userId == selectedDpUserId),
    [dpUsers, selectedDpUserId]
  );
  const selectedFiscalResult = useMemo(
    () => fiscalUsers.find((u) => u.userId == selectedFiscalUserId),
    [fiscalUsers, selectedFiscalUserId]
  );
  const selectedContabilResult = useMemo(
    () => contabilUsers.find((u) => u.userId == selectedContabilUserId),
    [contabilUsers, selectedContabilUserId]
  );

  const formatCurrency = (value) => {
    const number = parseFloat(value) || 0;
    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (loading) return <Loading />;

  const tabs = [
    { key: "dp", label: "Dept. Pessoal" },
    { key: "fiscal", label: "Dept. Fiscal" },
    { key: "contabil", label: "Dept. Contabil" },
    { key: "geral", label: "Visao Geral" },
  ];

  const renderDepartmentView = (
    departmentUsers,
    selectedUserId,
    setSelectedUserId,
    selectedResult,
    detailColumns
  ) => (
    <div>
      <label className="label-base">Selecione um funcionario:</label>
      <select
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
        className="input-base !w-auto min-w-[250px] mb-4"
      >
        <option value="">-- Selecione --</option>
        {departmentUsers.map((user) => (
          <option key={user.userId} value={user.userId}>
            {user.userName}
          </option>
        ))}
      </select>
      {selectedResult && (
        <div className="card p-0 overflow-hidden mt-3">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-dark-border">
            <h3 className="text-sm font-semibold">
              Detalhes: {selectedResult.userName}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-header">Razao Social</th>
                  {detailColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`table-header ${col.align || ""}`}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="table-header text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {selectedResult.details.map((detail, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell">{detail.companyName}</td>
                    {detailColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`table-cell ${col.align || ""}`}
                      >
                        {detail[col.key]}
                      </td>
                    ))}
                    <td className="table-cell text-right">
                      {formatCurrency(detail.bonus)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2 border-gray-200 dark:border-dark-border">
                  <td
                    colSpan={detailColumns.length + 1}
                    className="table-cell text-right"
                  >
                    Total:
                  </td>
                  <td className="table-cell text-right">
                    {formatCurrency(selectedResult.totalBonus)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ProtectedRoute requiredPermissions={{ roles: ["admin"] }}>
      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-5">
        <button
          onClick={handleResetMonth}
          disabled={resetting || calculating}
          className="btn-danger"
        >
          {resetting ? (
            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
          ) : (
            <FiTrash2 size={16} />
          )}
          {resetting ? "Zerando..." : "Zerar Mes"}
        </button>
        <button
          onClick={handleRecalculate}
          disabled={calculating}
          className="btn-primary"
        >
          {calculating ? (
            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
          ) : (
            <FiRefreshCw size={16} />
          )}
          {calculating ? "Calculando..." : "Recalcular Bonus"}
        </button>
      </div>

      {/* Factors */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-4">
          <FiDollarSign size={18} className="text-primary-500" />
          <h2 className="text-base font-semibold">Fatores de Calculo</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label htmlFor="dp_fator_1" className="label-base">
              DP Fator 1
            </label>
            <input
              type="number"
              step="0.01"
              name="dp_fator_1"
              id="dp_fator_1"
              value={factors.dp_fator_1}
              onChange={handleFactorChange}
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="dp_fator_2" className="label-base">
              DP Fator 2
            </label>
            <input
              type="number"
              step="0.01"
              name="dp_fator_2"
              id="dp_fator_2"
              value={factors.dp_fator_2}
              onChange={handleFactorChange}
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="fiscal_valor_base_c" className="label-base">
              Fiscal Valor Base
            </label>
            <input
              type="number"
              step="0.01"
              name="fiscal_valor_base_c"
              id="fiscal_valor_base_c"
              value={factors.fiscal_valor_base_c}
              onChange={handleFactorChange}
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="contabil_valor_mes" className="label-base">
              Contabil Valor/Mes
            </label>
            <input
              type="number"
              step="0.01"
              name="contabil_valor_mes"
              id="contabil_valor_mes"
              value={factors.contabil_valor_mes}
              onChange={handleFactorChange}
              className="input-base"
            />
          </div>
          <button onClick={handleSaveFactors} className="btn-success">
            <FiSave size={16} /> Salvar
          </button>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="card">
        <div className="flex gap-1 border-b border-gray-200 dark:border-dark-border mb-5 -mt-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                ${
                  view === tab.key
                    ? "border-b-2 border-primary-500 text-primary-500"
                    : "text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {view === "dp" &&
          renderDepartmentView(dpUsers, selectedDpUserId, setSelectedDpUserId, selectedDpResult, [
            { key: "employeesCount", label: "Funcionarios", align: "text-center" },
          ])}

        {view === "fiscal" &&
          renderDepartmentView(
            fiscalUsers,
            selectedFiscalUserId,
            setSelectedFiscalUserId,
            selectedFiscalResult,
            [{ key: "bonusValue", label: "Nota Bonus", align: "text-center" }]
          )}

        {view === "contabil" &&
          renderDepartmentView(
            contabilUsers,
            selectedContabilUserId,
            setSelectedContabilUserId,
            selectedContabilResult,
            [
              {
                key: "accountingMonthsCount",
                label: "Meses",
                align: "text-center",
              },
            ]
          )}

        {view === "geral" && (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="table-header">Funcionario</th>
                    <th className="table-header">Departamento</th>
                    <th className="table-header text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.userId} className="table-row">
                      <td className="table-cell font-medium">
                        {result.userName}
                      </td>
                      <td className="table-cell">{result.department}</td>
                      <td className="table-cell text-right font-semibold">
                        {formatCurrency(result.totalBonus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default BonusPage;
