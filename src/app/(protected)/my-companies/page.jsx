// src/app/(protected)/my-companies/page.jsx

"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useState, useEffect, useCallback, useContext } from "react";
import CompanyTable from "../../../components/CompanyTable";
import CompanyFilters from "../../../components/CompanyFilters";
import CompanyModal from "../../../components/CompanyModal";
import HistoryModal from "../../../components/HistoryModal";
import StatusChangeModal from "../../../components/StatusChangeModal";
import AutomationModal from "../../../components/AutomationModal"; // Importação adicionada
import api from "../../../utils/api";
import { toast } from "react-toastify";
import { CompanyModalContext } from "../../../context/CompanyModalContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";

const MyCompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [filters, setFilters] = useState({
    searchColumn: "name",
    searchTerm: "",
    regime: [],
    situacao: [],
    classificacao: [],
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryCompany, setSelectedHistoryCompany] = useState(null);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [selectedStatusCompany, setSelectedStatusCompany] = useState(null);
  const [showAutomationModal, setShowAutomationModal] = useState(false); // Novo estado
  const [selectedAutomationCompany, setSelectedAutomationCompany] =
    useState(null); // Novo estado

  const {
    showModal,
    modalType,
    selectedCompany,
    openAddCompanyModal,
    closeModal,
    setShowModal,
    setModalType,
    setSelectedCompany,
  } = useContext(CompanyModalContext);

  const { user } = useAuth();

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await api.get("/company/my-companies");
      setCompanies(res.data);
    } catch (error) {
      toast.error("Erro ao buscar suas empresas.");
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...companies];

    // Filtro de busca
    if (filters.searchTerm) {
      filtered = filtered.filter((company) =>
        company[filters.searchColumn]
          ?.toString()
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase())
      );
    }

    // Filtros avançados
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

    // Ordenar as empresas em ordem alfabética
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredCompanies(filtered);
  }, [companies, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleEditCompany = (company) => {
    setModalType("edit");
    setSelectedCompany(company);
    setShowModal(true);
  };

  const handleSaveCompany = async (companyData) => {
    try {
      await api.patch(`/company/edit/${companyData.id}`, companyData);
      toast.success(`Empresa "${companyData.name}" atualizada com sucesso!`);
      fetchCompanies();
      closeModal();
    } catch (error) {
      toast.error(
        `Erro ao salvar a empresa: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleSaveStatusChange = async (statusData) => {
    try {
      await api.post(
        `/company/change-status/${selectedStatusCompany.id}`,
        statusData
      );
      toast.success("Status da empresa atualizado com sucesso!");
      fetchCompanies(); // Atualiza a lista de empresas
      setShowStatusChangeModal(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erro ao atualizar o status da empresa."
      );
    }
  };

  const handleBlockCompany = (company) => {
    setSelectedStatusCompany(company);
    setShowStatusChangeModal(true);
  };

  const handleViewHistory = (company) => {
    setSelectedHistoryCompany(company);
    setShowHistoryModal(true);
  };

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedHistoryCompany(null);
  };

  // Função para gerenciar automações
  const handleManageAutomations = async (company) => {
    try {
      // Buscar os dados completos da empresa, incluindo as automações
      const res = await api.get(`/company/${company.id}`);
      const fullCompanyData = res.data;

      setSelectedAutomationCompany(fullCompanyData);
      setShowAutomationModal(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao carregar os dados da empresa."
      );
    }
  };

  // Contadores
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
    <ProtectedRoute>
      <div className="w-full px-8 py-8">
        {/* Barra de Contadores */}
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

        {/* Conteúdo Principal */}
        <div className="bg-white dark:bg-dark-card rounded shadow-md">
          <div className="bg-logo-light-blue dark:bg-dark-card p-4 rounded-t">
            <h1 className="text-2xl font-bold text-white dark:text-dark-text">
              Minhas Empresas
            </h1>
          </div>
          <div className="p-6">
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
                  })
                }
              />
            </div>
            <CompanyTable
              companies={filteredCompanies}
              onEditCompany={handleEditCompany}
              onBlockCompany={handleBlockCompany}
              onViewHistory={handleViewHistory}
              onManageAutomations={handleManageAutomations} // Passando a função
            />
          </div>
        </div>

        {/* Modais */}
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
    </ProtectedRoute>
  );
};

export default MyCompaniesPage;
