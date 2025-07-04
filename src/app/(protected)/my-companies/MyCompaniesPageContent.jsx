// src/app/(protected)/my-companies/MyCompaniesPageContent.jsx
"use client";

import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import CompanyTable from "../../../components/CompanyTable";
import CompanyFilters from "../../../components/CompanyFilters";
import CompanyModal from "../../../components/CompanyModal";
import HistoryModal from "../../../components/HistoryModal";
import StatusChangeModal from "../../../components/StatusChangeModal";
import AutomationModal from "../../../components/AutomationModal";
import api from "../../../utils/api";
import { toast } from "react-toastify";
import { CompanyModalContext } from "../../../context/CompanyModalContext";
import { useAuth } from "../../../hooks/useAuth"; // Importar useAuth
import AgentCompaniesView from "./AgentCompaniesView"; // Importar o novo componente

const MyCompaniesPageContent = () => {
  const { user } = useAuth(); // Obter o usuário autenticado
  const [companies, setCompanies] = useState([]);
  const [viewMode, setViewMode] = useState("standard"); // Novo estado para o modo de visualização
  const [isAgentViewAvailable, setIsAgentViewAvailable] = useState(false); // Novo estado para controlar a disponibilidade do modo Agente

  const [filters, setFilters] = useState({
    searchColumn: "name",
    searchTerm: "",
    regime: [],
    situacao: [],
    classificacao: [],
    semFiscal: false,
    semDp: false,
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryCompany, setSelectedHistoryCompany] = useState(null);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [selectedStatusCompany, setSelectedStatusCompany] = useState(null);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [selectedAutomationCompany, setSelectedAutomationCompany] =
    useState(null);

  const {
    showModal,
    modalType,
    selectedCompany,
    closeModal,
    setShowModal,
    setModalType,
    setSelectedCompany,
  } = useContext(CompanyModalContext);

  useEffect(() => {
    // Determinar se o modo "Agente" está disponível para o usuário
    if (
      user &&
      (user.department === "Fiscal" || user.department === "Pessoal")
    ) {
      setIsAgentViewAvailable(true);
    } else {
      setIsAgentViewAvailable(false);
      setViewMode("standard"); // Se não for Fiscal/Pessoal, força para Padrão
    }
  }, [user]); // Dependência do usuário

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await api.get("/company/my-companies");
      setCompanies(res.data);
    } catch (error) {
      toast.error("Erro ao buscar suas empresas.");
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    // Se estiver no modo padrão, os filtros atuais funcionam normalmente
    if (viewMode === "standard") {
      if (filters.searchTerm) {
        filtered = filtered.filter((company) => {
          const searchTerm = filters.searchTerm.toLowerCase();
          if (filters.searchColumn === "responsavel") {
            const fiscalName = company.respFiscal?.name?.toLowerCase() || "";
            const dpName = company.respDp?.name?.toLowerCase() || "";
            return (
              fiscalName.includes(searchTerm) || dpName.includes(searchTerm)
            );
          } else {
            return company[filters.searchColumn]
              ?.toString()
              .toLowerCase()
              .includes(searchTerm);
          }
        });
      }

      if (filters.regime.length > 0) {
        filtered = filtered.filter((company) =>
          filters.regime.includes(company.rule)
        );
      }

      if (filters.situacao.length > 0) {
        filtered = filtered.filter((company) =>
          filters.situacao.includes(company.status)
        );
      }

      if (filters.classificacao.length > 0) {
        filtered = filtered.filter((company) =>
          filters.classificacao.includes(company.classi)
        );
      }

      if (filters.semFiscal && filters.semDp) {
        filtered = filtered.filter(
          (company) => !company.respFiscalId || !company.respDpId
        );
      } else if (filters.semFiscal) {
        filtered = filtered.filter((company) => !company.respFiscalId);
      } else if (filters.semDp) {
        filtered = filtered.filter((company) => !company.respDpId);
      }
    } else if (viewMode === "agent") {
      // No modo agente, a filtragem padrão é:
      // 1. Apenas empresas com status "ATIVA"
      // 2. Empresas responsáveis pelo usuário logado (Fiscal ou Pessoal)
      filtered = filtered.filter(
        (company) =>
          company.status === "ATIVA" &&
          ((user?.department === "Fiscal" &&
            company.respFiscalId === user?.id) ||
            (user?.department === "Pessoal" && company.respDpId === user?.id))
      );
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return filtered;
  }, [companies, filters, viewMode, user]); // Adiciona viewMode e user como dependências

  const handleEditCompany = useCallback(
    (company) => {
      setModalType("edit");
      setSelectedCompany(company);
      setShowModal(true);
    },
    [setModalType, setSelectedCompany, setShowModal]
  );

  const handleSaveCompany = useCallback(
    async (companyData) => {
      try {
        await api.patch(`/company/edit/${companyData.id}`, companyData);
        toast.success(`Empresa "${companyData.name}" atualizada com sucesso!`);

        // Recarrega a lista para ter certeza de que os dados estão atualizados
        await fetchCompanies();

        closeModal();
      } catch (error) {
        toast.error(
          `Erro ao salvar a empresa: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    },
    [closeModal, fetchCompanies]
  );

  const handleSaveStatusChange = useCallback(
    async (statusData) => {
      try {
        await api.post(
          `/company/change-status/${selectedStatusCompany.id}`,
          statusData
        );
        toast.success("Status da empresa atualizado com sucesso!");

        // Recarrega a lista
        await fetchCompanies();

        setShowStatusChangeModal(false);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Erro ao atualizar o status da empresa."
        );
      }
    },
    [selectedStatusCompany, fetchCompanies]
  );

  const handleBlockCompany = useCallback((company) => {
    setSelectedStatusCompany(company);
    setShowStatusChangeModal(true);
  }, []);

  const handleViewHistory = useCallback((company) => {
    setSelectedHistoryCompany(company);
    setShowHistoryModal(true);
  }, []);

  const handleCloseHistoryModal = useCallback(() => {
    setShowHistoryModal(false);
    setSelectedHistoryCompany(null);
  }, []);

  const handleManageAutomations = useCallback(async (company) => {
    try {
      const res = await api.get(`/company/${company.id}`);
      const fullCompanyData = res.data;
      setSelectedAutomationCompany(fullCompanyData);
      setShowAutomationModal(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao carregar os dados da empresa."
      );
    }
  }, []);

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(
    (company) => company.status === "ATIVA"
  ).length;
  const inactiveCompanies = companies.filter(
    (company) =>
      company.status === "SUSPENSA" ||
      company.status === "BAIXADA" ||
      company.status === "DISTRATO"
  ).length;

  return (
    <div className="w-full px-8 py-8">
      {/* Barra de Contadores (só no modo padrão) */}
      {viewMode === "standard" && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-dark-card rounded shadow-md p-4">
            <p className="text-xl font-semibold text-gray-800 dark:text-dark-text">
              Total de Empresas: {totalCompanies}
            </p>
          </div>
          <div className="bg-green-100 dark:bg-green-900 rounded shadow-md p-4">
            <p className="text-xl font-semibold text-gray-800 dark:text-dark-text">
              Empresas Ativas: {activeCompanies}
            </p>
          </div>
          <div className="bg-red-100 dark:bg-red-900 rounded shadow-md p-4">
            <p className="text-xl font-semibold text-gray-800 dark:text-dark-text">
              Empresas Inativas: {inactiveCompanies}
            </p>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="bg-white dark:bg-dark-card rounded shadow-md">
        <div className="bg-logo-light-blue dark:bg-dark-card p-4 rounded-t flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white dark:text-dark-text">
            Minhas Empresas
          </h1>
          {isAgentViewAvailable && ( // Mostrar o switch apenas se a visualização Agente estiver disponível
            <div className="flex items-center space-x-2">
              <span className="text-white dark:text-dark-text">Padrão</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value=""
                  className="sr-only peer"
                  checked={viewMode === "agent"}
                  onChange={() =>
                    setViewMode(viewMode === "standard" ? "agent" : "standard")
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-white dark:text-dark-text">Agente</span>
            </div>
          )}
        </div>
        <div className="p-6">
          {viewMode === "standard" ? (
            <>
              <div className="mb-4">
                <CompanyFilters
                  filters={filters}
                  setFilters={setFilters}
                  onClearFilters={() =>
                    setFilters({
                      searchColumn: "name",
                      searchTerm: "",
                      regime: [],
                      situacao: [],
                      classificacao: [],
                      semFiscal: false,
                      semDp: false,
                    })
                  }
                />
              </div>
              <CompanyTable
                companies={filteredCompanies}
                onEditCompany={handleEditCompany}
                onBlockCompany={handleBlockCompany}
                onViewHistory={handleViewHistory}
                onManageAutomations={handleManageAutomations}
              />
            </>
          ) : (
            <AgentCompaniesView
              companies={filteredCompanies}
              user={user} // Passar o usuário para o componente AgentCompaniesView
              fetchCompanies={fetchCompanies} // Passar a função para recarregar as empresas
            />
          )}
        </div>
      </div>

      {/* Modais (permanecem os mesmos) */}
      {showModal && (
        <CompanyModal
          type={modalType}
          company={selectedCompany}
          onClose={closeModal}
          onSave={handleSaveCompany}
        />
      )}
      {showHistoryModal && (
        <HistoryModal
          company={selectedHistoryCompany}
          onClose={handleCloseHistoryModal}
        />
      )}
      {showStatusChangeModal && (
        <StatusChangeModal
          company={selectedStatusCompany}
          onClose={() => setShowStatusChangeModal(false)}
          onSave={handleSaveStatusChange}
        />
      )}
      {showAutomationModal && (
        <AutomationModal
          company={selectedAutomationCompany}
          onClose={() => setShowAutomationModal(false)}
        />
      )}
    </div>
  );
};

export default MyCompaniesPageContent;
