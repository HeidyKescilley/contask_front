// src/app/(protected)/companies/CompaniesPageContent.jsx
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
import { useRouter, useSearchParams } from "next/navigation";

const CompaniesPageContent = () => {
  const [companies, setCompanies] = useState([]);
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
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [selectedAutomationCompany, setSelectedAutomationCompany] =
    useState(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await api.get("/company/all");
      setCompanies(res.data);
    } catch (error) {
      toast.error("Erro ao buscar empresas.");
    }
  }, []);

  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    if (filters.searchTerm) {
      filtered = filtered.filter((company) =>
        company[filters.searchColumn]
          ?.toString()
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase())
      );
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

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return filtered;
  }, [companies, filters]);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      openAddCompanyModal();
      const params = new URLSearchParams(searchParams.toString());
      params.delete("add");
      router.replace(`/companies?${params.toString()}`);
    }
  }, [searchParams, openAddCompanyModal, router]);

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
        if (modalType === "add") {
          const res = await api.post("/company/add", companyData);
          const newCompany = res.data.company;
          toast.success(
            `Empresa "${companyData.name}" adicionada com sucesso!`
          );
          setCompanies((prevCompanies) => [...prevCompanies, newCompany]);
        } else if (modalType === "edit") {
          await api.patch(`/company/edit/${companyData.id}`, companyData);
          toast.success(
            `Empresa "${companyData.name}" atualizada com sucesso!`
          );
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
    },
    [modalType, closeModal]
  );

  const handleSaveStatusChange = useCallback(
    async (statusData) => {
      try {
        await api.post(
          `/company/change-status/${selectedStatusCompany.id}`,
          statusData
        );
        toast.success("Status da empresa atualizado com sucesso!");
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
    },
    [selectedStatusCompany]
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

  return (
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
            onManageAutomations={handleManageAutomations}
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
      {showAutomationModal && (
        <AutomationModal
          company={selectedAutomationCompany}
          onClose={() => setShowAutomationModal(false)}
        />
      )}
    </div>
  );
};

export default CompaniesPageContent;
