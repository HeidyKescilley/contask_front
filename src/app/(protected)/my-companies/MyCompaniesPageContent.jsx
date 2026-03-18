// src/app/(protected)/my-companies/MyCompaniesPageContent.jsx
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
import { useAuth } from "../../../hooks/useAuth";
import AgentCompaniesView from "./AgentCompaniesView";
import {
  FiLayers,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
} from "react-icons/fi";

// Verifica se uma empresa está 100% concluída para o departamento do agente
const isCompanyComplete = (company, department) => {
  if (department === "Fiscal") {
    if (company.isZeroedFiscal) return true;
    return (
      company.sentToClientFiscal === true &&
      (company.declarationsCompletedFiscal === true ||
        company.hasNoFiscalObligations === true) &&
      company.bonusValue !== null &&
      company.bonusValue !== undefined
    );
  }
  if (department === "Pessoal") {
    if (company.isZeroedDp) return true;
    return (
      company.sentToClientDp === true &&
      (company.declarationsCompletedDp === true ||
        company.hasNoDpObligations === true) &&
      company.employeesCount !== null &&
      company.employeesCount !== undefined
    );
  }
  if (department === "Contábil") {
    return (
      company.accountingMonthsCount !== null &&
      company.accountingMonthsCount !== undefined
    );
  }
  return false;
};

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
    setShowModal,
    setModalType,
    setSelectedCompany,
    refreshTrigger,
  } = useContext(CompanyModalContext);

  useEffect(() => {
    // Determinar se o modo "Agente" está disponível para o usuário
    if (
      user &&
      (user.department === "Fiscal" ||
        user.department === "Pessoal" ||
        user.department === "Contábil")
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

  // Re-busca ao salvar empresa via modal do layout
  useEffect(() => {
    if (refreshTrigger > 0) fetchCompanies();
  }, [refreshTrigger, fetchCompanies]);

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
            (user?.department === "Pessoal" && company.respDpId === user?.id) ||
            (user?.department === "Contábil" &&
              company.respContabilId === user?.id))
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

  // Contadores para o modo Agente (usam filteredCompanies já filtrado por dept/status)
  const agentStats = useMemo(() => {
    if (viewMode !== "agent" || !user?.department) return null;
    const dept = user.department;
    const total = filteredCompanies.length;
    const concluidas = filteredCompanies.filter((c) =>
      isCompanyComplete(c, dept)
    ).length;
    return { total, concluidas, pendentes: total - concluidas };
  }, [filteredCompanies, viewMode, user]);

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
    <>
      {/* Toggle padrao/agente — sempre no topo quando disponível */}
      {isAgentViewAvailable && (
        <div className="flex items-center gap-3 mb-5">
          <span className={`text-sm font-medium ${viewMode === "standard" ? "text-light-text dark:text-dark-text" : "text-light-text-secondary dark:text-dark-text-secondary"}`}>
            Padrao
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={viewMode === "agent"}
              onChange={() =>
                setViewMode(viewMode === "standard" ? "agent" : "standard")
              }
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-dark-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
          </label>
          <span className={`text-sm font-medium ${viewMode === "agent" ? "text-light-text dark:text-dark-text" : "text-light-text-secondary dark:text-dark-text-secondary"}`}>
            Agente
          </span>
        </div>
      )}

      {/* Cards de resumo — padrão ou agente, sempre abaixo do toggle */}
      {viewMode === "standard" ? (
        <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <FiLayers size={18} />
            </div>
            <div>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Total</p>
              <p className="text-lg font-bold">{totalCompanies}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <FiCheckCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Ativas</p>
              <p className="text-lg font-bold">{activeCompanies}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <FiAlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Inativas</p>
              <p className="text-lg font-bold">{inactiveCompanies}</p>
            </div>
          </div>
        </div>
      ) : agentStats ? (
        <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <FiLayers size={18} />
            </div>
            <div>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                Total de Empresas
              </p>
              <p className="text-lg font-bold">{agentStats.total}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <FiCheckCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                100% Concluídas
              </p>
              <p className="text-lg font-bold">{agentStats.concluidas}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <FiClock size={18} />
            </div>
            <div>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                Pendentes
              </p>
              <p className="text-lg font-bold">{agentStats.pendentes}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Conteudo */}
      {viewMode === "standard" ? (
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
              })
            }
          />
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
          user={user}
          fetchCompanies={fetchCompanies}
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
    </>
  );
};

export default MyCompaniesPageContent;
