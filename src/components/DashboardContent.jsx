// src/components/DashboardContent.jsx
"use client";

import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { formatDate } from "../utils/utils";
import { FiUsers, FiCheckCircle, FiAlertCircle, FiMinusCircle } from "react-icons/fi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="card flex items-center gap-4">
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">
        {title}
      </p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const DashboardContent = ({ data, viewMode }) => {
  if (!data) {
    return (
      <p className="text-center text-gray-500 dark:text-dark-text-secondary py-12">
        Nenhum dado disponível para o dashboard.
      </p>
    );
  }

  // Dashboard Contábil simplificado
  if (viewMode === "contabil_general") {
    return (
      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-4">
          Análise por Usuário
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-header">Usuário</th>
                <th className="table-header">Total Designado</th>
                <th className="table-header">Total de Meses Contabilizados</th>
              </tr>
            </thead>
            <tbody>
              {data.usersData
                .filter((user) => user.totalCompaniesAssigned > 0)
                .map((userData) => (
                  <tr key={userData.id} className="table-row">
                    <td className="table-cell font-medium">{userData.name}</td>
                    <td className="table-cell">
                      {userData.totalCompaniesAssigned}
                    </td>
                    <td className="table-cell font-semibold">
                      {userData.totalAccountingMonths}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const totalForCards = viewMode.includes("general")
    ? data.absoluteTotalForDept
    : data.totalCompanies;
  const totalForCalculations = data.totalCompanies || 0;
  const zeroedCompanies = data.zeroedCompanies || 0;
  const completedCompanies = data.completedCompanies || 0;
  const nonCompletedCompanies = totalForCalculations - completedCompanies;
  const nonZeroedCompaniesForChart = totalForCalculations - zeroedCompanies;

  const completedVsNonCompletedData = {
    labels: ["Concluídas", "Não Concluídas"],
    datasets: [
      {
        label: "Empresas",
        data: [completedCompanies, nonCompletedCompanies],
        backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(245, 158, 11, 0.8)"],
        borderColor: ["rgb(34, 197, 94)", "rgb(245, 158, 11)"],
        borderWidth: 2,
      },
    ],
  };

  const zeroedVsNonZeroedData = {
    labels: ["Zeradas", "Não Zeradas"],
    datasets: [
      {
        label: "Empresas",
        data: [zeroedCompanies, nonZeroedCompaniesForChart],
        backgroundColor: ["rgba(168, 85, 247, 0.8)", "rgba(59, 130, 246, 0.8)"],
        borderColor: ["rgb(168, 85, 247)", "rgb(59, 130, 246)"],
        borderWidth: 2,
      },
    ],
  };

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: isDark ? "#9ca3af" : "#6b7280",
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 13 },
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#1a1d27" : "#ffffff",
        titleColor: isDark ? "#e4e4e7" : "#1a1a2e",
        bodyColor: isDark ? "#9ca3af" : "#6b7280",
        borderColor: isDark ? "#2d3140" : "#e5e7eb",
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        callbacks: {
          label: function (context) {
            let label = context.label || "";
            if (label) label += ": ";
            if (context.parsed !== null) {
              const total = context.dataset.data.reduce(
                (sum, val) => sum + val,
                0
              );
              const percentage =
                total > 0 ? ((context.parsed / total) * 100).toFixed(1) : "0.0";
              label += context.parsed + " (" + percentage + "%)";
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Empresas"
          value={totalForCards}
          icon={FiUsers}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          title="Concluídas"
          value={completedCompanies}
          icon={FiCheckCircle}
          colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatCard
          title="Não Concluídas"
          value={nonCompletedCompanies}
          icon={FiAlertCircle}
          colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatCard
          title="Zeradas"
          value={zeroedCompanies}
          icon={FiMinusCircle}
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card h-80 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider mb-4">
            Concluídas vs Não Concluídas
          </h3>
          <div className="relative flex-1">
            <Pie data={completedVsNonCompletedData} options={chartOptions} />
          </div>
        </div>
        <div className="card h-80 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider mb-4">
            Zeradas vs Não Zeradas
          </h3>
          <div className="relative flex-1">
            <Pie data={zeroedVsNonZeroedData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Users Table */}
      {viewMode.includes("general") &&
        data.usersData &&
        data.usersData.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">
              Análise por Usuário
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="table-header">Última Atualização</th>
                    <th className="table-header">Usuário</th>
                    <th className="table-header">Total Designado</th>
                    <th className="table-header">Concluídas</th>
                    <th className="table-header">Não Concluídas</th>
                    <th className="table-header">Zeradas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.usersData
                    .filter((user) => user.absoluteTotalAssigned > 0)
                    .map((userData) => {
                      const totalForPercentage =
                        userData.totalCompaniesAssigned || 0;
                      const completedPercent =
                        totalForPercentage > 0
                          ? (
                              (userData.completedCompanies /
                                totalForPercentage) *
                              100
                            ).toFixed(1)
                          : "0.0";
                      const nonCompletedPercent =
                        totalForPercentage > 0
                          ? (
                              (userData.nonCompletedCompanies /
                                totalForPercentage) *
                              100
                            ).toFixed(1)
                          : "0.0";

                      return (
                        <tr key={userData.id} className="table-row">
                          <td className="table-cell text-gray-500 dark:text-dark-text-secondary">
                            {userData.lastCompletionDate
                              ? formatDate(userData.lastCompletionDate)
                              : "N/A"}
                          </td>
                          <td className="table-cell font-medium">
                            {userData.name}
                          </td>
                          <td className="table-cell">
                            {userData.absoluteTotalAssigned}
                          </td>
                          <td className="table-cell">
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {userData.completedCompanies}
                            </span>
                            <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">
                              ({completedPercent}%)
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              {userData.nonCompletedCompanies}
                            </span>
                            <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">
                              ({nonCompletedPercent}%)
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className="text-purple-600 dark:text-purple-400 font-medium">
                              {userData.zeroedCompanies}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
};

export default DashboardContent;
