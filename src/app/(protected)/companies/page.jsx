// src/app/(protected)/companies/page.jsx

"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useState, useEffect, useCallback, useContext } from "react";
import CompanyTable from "../../../components/CompanyTable";
import CompanyFilters from "../../../components/CompanyFilters";
import CompanyModal from "../../../components/CompanyModal";
import HistoryModal from "../../../components/HistoryModal";
import StatusChangeModal from "../../../components/StatusChangeModal";
import api from "../../../utils/api";
import { toast } from "react-toastify";
import { CompanyModalContext } from "../../../context/CompanyModalContext";
import { useRouter, useSearchParams } from "next/navigation";

const CompaniesPage = () => {
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

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await api.get("/company/all");
      setCompanies(res.data);
    } catch (error) {
      toast.error("Erro ao buscar empresas.");
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

  useEffect(() => {
    // Verifica se existe o parâmetro 'add' na URL
    if (searchParams.get("add") === "true") {
      openAddCompanyModal();
      // Remove o parâmetro da URL para evitar reabrir o modal ao navegar de volta
      const params = new URLSearchParams(searchParams);
      params.delete("add");
      router.replace(`/companies?${params.toString()}`);
    }
  }, [searchParams, openAddCompanyModal, router]);

  const handleEditCompany = (company) => {
    setModalType("edit");
    setSelectedCompany(company);
    setShowModal(true);
  };

  const handleSaveCompany = async (companyData) => {
    try {
      if (modalType === "add") {
        const res = await api.post("/company/add", companyData);
        const newCompany = res.data.company;
        toast.success(`Empresa "${companyData.name}" adicionada com sucesso!`);

        // Atualiza a lista de empresas adicionando a nova empresa
        setCompanies((prevCompanies) => [...prevCompanies, newCompany]);
      } else if (modalType === "edit") {
        await api.patch(`/company/edit/${companyData.id}`, companyData);
        toast.success(`Empresa "${companyData.name}" atualizada com sucesso!`);

        // Atualiza a empresa editada na lista de empresas
        setCompanies((prevCompanies) =>
          prevCompanies.map((company) =>
            company.id === companyData.id ? companyData : company
          )
        );
      }
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

      // Atualiza o status da empresa na lista de empresas
      setCompanies((prevCompanies) =>
        prevCompanies.map((company) =>
          company.id === selectedStatusCompany.id
            ? { ...company, status: statusData.newStatus }
            : company
        )
      );

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

  return (
    <ProtectedRoute>
      <div className="w-full px-8 py-8">
        <div className="bg-white dark:bg-dark-card rounded shadow-md">
          <div className="bg-logo-light-blue dark:bg-dark-card p-4 rounded-t">
            <h1 className="text-2xl font-bold text-white dark:text-dark-text">
              Empresas
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
            />
          </div>
        </div>
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
      </div>
    </ProtectedRoute>
  );
};

export default CompaniesPage;
