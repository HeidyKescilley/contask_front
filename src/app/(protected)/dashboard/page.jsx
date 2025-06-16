// src/app/(protected)/dashboard/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useState, useEffect, useCallback } from "react";
import api from "../../../utils/api";
import { useAuth } from "../../../hooks/useAuth";
import { toast } from "react-toastify";
import DashboardContent from "../../../components/DashboardContent";
import Loading from "../../../components/Loading";

const DashboardPage = () => {
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";
  const isFiscal = user?.department === "Fiscal";
  const isPessoal = user?.department === "Pessoal";
  const canSeeMyCompanies = isFiscal || isPessoal;

  useEffect(() => {
    if (!user) return;
    if (isAdmin) setViewMode("fiscal_general");
    else if (isFiscal) setViewMode("fiscal_general");
    else if (isPessoal) setViewMode("dp_general");
  }, [user, isAdmin, isFiscal, isPessoal]);

  const fetchDashboardData = useCallback(async () => {
    if (!viewMode || !user) return;
    setLoading(true);
    let endpoint = "";
    switch (viewMode) {
      case "fiscal_general":
        endpoint = "/company/dashboard/fiscal/general";
        break;
      case "dp_general":
        endpoint = "/company/dashboard/dp/general";
        break;
      case "my_companies":
        if (isFiscal)
          endpoint = `/company/dashboard/fiscal/my-companies/${user.id}`;
        else if (isPessoal)
          endpoint = `/company/dashboard/dp/my-companies/${user.id}`;
        break;
      default:
        setLoading(false);
        return;
    }
    try {
      const res = await api.get(endpoint);
      setDashboardData(res.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao carregar dados do dashboard."
      );
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [viewMode, user, isFiscal, isPessoal]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getTitle = () => {
    switch (viewMode) {
      case "fiscal_general":
        return "Dashboard de Atividades Fiscais";
      case "dp_general":
        return "Dashboard de Atividades do DP";
      case "my_companies":
        return `Dashboard de Minhas Empresas (${user?.department})`;
      default:
        return "Dashboard";
    }
  };

  const handleViewChange = (newView) => {
    if (newView === "my_companies_toggle") {
      setViewMode((prev) =>
        prev === "my_companies"
          ? isFiscal
            ? "fiscal_general"
            : "dp_general"
          : "my_companies"
      );
    } else {
      setViewMode(newView);
    }
  };

  return (
    <ProtectedRoute
      requiredPermissions={{
        roles: ["admin"],
        departments: ["Fiscal", "Pessoal"],
      }}
    >
      <div className="w-full px-8 py-8">
        <div className="bg-white dark:bg-dark-card rounded shadow-md overflow-hidden">
          <div className="bg-logo-light-blue dark:bg-dark-card flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-white dark:text-dark-text">
              {getTitle()}
            </h1>

            {isAdmin ? (
              <div className="flex items-center gap-1 bg-white/20 rounded-full p-1">
                <button
                  onClick={() => handleViewChange("fiscal_general")}
                  className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                    viewMode === "fiscal_general"
                      ? "bg-white text-logo-light-blue shadow"
                      : "text-white"
                  }`}
                >
                  Fiscal Geral
                </button>
                <button
                  onClick={() => handleViewChange("dp_general")}
                  className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                    viewMode === "dp_general"
                      ? "bg-white text-logo-light-blue shadow"
                      : "text-white"
                  }`}
                >
                  DP Geral
                </button>
                {canSeeMyCompanies && (
                  <button
                    onClick={() => handleViewChange("my_companies")}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                      viewMode === "my_companies"
                        ? "bg-white text-logo-light-blue shadow"
                        : "text-white"
                    }`}
                  >
                    Minhas Empresas
                  </button>
                )}
              </div>
            ) : (
              canSeeMyCompanies && (
                <div className="flex items-center gap-1 bg-white/20 rounded-full p-1">
                  <button
                    onClick={() =>
                      handleViewChange(
                        isFiscal ? "fiscal_general" : "dp_general"
                      )
                    }
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                      viewMode === "my_companies"
                        ? "text-white"
                        : "bg-white text-logo-light-blue shadow"
                    }`}
                  >
                    Geral
                  </button>
                  <button
                    onClick={() => handleViewChange("my_companies_toggle")}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                      viewMode === "my_companies"
                        ? "bg-white text-logo-light-blue shadow"
                        : "text-white"
                    }`}
                  >
                    Minhas Empresas
                  </button>
                </div>
              )
            )}
          </div>

          <div className="p-6">
            {loading ? (
              <Loading />
            ) : dashboardData ? (
              <DashboardContent data={dashboardData} viewMode={viewMode} />
            ) : (
              <p className="text-center text-gray-800 dark:text-dark-text">
                Não foi possível carregar os dados. Tente selecionar outra
                visualização.
              </p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default DashboardPage;
