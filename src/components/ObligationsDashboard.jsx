"use client";

import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import api from "../utils/api";
import { toast } from "react-toastify";
import { FiFilter, FiRefreshCw, FiExternalLink } from "react-icons/fi";
import CompanyListModal from "./CompanyListModal";

ChartJS.register(Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const DEPARTMENTS = ["Fiscal", "Pessoal", "Contábil"];

const COLORS = {
  completed: "#10b981",
  pending:   "#f59e0b",
  disabled:  "#9ca3af",
};

// ── Barra de progresso inline ──────────────────────────────────────────────────
const MiniBar = ({ completed, total, disabled = 0 }) => {
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
};

// ── Tabela de itens (obrigação ou imposto) ─────────────────────────────────────
const ItemTable = ({ items, onRowClick, hasTaxView }) => (
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
);

// ── Tabela de usuários ─────────────────────────────────────────────────────────
const UserTable = ({ users }) => {
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
};

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
const DeptFilter = ({ department, onChange, view, onViewChange, period, onRefresh }) => (
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
    {period && <span className="ml-auto text-xs text-gray-400">Período: {period}</span>}
    <button onClick={onRefresh} className="btn-ghost !p-1.5 text-gray-400 ml-1" title="Recarregar">
      <FiRefreshCw size={13} />
    </button>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────
const ObligationsDashboard = () => {
  const [department, setDepartment] = useState("Fiscal");
  const [view, setView] = useState("obligations"); // "obligations" | "taxes"
  const [data, setData] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null); // { type, id, name, period }

  const fetchData = async (dept = department) => {
    setLoading(true);
    try {
      const [oblRes, taxRes] = await Promise.all([
        api.get(`/obligation/dashboard?department=${encodeURIComponent(dept)}`),
        api.get(`/tax/dashboard?department=${encodeURIComponent(dept)}`),
      ]);
      setData(oblRes.data);
      setTaxData(taxRes.data);
    } catch {
      toast.error("Erro ao carregar dados.");
      setData(null);
      setTaxData(null);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(department); }, [department]);

  const handleDeptChange = (dept) => {
    setDepartment(dept);
    if (dept !== "Fiscal") setView("obligations");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-10 h-10 rounded-full border-[3px] border-gray-200 dark:border-dark-border border-t-primary-500 animate-spin" />
      </div>
    );
  }

  const { obligations = [], users: oblUsers = [], period } = data || {};
  const { taxes: taxList = [], users: taxUsers = [], period: taxPeriod } = taxData || {};

  // ── Vista: Impostos (apenas Fiscal) ─────────────────────────────────────────
  if (view === "taxes") {
    const taxCompleted = taxList.reduce((s, t) => s + t.completed, 0);
    const taxPending   = taxList.reduce((s, t) => s + t.pending, 0);

    const barData = {
      labels: taxList.map((t) => t.name),
      datasets: [
        { label: "Apurados",  data: taxList.map((t) => t.completed), backgroundColor: COLORS.completed, borderRadius: 4 },
        { label: "Pendentes", data: taxList.map((t) => t.pending),   backgroundColor: COLORS.pending,   borderRadius: 4 },
      ],
    };

    return (
      <div className="space-y-5">
        <DeptFilter department={department} onChange={handleDeptChange} view={view} onViewChange={setView} period={taxPeriod} onRefresh={() => fetchData()} />

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
                <p className="text-2xl font-bold text-emerald-600">{taxCompleted}</p>
              </div>
              <div className="card text-center py-3">
                <p className="text-xs text-gray-400 mb-1">Instâncias pendentes</p>
                <p className="text-2xl font-bold text-amber-500">{taxPending}</p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="card">
              <p className="text-sm font-semibold text-gray-700 dark:text-dark-text mb-3">Por Imposto</p>
              <Bar data={barData} options={barOptions} />
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
  const totalCompleted = obligations.reduce((s, o) => s + o.completed, 0);
  const totalPending   = obligations.reduce((s, o) => s + o.pending, 0);
  const totalDisabled  = obligations.reduce((s, o) => s + o.disabled, 0);

  const barData = {
    labels: obligations.map((o) => o.name.length > 20 ? o.name.slice(0, 18) + "…" : o.name),
    datasets: [
      { label: "Concluídas",    data: obligations.map((o) => o.completed), backgroundColor: COLORS.completed, borderRadius: 4 },
      { label: "Pendentes",     data: obligations.map((o) => o.pending),   backgroundColor: COLORS.pending,   borderRadius: 4 },
      { label: "Desabilitadas", data: obligations.map((o) => o.disabled),  backgroundColor: COLORS.disabled,  borderRadius: 4 },
    ],
  };

  return (
    <div className="space-y-5">
      <DeptFilter department={department} onChange={handleDeptChange} view={view} onViewChange={setView} period={period} onRefresh={() => fetchData()} />

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
              <p className="text-2xl font-bold text-emerald-600">{totalCompleted}</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-xs text-gray-400 mb-1">Instâncias pendentes</p>
              <p className="text-2xl font-bold text-amber-500">{totalPending}</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-xs text-gray-400 mb-1">Desabilitadas</p>
              <p className="text-2xl font-bold text-gray-400">{totalDisabled}</p>
            </div>
          </div>

          {/* Bar chart */}
          <div className="card">
            <p className="text-sm font-semibold text-gray-700 dark:text-dark-text mb-3">Por Obrigação</p>
            <Bar data={barData} options={barOptions} />
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

export default ObligationsDashboard;
