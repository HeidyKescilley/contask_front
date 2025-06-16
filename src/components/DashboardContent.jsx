// src/components/FiscalDashboardContent.jsx
"use client";

import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const FiscalDashboardContent = ({ data, viewMode, user }) => {
  if (!data) {
    return (
      <p className="text-center text-gray-800 dark:text-dark-text">
        Nenhum dado disponível para o dashboard.
      </p>
    );
  }

  // Dados para os cards de estatísticas
  const totalCompanies = data.totalCompanies || 0;
  const zeroedCompanies = data.zeroedCompanies || 0;
  const nonZeroedCompanies = totalCompanies - zeroedCompanies; // Calculado
  const completedCompanies = data.completedCompanies || 0;
  const nonCompletedCompanies = totalCompanies - completedCompanies; // Calculado

  // Dados para o gráfico de Concluídas vs Não Concluídas
  const completedVsNonCompletedData = {
    labels: ["Concluídas", "Não Concluídas"],
    datasets: [
      {
        label: "Empresas",
        data: [completedCompanies, nonCompletedCompanies],
        backgroundColor: ["#4CAF50", "#FFC107"], // Verde para concluídas, Amarelo para não concluídas
        borderColor: ["#388E3C", "#FFA000"],
        borderWidth: 1,
      },
    ],
  };

  // Dados para o gráfico de Zeradas vs Não Zeradas
  const zeroedVsNonZeroedData = {
    labels: ["Zeradas", "Não Zeradas"],
    datasets: [
      {
        label: "Empresas",
        data: [zeroedCompanies, nonZeroedCompanies],
        backgroundColor: ["#9C27B0", "#2196F3"], // Roxo para zeradas, Azul para não zeradas
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
          color: "var(--dark-text-secondary)", // Cor da label da legenda
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
              // Verifica se o dataset tem um total para calcular a porcentagem
              const total = context.dataset.data.reduce(
                (sum, val) => sum + val,
                0
              );
              const percentage =
                total > 0
                  ? ((context.parsed / total) * 100).toFixed(2)
                  : (0).toFixed(2);
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
      <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">
        Estatísticas{" "}
        {viewMode === "general" ? "Gerais" : " das Minhas Empresas"}
      </h2>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-100 dark:bg-blue-900 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text">
            Total de Empresas
          </h3>
          <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
            {totalCompanies}
          </p>
        </div>
        <div className="bg-green-100 dark:bg-green-900 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text">
            Empresas Concluídas
          </h3>
          <p className="text-2xl font-bold text-green-800 dark:text-green-200">
            {completedCompanies}
          </p>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text">
            Empresas Não Concluídas
          </h3>
          <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
            {nonCompletedCompanies}
          </p>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text">
            Empresas Zeradas
          </h3>
          <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
            {zeroedCompanies}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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

      {/* Análise por Usuário (somente no modo geral) */}
      {viewMode === "general" && data.usersData && (
        <div className="mt-8 bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text">
            Análise por Usuário
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-dark-card text-black dark:text-dark-text">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
                    Usuário
                  </th>
                  <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
                    Empresas Designadas
                  </th>
                  <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
                    Concluídas
                  </th>
                  <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
                    Não Concluídas
                  </th>
                  <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
                    Zeradas
                  </th>
                  <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
                    Não Zeradas
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.usersData.map((userData) => {
                  const totalAssigned = userData.totalCompaniesAssigned || 0;
                  const completedPercent =
                    totalAssigned > 0
                      ? (
                          (userData.completedCompanies / totalAssigned) *
                          100
                        ).toFixed(2)
                      : (0).toFixed(2);
                  const nonCompletedPercent =
                    totalAssigned > 0
                      ? (
                          (userData.nonCompletedCompanies / totalAssigned) *
                          100
                        ).toFixed(2)
                      : (0).toFixed(2);
                  const zeroedPercent =
                    totalAssigned > 0
                      ? (
                          (userData.zeroedCompanies / totalAssigned) *
                          100
                        ).toFixed(2)
                      : (0).toFixed(2);
                  const nonZeroed = totalAssigned - userData.zeroedCompanies;
                  const nonZeroedPercent =
                    totalAssigned > 0
                      ? ((nonZeroed / totalAssigned) * 100).toFixed(2)
                      : (0).toFixed(2);

                  return (
                    <tr
                      key={userData.id}
                      className="border-b border-gray-400 dark:border-dark-border"
                    >
                      <td className="px-4 py-2 text-left">{userData.name}</td>
                      <td className="px-4 py-2 text-left">{totalAssigned}</td>
                      <td className="px-4 py-2 text-left">
                        {userData.completedCompanies} ({completedPercent}%)
                      </td>
                      <td className="px-4 py-2 text-left">
                        {userData.nonCompletedCompanies} ({nonCompletedPercent}
                        %)
                      </td>
                      <td className="px-4 py-2 text-left">
                        {userData.zeroedCompanies} ({zeroedPercent}%)
                      </td>
                      <td className="px-4 py-2 text-left">
                        {nonZeroed} ({nonZeroedPercent}%)
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

export default FiscalDashboardContent;
