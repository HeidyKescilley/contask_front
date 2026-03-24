"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import api from "../../../../utils/api";
import { useAuth } from "../../../../hooks/useAuth";
import { FiChevronDown, FiChevronUp, FiAward, FiUsers } from "react-icons/fi";

const ALLOWED_IDS = [1, 4];

const ActivityMonitorPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !ALLOWED_IDS.includes(user.id)) {
      router.replace("/home");
      return;
    }
    api
      .get("/admin/activity-monitor")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const toggleDay = (date) => {
    setExpandedDay((prev) => (prev === date ? null : date));
  };

  if (authLoading || loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </ProtectedRoute>
    );
  }

  if (!data) return null;

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-text">
          Monitor de Atividade
        </h1>

        {/* Ranking */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <FiAward size={20} className="text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-text">
              Ranking — Últimos 30 dias
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-dark-text-secondary border-b border-gray-100 dark:border-dark-border">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Usuário</th>
                  <th className="pb-2 pr-4">Departamento</th>
                  <th className="pb-2 text-right">Dias ativos</th>
                </tr>
              </thead>
              <tbody>
                {data.ranking.map((u, idx) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-50 dark:border-dark-border last:border-0"
                  >
                    <td className="py-2 pr-4 font-bold text-gray-400 dark:text-dark-text-secondary">
                      {idx + 1}
                    </td>
                    <td className="py-2 pr-4 font-medium text-gray-800 dark:text-dark-text">
                      {u.name}
                    </td>
                    <td className="py-2 pr-4 text-gray-500 dark:text-dark-text-secondary">
                      {u.department}
                    </td>
                    <td className="py-2 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                          ${u.daysUsed > 0
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                      >
                        {u.daysUsed} / 30
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Por dia */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <FiUsers size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-text">
              Atividade por dia
            </h2>
          </div>
          <div className="space-y-2">
            {data.days.map((day) => (
              <div
                key={day.date}
                className="rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-4 py-3
                    hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors text-left"
                  onClick={() => toggleDay(day.date)}
                >
                  <span className="font-medium text-gray-800 dark:text-dark-text">
                    {formatDate(day.date)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {day.usedBy.length} usaram
                    </span>
                    <span className="text-xs text-gray-400">
                      {day.notUsedBy.length} não usaram
                    </span>
                    {expandedDay === day.date ? (
                      <FiChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <FiChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedDay === day.date && (
                  <div className="px-4 pb-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-dark-surface">
                    <div>
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wide">
                        Usaram
                      </p>
                      {day.usedBy.length > 0 ? (
                        <ul className="space-y-1">
                          {day.usedBy.map((u) => (
                            <li
                              key={u.id}
                              className="text-sm text-gray-700 dark:text-dark-text"
                            >
                              {u.name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-400">Nenhum</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                        Não usaram
                      </p>
                      {day.notUsedBy.length > 0 ? (
                        <ul className="space-y-1">
                          {day.notUsedBy.map((u) => (
                            <li
                              key={u.id}
                              className="text-sm text-gray-500 dark:text-dark-text-secondary"
                            >
                              {u.name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-400">Nenhum</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ActivityMonitorPage;
