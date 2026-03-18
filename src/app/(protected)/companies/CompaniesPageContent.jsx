// src/app/(protected)/companies/CompaniesPageContent.jsx
"use client";

import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import CompanyTable from "../../../components/CompanyTable";
import CompanyFilters from "../../../components/CompanyFilters";
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
    showArchived: false,
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryCompany, setSelectedHistoryCompany] = useState(null);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [selectedStatusCompany, setSelectedStatusCompany] = useState(null);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [selectedAutomationCompany, setSelectedAutomationCompany] =
    useState(null);

  const {
    openAddCompanyModal,
    setShowModal,
    setModalType,
    setSelectedCompany,
    refreshTrigger,
  } = useContext(CompanyModalContext);

  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await api.get("/company/all");
      setCompanies(res.data); // armazena todas, inclusive arquivadas
    } catch (error) {
      toast.error("Erro ao buscar empresas.");
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-busca ao salvar empresa via modal do layout
  useEffect(() => {
    if (refreshTrigger > 0) fetchCompanies();
  }, [refreshTrigger, fetchCompanies]);

  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    // Empresas arquivadas ficam ocultas por padrão
    if (!filters.showArchived) {
      filtered = filtered.filter(
        (c) => c.status !== "ARCHIVED" && !c.isArchived
      );
    } else {
      // Quando exibindo arquivadas, mostra APENAS as arquivadas
      filtered = filtered.filter(
        (c) => c.status === "ARCHIVED" || c.isArchived
      );
    }

    if (filters.searchTerm) {
      filtered = filtered.filter((company) => {
        const searchTerm = filters.searchTerm.toLowerCase();
        if (filters.searchColumn === "responsavel") {
          const fiscalName = company.respFiscal?.name?.toLowerCase() || "";
          const dpName = company.respDp?.name?.toLowerCase() || "";
          return fiscalName.includes(searchTerm) || dpName.includes(searchTerm);
        } else if (filters.searchColumn === "uf") {
          // Adicionado filtro por UF
          return company.uf?.toLowerCase().includes(searchTerm);
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

  const handleSaveStatusChange = useCallback(
    async (statusData) => {
      try {
        await api.post(
          `/company/change-status/${selectedStatusCompany.id}`,
          statusData
        );
        toast.success("Status da empresa atualizado com sucesso!");

        setCompanies((prev) =>
          prev.map((c) =>
            c.id === selectedStatusCompany.id
              ? { ...c, status: statusData.newStatus }
              : c
          )
        );

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

  const handleManualArchiveCompany = useCallback(async (companyToArchive) => {
    if (
      window.confirm(
        `Tem certeza que deseja arquivar a empresa "${companyToArchive.name}"? Ela não aparecerá mais nas listagens comuns.`
      )
    ) {
      try {
        await api.patch(`/admin/company/${companyToArchive.id}/archive`);
        toast.success(
          `Empresa "${companyToArchive.name}" arquivada com sucesso.`
        );
        setCompanies((prevCompanies) =>
          prevCompanies.filter((company) => company.id !== companyToArchive.id)
        );
      } catch (error) {
        toast.error(
          `Erro ao arquivar a empresa: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  }, []);

  return (
    <>
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
            showArchived: false,
          })
        }
      />
      <CompanyTable
        companies={filteredCompanies}
        onEditCompany={handleEditCompany}
        onBlockCompany={handleBlockCompany}
        onViewHistory={handleViewHistory}
        onManageAutomations={handleManageAutomations}
        onManualArchiveCompany={handleManualArchiveCompany}
      />
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
    </>
  );
};

export default CompaniesPageContent;
