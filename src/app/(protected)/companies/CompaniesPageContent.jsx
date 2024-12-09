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
    openAddCompanyModal,
    closeModal,
    setShowModal,
    setModalType,
    setSelectedCompany,
  } = useContext(CompanyModalContext);

  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await api.get("/company/all");
      setCompanies(res.data);
    } catch (error) {
      toast.error("Erro ao buscar empresas.");
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    if (filters.searchTerm) {
      filtered = filtered.filter((company) => {
        const searchTerm = filters.searchTerm.toLowerCase();
        if (filters.searchColumn === "responsavel") {
          const fiscalName = company.respFiscal?.name?.toLowerCase() || "";
          const dpName = company.respDp?.name?.toLowerCase() || "";
          return fiscalName.includes(searchTerm) || dpName.includes(searchTerm);
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
        let newCompany;
        if (modalType === "add") {
          const res = await api.post("/company/add", companyData);
          newCompany = res.data.company;
          toast.success(
            `Empresa "${companyData.name}" adicionada com sucesso!`
          );
          // Atualiza o state local OTIMISTICAMENTE
          setCompanies((prev) => [...prev, newCompany]);
        } else if (modalType === "edit") {
          await api.patch(`/company/edit/${companyData.id}`, companyData);
          toast.success(
            `Empresa "${companyData.name}" atualizada com sucesso!`
          );
          // Atualiza o state local OTIMISTICAMENTE
          setCompanies((prev) =>
            prev.map((c) =>
              c.id === companyData.id ? { ...c, ...companyData } : c
            )
          );
        }

        // Você pode opcionalmente re-fetchar no background
        fetchCompanies(); // Não precisa usar await aqui
        closeModal();
      } catch (error) {
        toast.error(
          `Erro ao salvar a empresa: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    },
    [modalType, closeModal, fetchCompanies]
  );

  const handleSaveStatusChange = useCallback(
    async (statusData) => {
      try {
        await api.post(
          `/company/change-status/${selectedStatusCompany.id}`,
          statusData
        );
        toast.success("Status da empresa atualizado com sucesso!");

        // Atualização otimista: atualiza a empresa no estado local
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === selectedStatusCompany.id
              ? { ...c, status: statusData.newStatus }
              : c
          )
        );

        // Chama fetchCompanies no background
        fetchCompanies();
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
