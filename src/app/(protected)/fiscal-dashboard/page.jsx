// src/app/(protected)/fiscal-dashboard/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useState, useEffect, useCallback } from "react";
import api from "../../../utils/api";
import { useAuth } from "../../../hooks/useAuth";
import { toast } from "react-toastify";
import FiscalDashboardContent from "../../../components/FiscalDashboardContent"; // Importar o componente do dashboard
import Loading from "../../../components/Loading"; // Importar componente de Loading

const FiscalDashboardPage = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("general");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Determina se o switch 'Minhas Empresas' deve ser exibido
  const showMyCompaniesToggle = user?.department === "Fiscal";

  // Hook useCallback otimizado para depender apenas do que realmente importa
  const fetchDashboardData = useCallback(async () => {
    // Se o user não estiver carregado, ou se o modo for 'my_companies' sem um ID de usuário, não faz nada.
    if (!user) return;

    setLoading(true);
    setDashboardData(null); // Limpa os dados antigos antes de buscar novos

    try {
      let endpoint = "";
      if (viewMode === "general") {
        endpoint = "/company/fiscal-dashboard/all";
      } else if (viewMode === "my_companies" && user.department === "Fiscal") {
        endpoint = `/company/fiscal-dashboard/my-companies/${user.id}`;
      } else {
        // Se a view for inválida para o usuário, não busca nada.
        setLoading(false);
        return;
      }

      const res = await api.get(endpoint);
      setDashboardData(res.data);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard fiscal:", error);
      toast.error(
        error.response?.data?.message || "Erro ao carregar dados do dashboard."
      );
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [viewMode, user]); // Depende apenas de viewMode e do objeto user

  // Hook useEffect corrigido para quebrar o loop infinito
  useEffect(() => {
    // Garante que o modo de visualização seja 'general' se o usuário não for do Fiscal
    if (user && user.department !== "Fiscal" && viewMode !== "general") {
      setViewMode("general");
    }

    fetchDashboardData();
  }, [user, viewMode, fetchDashboardData]); // Executa a busca quando o usuário ou o modo de visualização mudam

  // Renderiza um componente de loading centralizado enquanto os dados são buscados.
  // Isso evita o 'pisca-pisca'.
  if (loading) {
    return <Loading />;
  }

  return (
    <ProtectedRoute requiredRole={["admin", "fiscal"]}>
      <div className="w-full px-8 py-8">
        <div className="bg-white dark:bg-dark-card rounded shadow-md">
          <div className="bg-logo-light-blue dark:bg-dark-card p-4 rounded-t flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white dark:text-dark-text">
              Dashboard de Atividades Fiscais
            </h1>
            {showMyCompaniesToggle && (
              <div className="flex items-center space-x-2">
                <span className="text-white dark:text-dark-text">Geral</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    value=""
                    className="sr-only peer"
                    checked={viewMode === "my_companies"}
                    onChange={() =>
                      setViewMode(
                        viewMode === "general" ? "my_companies" : "general"
                      )
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-white dark:text-dark-text">
                  Minhas Empresas
                </span>
              </div>
            )}
          </div>
          <div className="p-6">
            {dashboardData ? (
              <FiscalDashboardContent
                data={dashboardData}
                viewMode={viewMode}
                user={user}
              />
            ) : (
              <p className="text-gray-800 dark:text-dark-text text-center">
                Não foi possível carregar os dados do dashboard.
              </p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default FiscalDashboardPage;
