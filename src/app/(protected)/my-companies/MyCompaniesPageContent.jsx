// src/app/(protected)/my-companies/MyCompaniesPageContent.jsx
"use client";

import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import CompanyTable from "../../../components/CompanyTable";
import CompanyFilters from "../../../components/CompanyFilters";
import HistoryModal from "../../../components/HistoryModal";
import StatusChangeModal from "../../../components/StatusChangeModal";
import AutomationModal from "../../../components/AutomationModal";
import BatchTaxObligationModal from "../../../components/BatchTaxObligationModal";
import OrientationsModal from "../../../components/OrientationsModal";
import api from "../../../utils/api";
import { toast } from "react-toastify";
import { CompanyModalContext } from "../../../context/CompanyModalContext";
import { useAuth } from "../../../hooks/useAuth";
import { useCompetencia } from "../../../hooks/useCompetencia";
import AgentCompaniesView from "./AgentCompaniesView";
import useCachedFetch from "../../../hooks/useCachedFetch";
import {
  FiLayers,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiLoader,
  FiSliders,
} from "react-icons/fi";

const StatValue = ({ loading, value }) =>
  loading ? (
    <span className="inline-block h-5 w-8 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
  ) : (
    <p className="text-lg font-bold">{value}</p>
  );

// Verifica se uma empresa está 100% concluída para o departamento do agente
const isCompanyComplete = (company, department) => {
  if (department === "Fiscal") {
    if (company.isZeroedFiscal) return true;
    return company.fiscalCompletedAt != null;
  }
  if (department === "Pessoal") {
    if (company.isZeroedDp) return true;
    return !!company.dpCompletedAt;
  }
  if (department === "Contábil") {
    if (company.isZeroedContabil) return true;
    return !!company.contabilCompletedAt;
  }
  return false;
};

const MyCompaniesPageContent = () => {
  const { user } = useAuth(); // Obter o usuário autenticado
  const { selectedPeriod } = useCompetencia();
  const { data: companiesData, loading: companiesLoading, refresh: fetchCompanies } = useCachedFetch("/company/my-companies");
  const companies = useMemo(() => companiesData || [], [companiesData]);
  const VIEW_MODE_KEY = "contask_my_companies_view_mode";
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "standard";
    return localStorage.getItem(VIEW_MODE_KEY) || "standard";
  });
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
  const [selectedAutomationCompany, setSelectedAutomationCompany] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [orientationModal, setOrientationModal] = useState(null);

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
      setViewMode("standard");
      localStorage.setItem("contask_my_companies_view_mode", "standard");
    }
  }, [user]); // Dependência do usuário

  // Re-busca ao salvar empresa via modal do layout (refresh já invalida o cache)
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
      // No modo agente: empresas do usuário, ativas sempre + inativas até o mês do status
      filtered = filtered.filter((company) => {
        const isAssigned =
          (user?.department === "Fiscal"   && company.respFiscalId   === user?.id) ||
          (user?.department === "Pessoal"  && company.respDpId       === user?.id) ||
          (user?.department === "Contábil" && company.respContabilId === user?.id);

        if (!isAssigned) return false;
        if (company.status === "ATIVA") return true;

        // SUSPENSA / BAIXADA / DISTRATO: aparece até o mês do status (inclusive)
        // Se statusUpdatedAt for nulo (empresa suspensa antes do campo existir), exibe sempre
        if (["SUSPENSA", "BAIXADA", "DISTRATO"].includes(company.status)) {
          const statusMonth = company.statusUpdatedAt
            ? company.statusUpdatedAt.slice(0, 7)
            : null;
          return statusMonth ? selectedPeriod <= statusMonth : true;
        }

        return false;
      });
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return filtered;
  }, [companies, filters, viewMode, user, selectedPeriod]);

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
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <span className={`text-sm font-medium ${viewMode === "standard" ? "text-light-text dark:text-dark-text" : "text-light-text-secondary dark:text-dark-text-secondary"}`}>
            Padrao
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={viewMode === "agent"}
              onChange={() => {
                const next = viewMode === "standard" ? "agent" : "standard";
                setViewMode(next);
                localStorage.setItem(VIEW_MODE_KEY, next);
              }}
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-dark-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
          </label>
          <span className={`text-sm font-medium ${viewMode === "agent" ? "text-light-text dark:text-dark-text" : "text-light-text-secondary dark:text-dark-text-secondary"}`}>
            Agente
          </span>
          {viewMode === "agent" && (
            <button
              type="button"
              onClick={() => setShowBatchModal(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              <FiSliders size={13} /> Gerenciar em Lote
            </button>
          )}
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
              <StatValue loading={companiesLoading} value={totalCompanies} />
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <FiCheckCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Ativas</p>
              <StatValue loading={companiesLoading} value={activeCompanies} />
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <FiAlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Inativas</p>
              <StatValue loading={companiesLoading} value={inactiveCompanies} />
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
              <StatValue loading={companiesLoading} value={agentStats.total} />
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
              <StatValue loading={companiesLoading} value={agentStats.concluidas} />
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
              <StatValue loading={companiesLoading} value={agentStats.pendentes} />
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
            onOpenOrientations={(company) => setOrientationModal(company)}
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
      {showBatchModal && (
        <BatchTaxObligationModal
          companies={filteredCompanies}
          onClose={() => setShowBatchModal(false)}
          onSuccess={fetchCompanies}
          userDepartment={user?.department}
        />
      )}
      {orientationModal && (
        <OrientationsModal
          company={orientationModal}
          onClose={() => setOrientationModal(null)}
        />
      )}
    </>
  );
};

export default MyCompaniesPageContent;
