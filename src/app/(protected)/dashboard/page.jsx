// src/app/(protected)/dashboard/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useState, useEffect, useCallback } from "react";
import api from "../../../utils/api";
import { useAuth } from "../../../hooks/useAuth";
import { toast } from "react-toastify";
import DashboardContent from "../../../components/DashboardContent";
import ObligationsDashboard from "../../../components/ObligationsDashboard";
import Loading from "../../../components/Loading";
import LoadingSpinner from "../../../components/LoadingSpinner";

const DashboardPage = () => {
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";
  const isFiscal = user?.department === "Fiscal";
  const isPessoal = user?.department === "Pessoal";
  const isContabil = user?.department === "Contabil";
  const canSeeMyCompanies = isFiscal || isPessoal;

  useEffect(() => {
    if (!user) return;
    if (isAdmin) setViewMode("obligations");
    else if (isFiscal) setViewMode("obligations");
    else if (isPessoal) setViewMode("dp_general");
    else if (isContabil) setViewMode("contabil_general");
  }, [user, isAdmin, isFiscal, isPessoal, isContabil]);

  const fetchDashboardData = useCallback(async () => {
    if (!viewMode || !user) return;
    // A aba de Obrigações gerencia seus próprios dados internamente
    if (viewMode === "obligations") { setLoading(false); return; }
    setLoading(true);
    setDashboardData(null); // evita renderizar dados obsoletos de outra aba
    let endpoint = "";
    switch (viewMode) {
      case "fiscal_general":
        endpoint = "/company/dashboard/fiscal/general";
        break;
      case "dp_general":
        endpoint = "/company/dashboard/dp/general";
        break;
      case "contabil_general":
        endpoint = "/company/dashboard/contabil/general";
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

  const handleViewChange = (newView) => {
    if (newView === "my_companies_toggle") {
      setViewMode((prev) =>
        prev === "my_companies"
          ? isFiscal
            ? "obligations"
            : "dp_general"
          : "my_companies"
      );
    } else {
      setViewMode(newView);
    }
  };

  // Build tabs based on user role
  const tabs = [];
  if (isAdmin) {
    tabs.push(
      { key: "obligations", label: "Obrigações/Impostos" },
      { key: "dp_general", label: "DP Geral" },
      { key: "contabil_general", label: "Contábil Geral" }
    );
    if (canSeeMyCompanies) {
      tabs.push({ key: "my_companies", label: "Minhas Empresas" });
    }
  } else if (canSeeMyCompanies) {
    if (isFiscal) {
      tabs.push(
        { key: "obligations", label: "Obrigações/Impostos" },
        { key: "my_companies", label: "Minhas Empresas" }
      );
    } else {
      tabs.push(
        { key: "dp_general", label: "Geral" },
        { key: "my_companies", label: "Minhas Empresas" }
      );
    }
  }

  return (
    <ProtectedRoute
      requiredPermissions={{
        roles: ["admin"],
        departments: ["Fiscal", "Pessoal"],
      }}
    >
      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-dark-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleViewChange(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                ${
                  viewMode === tab.key
                    ? "border-b-2 border-primary-500 text-primary-500"
                    : "text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {viewMode === "obligations" ? (
        <div className="card">
          <ObligationsDashboard />
        </div>
      ) : (
        <div className="card">
          {loading ? (
            <LoadingSpinner size="lg" />
          ) : dashboardData ? (
            <DashboardContent data={dashboardData} viewMode={viewMode} />
          ) : (
            <p className="text-center text-light-text-secondary dark:text-dark-text-secondary py-10">
              Nao foi possivel carregar os dados. Tente selecionar outra
              visualizacao.
            </p>
          )}
        </div>
      )}
    </ProtectedRoute>
  );
};

export default DashboardPage;
