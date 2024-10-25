// src/app/(protected)/companies/page.jsx

"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useState, useEffect, useCallback } from "react";
import CompanyTable from "./CompanyTable";
import CompanyFilters from "./CompanyFilters";
import CompanyModal from "./CompanyModal";
import HistoryModal from "./HistoryModal";
import api from "../../../utils/api";
import { toast } from "react-toastify";

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add"); // 'add' ou 'edit'
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [filters, setFilters] = useState({
    searchColumn: "name",
    searchTerm: "",
    regime: [],
    situacao: [],
    classificacao: [],
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryCompany, setSelectedHistoryCompany] = useState(null);

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

  // Memoize a função applyFilters
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

    setFilteredCompanies(filtered);
  }, [companies, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleAddCompany = () => {
    setModalType("add");
    setSelectedCompany(null);
    setShowModal(true);
  };

  const handleEditCompany = (company) => {
    setModalType("edit");
    setSelectedCompany(company);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCompany(null);
  };

  const handleSaveCompany = async (companyData) => {
    try {
      if (modalType === "add") {
        await api.post("/company/add", companyData);
        toast.success("Empresa adicionada com sucesso!");
      } else if (modalType === "edit") {
        await api.patch(`/company/edit/${companyData.id}`, companyData);
        toast.success("Empresa atualizada com sucesso!");
      }
      fetchCompanies();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar a empresa.");
    }
  };

  const handleBlockCompany = (companyId) => {
    // Implementação da lógica de bloqueio, se necessário
    toast.info("Empresa bloqueada!");
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Empresas</h1>
        <div className="mb-4">
          <CompanyFilters
            filters={filters}
            setFilters={setFilters}
            onAddCompany={handleAddCompany}
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
        {showModal && (
          <CompanyModal
            type={modalType}
            company={selectedCompany}
            onClose={handleCloseModal}
            onSave={handleSaveCompany}
          />
        )}
        {showHistoryModal && (
          <HistoryModal
            company={selectedHistoryCompany}
            onClose={handleCloseHistoryModal}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default CompaniesPage;
