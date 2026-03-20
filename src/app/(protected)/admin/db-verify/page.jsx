// src/app/(protected)/admin/db-verify/page.jsx
"use client";

import { useState } from "react";
import { Suspense } from "react";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import {
  FiAlertTriangle, FiCheck, FiSearch, FiEdit2,
  FiLoader, FiDownload, FiRefreshCw,
} from "react-icons/fi";

// ── Componente de linha de issue ────────────────────────────────────────────
const IssueRow = ({ issue, onFixed }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(issue.value || "");
  const [saving, setSaving] = useState(false);
  const [fixed, setFixed] = useState(false);

  const handleFix = async () => {
    if (!value.trim()) { toast.error("Informe o novo valor."); return; }
    setSaving(true);
    try {
      await api.patch("/admin/db-verify/fix", {
        companyId: issue.companyId,
        field: issue.field,
        newValue: value.trim(),
      });
      toast.success("Campo corrigido com sucesso!");
      setFixed(true);
      setEditing(false);
      onFixed?.(issue);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao corrigir.");
    } finally {
      setSaving(false);
    }
  };

  if (fixed) {
    return (
      <tr className="table-row opacity-50">
        <td className="table-cell" colSpan={6}>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <FiCheck size={13} /> Corrigido
          </span>
        </td>
      </tr>
    );
  }

  return (
    <tr className="table-row">
      <td className="table-cell text-xs font-mono">{issue.num}</td>
      <td className="table-cell text-xs max-w-[180px] truncate" title={issue.companyName}>
        {issue.companyName}
      </td>
      <td className="table-cell text-xs font-mono text-primary-600 dark:text-primary-400">{issue.field}</td>
      <td className="table-cell text-xs max-w-[220px]">
        <span className="block truncate text-gray-500 dark:text-dark-text-secondary font-mono" title={issue.value}>
          {issue.value || <em className="text-gray-300">vazio</em>}
        </span>
      </td>
      <td className="table-cell text-xs">
        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <FiAlertTriangle size={11} /> {issue.errorType}
        </span>
      </td>
      <td className="table-cell text-xs">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFix(); if (e.key === "Escape") setEditing(false); }}
              className="input-base py-0.5 text-xs w-40"
              autoFocus
            />
            <button
              onClick={handleFix}
              disabled={saving}
              className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-xs hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1"
            >
              {saving ? <span className="h-3 w-3 border border-white border-t-transparent rounded-full animate-spin inline-block" /> : <FiCheck size={11} />}
            </button>
            <button onClick={() => setEditing(false)} className="px-2 py-1 rounded-lg border border-gray-200 dark:border-dark-border text-xs text-gray-500 hover:border-gray-400">
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setValue(issue.value || ""); setEditing(true); }}
            className="flex items-center gap-1 text-xs text-primary-500 hover:underline"
          >
            <FiEdit2 size={11} /> Corrigir
          </button>
        )}
      </td>
    </tr>
  );
};

// ── Página principal ────────────────────────────────────────────────────────
const DbVerifyPageContent = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [fixedIds, setFixedIds] = useState(new Set());

  const runVerify = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.get("/admin/db-verify");
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao executar verificação.");
    } finally {
      setLoading(false);
    }
  };

  const handleFixed = (issue) => {
    setFixedIds((prev) => new Set([...prev, `${issue.companyId}_${issue.field}_${issue.value}`]));
  };

  const issues = result?.issues || [];

  // Grupos de tipos de erro para filtro
  const errorTypes = [...new Set(issues.map((i) => i.field))];

  const filtered = issues.filter((i) => {
    const key = `${i.companyId}_${i.field}_${i.value}`;
    if (fixedIds.has(key)) return false;
    if (filterType !== "all" && i.field !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        i.companyName?.toLowerCase().includes(q) ||
        String(i.num || "").includes(q) ||
        i.value?.toLowerCase().includes(q) ||
        i.errorType?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportToExcel = () => {
    if (!issues.length) return;
    const rows = [
      ["Número", "Empresa", "Campo", "Valor Atual", "Tipo de Erro", "Sugestão"],
      ...issues.map((i) => [i.num, i.companyName, i.field, i.value, i.errorType, i.suggestion]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verificacao-db-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-light-text dark:text-dark-text">
            Verificação do Banco de Dados
          </h1>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
            Encontre e corrija inconsistências nos dados das empresas.
          </p>
        </div>
        <div className="flex gap-2">
          {result && (
            <button onClick={exportToExcel} className="btn-secondary text-xs flex items-center gap-1.5">
              <FiDownload size={13} /> Exportar CSV
            </button>
          )}
          <button
            onClick={runVerify}
            disabled={loading}
            className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <FiLoader size={13} className="animate-spin" />
            ) : (
              <FiRefreshCw size={13} />
            )}
            {loading ? "Verificando…" : result ? "Re-verificar" : "Iniciar Verificação"}
          </button>
        </div>
      </div>

      {/* Resumo */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card py-3">
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Total de empresas</p>
            <p className="text-lg font-bold">{result.total}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Inconsistências</p>
            <p className={`text-lg font-bold ${result.issueCount > 0 ? "text-amber-500" : "text-emerald-500"}`}>
              {result.issueCount}
            </p>
          </div>
          {errorTypes.slice(0, 2).map((type) => (
            <div key={type} className="card py-3">
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary capitalize">{type}</p>
              <p className="text-lg font-bold">{issues.filter((i) => i.field === type).length}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sem issues */}
      {result && result.issueCount === 0 && (
        <div className="card flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
            <FiCheck size={22} className="text-emerald-500" />
          </div>
          <p className="font-medium text-light-text dark:text-dark-text">Nenhuma inconsistência encontrada!</p>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
            Todos os {result.total} registros verificados estão dentro do padrão esperado.
          </p>
        </div>
      )}

      {/* Tabela de issues */}
      {result && result.issueCount > 0 && (
        <div className="card p-0 overflow-hidden">
          {/* Filtros da tabela */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por empresa, valor ou tipo…"
                className="input-base pl-8 py-1.5 text-xs w-full"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-base text-xs py-1.5 w-auto"
            >
              <option value="all">Todos os campos</option>
              {errorTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-header w-16">Nº</th>
                  <th className="table-header" style={{ minWidth: 180 }}>Empresa</th>
                  <th className="table-header w-28">Campo</th>
                  <th className="table-header" style={{ minWidth: 200 }}>Valor Atual</th>
                  <th className="table-header" style={{ minWidth: 200 }}>Inconsistência</th>
                  <th className="table-header w-40">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-cell text-center text-xs text-gray-400 py-8">
                      Nenhuma inconsistência pendente.
                    </td>
                  </tr>
                ) : (
                  filtered.map((issue, idx) => (
                    <IssueRow
                      key={`${issue.companyId}_${issue.field}_${idx}`}
                      issue={issue}
                      onFixed={handleFixed}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado inicial */}
      {!result && !loading && (
        <div className="card flex flex-col items-center justify-center py-14 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
            <FiAlertTriangle size={24} className="text-primary-500" />
          </div>
          <p className="font-medium text-light-text dark:text-dark-text mb-1">
            Verificação de integridade
          </p>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary max-w-sm">
            Clique em &quot;Iniciar Verificação&quot; para analisar CNPJ, e-mails, telefones e duplicatas nos registros de empresas.
          </p>
        </div>
      )}
    </div>
  );
};

const DbVerifyPage = () => (
  <ProtectedRoute allowedRoles={["admin"]}>
    <Suspense>
      <DbVerifyPageContent />
    </Suspense>
  </ProtectedRoute>
);

export default DbVerifyPage;
