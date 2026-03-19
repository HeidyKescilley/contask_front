"use client";

import React, { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { useCachedFetch } from "../hooks/useCachedFetch";
import { FiFilter, FiRefreshCw, FiExternalLink } from "react-icons/fi";
import CompanyListModal from "./CompanyListModal";
import LoadingSpinner from "./LoadingSpinner";

ChartJS.register(Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Bar = dynamic(() => import("react-chartjs-2").then((m) => m.Bar), {
  ssr: false,
  loading: () => <LoadingSpinner size="md" />,
});

const DEPARTMENTS = ["Fiscal", "Pessoal", "Contábil"];

const COLORS = {
  completed: "#10b981",
  pending:   "#f59e0b",
  disabled:  "#9ca3af",
};

// ── Barra de progresso inline ──────────────────────────────────────────────────
const MiniBar = React.memo(({ completed, total, disabled = 0 }) => {
  const active = total - disabled;
  const pct = active === 0 ? 0 : Math.round((completed / active) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-400" : "bg-gray-200"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-dark-text-secondary tabular-nums">{pct}%</span>
    </div>
  );
});
MiniBar.displayName = "MiniBar";

// ── Tabela de itens (obrigação ou imposto) ─────────────────────────────────────
const ItemTable = React.memo(({ items, onRowClick, hasTaxView }) => (
  <div className="card p-0 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="table-header">Nome</th>
            <th className="table-header text-center">Total</th>
            <th className="table-header text-center">Concluídas</th>
            <th className="table-header text-center">Pendentes</th>
            {!hasTaxView && <th className="table-header text-center">Desabilitadas</th>}
            <th className="table-header text-center">Progresso</th>
            <th className="table-header w-8" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="table-row cursor-pointer hover:bg-primary-50/40 dark:hover:bg-primary-900/10 transition-colors"
              onClick={() => onRowClick(item)}
            >
              <td className="table-cell font-medium text-sm">{item.name}</td>
              <td className="table-cell text-center text-sm">{item.total}</td>
              <td className="table-cell text-center">
                <span className="text-emerald-600 font-semibold">{item.completed}</span>
              </td>
              <td className="table-cell text-center">
                <span className="text-amber-500 font-semibold">{item.pending}</span>
              </td>
              {!hasTaxView && (
                <td className="table-cell text-center text-gray-400">{item.disabled ?? 0}</td>
              )}
              <td className="table-cell">
                <MiniBar completed={item.completed} total={item.total} disabled={item.disabled ?? 0} />
              </td>
              <td className="table-cell">
                <FiExternalLink size={13} className="text-gray-300 group-hover:text-primary-400" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
));
ItemTable.displayName = "ItemTable";

// ── Tabela de usuários ─────────────────────────────────────────────────────────
const UserTable = React.memo(({ users }) => {
  if (!users || users.length === 0) return null;
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-dark-text">Por Responsável</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-header">Responsável</th>
              <th className="table-header text-center">Empresas</th>
              <th className="table-header text-center">Completas</th>
              <th className="table-header text-center">Pendentes</th>
              <th className="table-header">Progresso</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const pct = u.totalCompanies === 0 ? 0 : Math.round((u.completedCompanies / u.totalCompanies) * 100);
              return (
                <tr key={u.id} className="table-row">
                  <td className="table-cell font-medium text-sm">{u.name}</td>
                  <td className="table-cell text-center text-sm">{u.totalCompanies}</td>
                  <td className="table-cell text-center">
                    <span className="text-emerald-600 font-semibold">{u.completedCompanies}</span>
                  </td>
                  <td className="table-cell text-center">
                    <span className="text-amber-500 font-semibold">{u.pendingCompanies}</span>
                  </td>
                  <td className="table-cell">
                    <MiniBar completed={u.completedCompanies} total={u.totalCompanies} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
UserTable.displayName = "UserTable";

// ── Bar chart ─────────────────────────────────────────────────────────────────
const barOptions = {
  responsive: true,
  plugins: { legend: { position: "top" } },
  scales: {
    x: { stacked: true },
    y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } },
  },
};

// ── Filtro de dept + toggle obrigações/impostos ───────────────────────────────
const DeptFilter = React.memo(({ department, onChange, view, onViewChange, period, onRefresh, refreshing, lastUpdated }) => (
  <div className="flex items-center gap-2 flex-wrap">
    <FiFilter size={14} className="text-gray-400" />
    <span className="text-xs text-gray-500 dark:text-dark-text-secondary font-medium mr-1">Setor:</span>
    {DEPARTMENTS.map((d) => (
      <button
        key={d}
        onClick={() => onChange(d)}
        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
          department === d
            ? "bg-primary-500 text-white border-primary-500"
            : "border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-primary-300"
        }`}
      >
        {d}
      </button>
    ))}
    <>
      <span className="text-gray-200 dark:text-gray-700 mx-1">|</span>
      {["obligations", "taxes"].map((v) => (
        <button
          key={v}
          onClick={() => onViewChange(v)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            view === v
              ? "bg-amber-500 text-white border-amber-500"
              : "border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-amber-300"
          }`}
        >
          {v === "obligations" ? "Obrigações" : "Impostos"}
        </button>
      ))}
    </>
    <span className="ml-auto flex items-center gap-1.5">
      {period && <span className="text-xs text-gray-400">Período: {period}</span>}
      {lastUpdated && (
        <span className="text-xs text-gray-400 hidden sm:inline">
          · Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </span>
    <button
      onClick={onRefresh}
      disabled={refreshing}
      className={`btn-ghost !p-1.5 text-gray-400 ml-1 transition-transform ${refreshing ? "animate-spin" : ""}`}
      title="Recarregar dados"
    >
      <FiRefreshCw size={13} />
    </button>
  </div>
));
DeptFilter.displayName = "DeptFilter";

// ── Componente principal ──────────────────────────────────────────────────────
const ObligationsDashboard = () => {
  const [department, setDepartment] = useState("Fiscal");
  const [view, setView] = useState("obligations"); // "obligations" | "taxes"
  const [selectedItem, setSelectedItem] = useState(null); // { type, id, name, period }
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const oblEndpoint = `/obligation/dashboard?department=${encodeURIComponent(department)}`;
  const taxEndpoint = `/tax/dashboard?department=${encodeURIComponent(department)}`;

  const { data, loading: oblLoading, refresh: refreshObl } = useCachedFetch(oblEndpoint);
  const { data: taxData, loading: taxLoading, refresh: refreshTax } = useCachedFetch(taxEndpoint);

  const loading = oblLoading || taxLoading;

  const fetchData = useCallback(() => {
    setRefreshing(true);
    Promise.all([refreshObl(), refreshTax()]).finally(() => {
      setLastUpdated(new Date());
      setRefreshing(false);
    });
  }, [refreshObl, refreshTax]);

  const handleDeptChange = (dept) => {
    setDepartment(dept);
    if (dept !== "Fiscal") setView("obligations");
  };

  const { obligations = [], users: oblUsers = [], period } = data || {};
  const { taxes: taxList = [], users: taxUsers = [], period: taxPeriod } = taxData || {};

  // Memoize computed values (must be before any conditional return)
  const taxTotals = useMemo(() => ({
    completed: taxList.reduce((s, t) => s + t.completed, 0),
    pending: taxList.reduce((s, t) => s + t.pending, 0),
  }), [taxList]);

  const taxBarData = useMemo(() => ({
    labels: taxList.map((t) => t.name),
    datasets: [
      { label: "Apurados",  data: taxList.map((t) => t.completed), backgroundColor: COLORS.completed, borderRadius: 4 },
      { label: "Pendentes", data: taxList.map((t) => t.pending),   backgroundColor: COLORS.pending,   borderRadius: 4 },
    ],
  }), [taxList]);

  const oblTotals = useMemo(() => ({
    completed: obligations.reduce((s, o) => s + o.completed, 0),
    pending: obligations.reduce((s, o) => s + o.pending, 0),
    disabled: obligations.reduce((s, o) => s + o.disabled, 0),
  }), [obligations]);

  const oblBarData = useMemo(() => ({
    labels: obligations.map((o) => o.name.length > 20 ? o.name.slice(0, 18) + "…" : o.name),
    datasets: [
      { label: "Concluídas",    data: obligations.map((o) => o.completed), backgroundColor: COLORS.completed, borderRadius: 4 },
      { label: "Pendentes",     data: obligations.map((o) => o.pending),   backgroundColor: COLORS.pending,   borderRadius: 4 },
      { label: "Desabilitadas", data: obligations.map((o) => o.disabled),  backgroundColor: COLORS.disabled,  borderRadius: 4 },
    ],
  }), [obligations]);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  // ── Vista: Impostos (apenas Fiscal) ─────────────────────────────────────────
  if (view === "taxes") {

    return (
      <div className="space-y-5">
        <DeptFilter department={department} onChange={handleDeptChange} view={view} onViewChange={setView} period={taxPeriod} onRefresh={fetchData} refreshing={refreshing} lastUpdated={lastUpdated} />

        {taxList.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Nenhum imposto cadastrado.</p>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card text-center py-3">
                <p className="text-xs text-gray-400 mb-1">Total de impostos</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-dark-text">{taxList.length}</p>
              </div>
              <div className="card text-center py-3">
                <p className="text-xs text-gray-400 mb-1">Instâncias apuradas</p>
                <p className="text-2xl font-bold text-emerald-600">{taxTotals.completed}</p>
              </div>
              <div className="card text-center py-3">
                <p className="text-xs text-gray-400 mb-1">Instâncias pendentes</p>
                <p className="text-2xl font-bold text-amber-500">{taxTotals.pending}</p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="card">
              <p className="text-sm font-semibold text-gray-700 dark:text-dark-text mb-3">Por Imposto</p>
              <Bar data={taxBarData} options={barOptions} />
            </div>

            {/* Tabela clicável */}
            <p className="text-xs text-gray-400 -mb-2">Clique em uma linha para ver a lista de empresas.</p>
            <ItemTable
              items={taxList}
              hasTaxView={true}
              onRowClick={(item) => setSelectedItem({ type: "tax", id: item.id, name: item.name, period: taxPeriod })}
            />

            {/* Por responsável */}
            <UserTable users={taxUsers} />
          </>
        )}

        {selectedItem && (
          <CompanyListModal
            type={selectedItem.type}
            item={selectedItem}
            period={selectedItem.period}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </div>
    );
  }

  // ── Vista: Obrigações ────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <DeptFilter department={department} onChange={handleDeptChange} view={view} onViewChange={setView} period={period} onRefresh={fetchData} refreshing={refreshing} lastUpdated={lastUpdated} />

      {obligations.length === 0 ? (
        <p className="text-center text-gray-400 dark:text-dark-text-secondary py-10">
          Nenhuma obrigação cadastrada para {department}.
        </p>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card text-center py-3">
              <p className="text-xs text-gray-400 mb-1">Total de obrigações</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-dark-text">{obligations.length}</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-xs text-gray-400 mb-1">Instâncias concluídas</p>
              <p className="text-2xl font-bold text-emerald-600">{oblTotals.completed}</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-xs text-gray-400 mb-1">Instâncias pendentes</p>
              <p className="text-2xl font-bold text-amber-500">{oblTotals.pending}</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-xs text-gray-400 mb-1">Desabilitadas</p>
              <p className="text-2xl font-bold text-gray-400">{oblTotals.disabled}</p>
            </div>
          </div>

          {/* Bar chart */}
          <div className="card">
            <p className="text-sm font-semibold text-gray-700 dark:text-dark-text mb-3">Por Obrigação</p>
            <Bar data={oblBarData} options={barOptions} />
          </div>

          {/* Tabela clicável */}
          <p className="text-xs text-gray-400 -mb-2">Clique em uma linha para ver a lista de empresas.</p>
          <ItemTable
            items={obligations}
            hasTaxView={false}
            onRowClick={(item) => setSelectedItem({ type: "obligation", id: item.id, name: item.name, period })}
          />

          {/* Por responsável */}
          <UserTable users={oblUsers} />
        </>
      )}

      {selectedItem && (
        <CompanyListModal
          type={selectedItem.type}
          item={selectedItem}
          period={selectedItem.period}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default React.memo(ObligationsDashboard);
