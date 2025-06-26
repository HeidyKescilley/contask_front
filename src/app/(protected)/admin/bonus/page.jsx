// D:\projetos\contask_v2\contask_front\src\app\(protected)\admin\bonus\page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import { FiRefreshCw, FiSave, FiInfo, FiDollarSign } from "react-icons/fi";
import Loading from "../../../../components/Loading";

const BonusPage = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState("dp"); // 'dp', 'fiscal', 'geral'
  const [factors, setFactors] = useState({
    dp_fator_1: "0.00",
    dp_fator_2: "0.00",
    fiscal_valor_base_c: "0.00",
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedDpUserId, setSelectedDpUserId] = useState("");
  const [selectedFiscalUserId, setSelectedFiscalUserId] = useState("");

  // --- DATA FETCHING ---
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
      toast.error("Erro ao carregar dados da página de bônus.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLERS ---
  const handleFactorChange = (e) => {
    const { name, value } = e.target;
    setFactors((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveFactors = async () => {
    try {
      await api.post("/bonus/factors", factors);
      toast.success("Fatores de cálculo salvos com sucesso!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar fatores.");
    }
  };

  const handleRecalculate = async () => {
    if (!confirm("Tem certeza que deseja recalcular todos os bônus? Os dados atuais serão substituídos.")) {
      return;
    }
    setCalculating(true);
    try {
      const res = await api.post("/bonus/calculate");
      toast.success(res.data.message);
      await fetchData(); // Recarrega todos os dados após o cálculo
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao recalcular bônus.");
    } finally {
      setCalculating(false);
    }
  };

  // --- MEMOIZED DATA FOR VIEWS ---
  const dpUsers = useMemo(() => results.filter((r) => r.department === "Pessoal"), [results]);
  const fiscalUsers = useMemo(() => results.filter((r) => r.department === "Fiscal"), [results]);

  const selectedDpResult = useMemo(() => dpUsers.find((u) => u.userId == selectedDpUserId), [dpUsers, selectedDpUserId]);
  const selectedFiscalResult = useMemo(() => fiscalUsers.find((u) => u.userId == selectedFiscalUserId), [fiscalUsers, selectedFiscalUserId]);
  
  const formatCurrency = (value) => {
      const number = parseFloat(value) || 0;
      return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  if (loading) {
    return <Loading />;
  }

  // --- RENDER ---
  return (
    <ProtectedRoute requiredPermissions={{ roles: ["admin"] }}>
      <div className="w-full px-8 py-8 text-gray-800 dark:text-dark-text">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Cálculo de Bônus</h1>
          <button
            onClick={handleRecalculate}
            disabled={calculating}
            className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {calculating ? (
              <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            ) : (
              <FiRefreshCw />
            )}
            {calculating ? "Calculando..." : "Recalcular Bônus"}
          </button>
        </div>

        {/* FACTOR EDITOR */}
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiDollarSign /> Fatores de Cálculo</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            {/* DP Factors */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4 border-r pr-6 dark:border-gray-600">
                <div>
                    <label htmlFor="dp_fator_1" className="block text-sm font-medium mb-1">DP Fator 1 (Empresas ≤ 1 func.)</label>
                    <input type="number" step="0.01" name="dp_fator_1" id="dp_fator_1" value={factors.dp_fator_1} onChange={handleFactorChange} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <div>
                    <label htmlFor="dp_fator_2" className="block text-sm font-medium mb-1">DP Fator 2 (p/ func. adicional)</label>
                    <input type="number" step="0.01" name="dp_fator_2" id="dp_fator_2" value={factors.dp_fator_2} onChange={handleFactorChange} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                </div>
            </div>
            {/* Fiscal Factor */}
            <div>
              <label htmlFor="fiscal_valor_base_c" className="block text-sm font-medium mb-1">Fiscal: Valor do Bônus Básico (C)</label>
              <input type="number" step="0.01" name="fiscal_valor_base_c" id="fiscal_valor_base_c" value={factors.fiscal_valor_base_c} onChange={handleFactorChange} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            {/* Save Button */}
            <button onClick={handleSaveFactors} className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-green text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors">
              <FiSave /> Salvar Fatores
            </button>
          </div>
        </div>

        {/* TABS & CONTENT */}
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
            <nav className="flex space-x-4">
              {['dp', 'fiscal', 'geral'].map((tabName) => (
                <button key={tabName} onClick={() => setView(tabName)} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${view === tabName ? 'border-b-2 border-accent-blue text-accent-blue' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                  {tabName === 'dp' && 'Departamento Pessoal'}
                  {tabName === 'fiscal' && 'Departamento Fiscal'}
                  {tabName === 'geral' && 'Visão Geral'}
                </button>
              ))}
            </nav>
          </div>

          {/* DP VIEW */}
          {view === 'dp' && (
            <div>
              <label className="block text-sm font-medium mb-2">Selecione um funcionário do DP:</label>
              <select value={selectedDpUserId} onChange={(e) => setSelectedDpUserId(e.target.value)} className="w-full md:w-1/3 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 mb-4">
                <option value="">-- Selecione --</option>
                {dpUsers.map(user => <option key={user.userId} value={user.userId}>{user.userName}</option>)}
              </select>
              {selectedDpResult && (
                <div className="overflow-x-auto">
                    <h3 className="text-lg font-bold mb-2">Detalhes para: {selectedDpResult.userName}</h3>
                    <table className="min-w-full">
                        <thead><tr className="border-b dark:border-gray-600"><th className="text-left p-2">Razão Social</th><th className="text-center p-2">Qtd. Funcionários</th><th className="text-right p-2">Valor Bonificação</th></tr></thead>
                        <tbody>{selectedDpResult.details.map((detail, i) => <tr key={i} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"><td className="p-2">{detail.companyName}</td><td className="text-center p-2">{detail.employeesCount}</td><td className="text-right p-2">{formatCurrency(detail.bonus)}</td></tr>)}</tbody>
                        <tfoot><tr className="font-bold border-t-2 dark:border-gray-500"><td colSpan="2" className="text-right p-2">Total:</td><td className="text-right p-2">{formatCurrency(selectedDpResult.totalBonus)}</td></tr></tfoot>
                    </table>
                </div>
              )}
            </div>
          )}

          {/* FISCAL VIEW */}
          {view === 'fiscal' && (
            <div>
              <label className="block text-sm font-medium mb-2">Selecione um funcionário do Fiscal:</label>
              <select value={selectedFiscalUserId} onChange={(e) => setSelectedFiscalUserId(e.target.value)} className="w-full md:w-1/3 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 mb-4">
                <option value="">-- Selecione --</option>
                {fiscalUsers.map(user => <option key={user.userId} value={user.userId}>{user.userName}</option>)}
              </select>
              {selectedFiscalResult && (
                 <div className="overflow-x-auto">
                    <h3 className="text-lg font-bold mb-2">Detalhes para: {selectedFiscalResult.userName}</h3>
                    <table className="min-w-full">
                        <thead><tr className="border-b dark:border-gray-600"><th className="text-left p-2">Razão Social</th><th className="text-center p-2">Nota Bônus</th><th className="text-right p-2">Valor Bonificação</th></tr></thead>
                        <tbody>{selectedFiscalResult.details.map((detail, i) => <tr key={i} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"><td className="p-2">{detail.companyName}</td><td className="text-center p-2">{detail.bonusValue}</td><td className="text-right p-2">{formatCurrency(detail.bonus)}</td></tr>)}</tbody>
                        <tfoot><tr className="font-bold border-t-2 dark:border-gray-500"><td colSpan="2" className="text-right p-2">Total:</td><td className="text-right p-2">{formatCurrency(selectedFiscalResult.totalBonus)}</td></tr></tfoot>
                    </table>
                </div>
              )}
            </div>
          )}

          {/* GENERAL VIEW */}
          {view === 'geral' && (
            <div className="overflow-x-auto">
                <h3 className="text-lg font-bold mb-2">Resumo Geral de Bônus</h3>
                <table className="min-w-full">
                    <thead><tr className="border-b dark:border-gray-600"><th className="text-left p-2">Funcionário</th><th className="text-left p-2">Departamento</th><th className="text-right p-2">Bonificação Total</th></tr></thead>
                    <tbody>
                        {results.map(result => (
                            <tr key={result.userId} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="p-2">{result.userName}</td>
                                <td className="p-2">{result.department}</td>
                                <td className="text-right p-2 font-semibold">{formatCurrency(result.totalBonus)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default BonusPage;