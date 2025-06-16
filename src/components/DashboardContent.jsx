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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const DashboardContent = ({ data, viewMode }) => {
  if (!data) {
    return (
      <p className="text-center text-gray-800 dark:text-dark-text">
        Nenhum dado disponível para o dashboard.
      </p>
    );
  }

  // ALTERADO: O total para os cards agora vem de campos diferentes.
  const totalForCards = viewMode.includes("general")
    ? data.absoluteTotalForDept
    : data.totalCompanies;
  const totalForCalculations = data.totalCompanies || 0; // Este é o total que exclui as exceções

  const zeroedCompanies = data.zeroedCompanies || 0;
  const completedCompanies = data.completedCompanies || 0;
  const nonCompletedCompanies = totalForCalculations - completedCompanies; // Lógica mantida

  const nonZeroedCompaniesForChart = totalForCalculations - zeroedCompanies;

  // O resto da lógica dos gráficos permanece igual...

  const completedVsNonCompletedData = {
    labels: ["Concluídas", "Não Concluídas"],
    datasets: [
      {
        label: "Empresas",
        data: [completedCompanies, nonCompletedCompanies],
        backgroundColor: ["#4CAF50", "#FFC107"],
        borderColor: ["#388E3C", "#FFA000"],
        borderWidth: 1,
      },
    ],
  };

  const zeroedVsNonZeroedData = {
    labels: ["Zeradas", "Não Zeradas"],
    datasets: [
      {
        label: "Empresas",
        data: [zeroedCompanies, nonZeroedCompaniesForChart],
        backgroundColor: ["#9C27B0", "#2196F3"],
        borderColor: ["#7B1FA2", "#1976D2"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: document.documentElement.classList.contains("dark")
            ? "#B3B3B3"
            : "#333",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-100 dark:bg-blue-900 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text">
            Total de Empresas
          </h3>
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">
            {/* ALTERADO: Usa o novo total absoluto para o card */}
            {totalForCards}
          </p>
        </div>
        <div className="bg-green-100 dark:bg-green-900 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text">
            Empresas Concluídas
          </h3>
          <p className="text-3xl font-bold text-green-800 dark:text-green-200">
            {completedCompanies}
          </p>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text">
            Empresas Não Concluídas
          </h3>
          <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-200">
            {nonCompletedCompanies}
          </p>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text">
            Empresas Zeradas
          </h3>
          <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">
            {zeroedCompanies}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* ... Gráficos sem alterações ... */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 h-80 flex flex-col justify-center items-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-dark-text">
            Concluídas vs Não Concluídas
          </h3>
          <div className="relative w-full h-full">
            <Pie data={completedVsNonCompletedData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 h-80 flex flex-col justify-center items-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-dark-text">
            Zeradas vs Não Zeradas
          </h3>
          <div className="relative w-full h-full">
            <Pie data={zeroedVsNonZeroedData} options={chartOptions} />
          </div>
        </div>
      </div>

      {viewMode.includes("general") &&
        data.usersData &&
        data.usersData.length > 0 && (
          <div className="mt-8 bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text text-left">
              Análise por Usuário
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-dark-card text-black dark:text-dark-text">
                <thead>
                  <tr className="border-b-2 border-gray-300 dark:border-dark-border">
                    <th className="px-4 py-3 text-left font-semibold">
                      Última Atualização
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Total Designado
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Concluídas
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Não Concluídas
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Zeradas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* ALTERADO: Adicionado .filter() para ocultar usuários com 0 empresas */}
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
                        <tr
                          key={userData.id}
                          className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-3 text-left">
                            {userData.lastCompletionDate
                              ? formatDate(userData.lastCompletionDate)
                              : "N/A"}
                          </td>
                          <td className="px-4 py-3 text-left">
                            {userData.name}
                          </td>
                          <td className="px-4 py-3 text-left">
                            {userData.absoluteTotalAssigned}
                          </td>
                          <td className="px-4 py-3 text-left text-green-600 dark:text-green-400">
                            {userData.completedCompanies} ({completedPercent}%)
                          </td>
                          <td className="px-4 py-3 text-left text-yellow-600 dark:text-yellow-400">
                            {userData.nonCompletedCompanies} (
                            {nonCompletedPercent}%)
                          </td>
                          <td className="px-4 py-3 text-left text-purple-600 dark:text-purple-400">
                            {userData.zeroedCompanies}
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
