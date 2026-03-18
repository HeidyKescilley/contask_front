// src/app/(protected)/home/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useState, useEffect, useContext } from "react";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/utils";
import { CompanyModalContext } from "../../../context/CompanyModalContext";
import CompanyModal from "../../../components/CompanyModal";
import { toast } from "react-toastify";
import {
  FiEdit,
  FiAlertTriangle,
  FiCheckCircle,
  FiPlusCircle,
} from "react-icons/fi";

const HomePage = () => {
  const [recentStatusChanges, setRecentStatusChanges] = useState([]);
  const [recentActiveCompanies, setRecentActiveCompanies] = useState([]);
  const [recentCompanies, setRecentCompanies] = useState([]);

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
    fetchRecentStatusChanges();
    fetchRecentActiveCompanies();
    fetchRecentCompanies();
  }, []);

  const fetchRecentStatusChanges = async () => {
    try {
      const res = await api.get("/company/recent/status-changes");
      setRecentStatusChanges(res.data);
    } catch (error) {
      console.error("Error fetching recent status changes:", error);
    }
  };

  const fetchRecentActiveCompanies = async () => {
    try {
      const res = await api.get("/company/recent/active-companies");
      setRecentActiveCompanies(res.data);
    } catch (error) {
      console.error("Error fetching recent active companies:", error);
    }
  };

  const fetchRecentCompanies = async () => {
    try {
      const res = await api.get("/company/recent/companies");
      setRecentCompanies(res.data);
    } catch (error) {
      console.error("Error fetching recent companies:", error);
    }
  };

  const handleEditCompany = async (company) => {
    try {
      const res = await api.get(`/company/${company.id}`);
      const fullCompanyData = res.data;
      setModalType("edit");
      setSelectedCompany(fullCompanyData);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching company data:", error);
      toast.error("Erro ao carregar os dados da empresa.");
    }
  };

  const handleSaveCompany = async (companyData) => {
    try {
      await api.patch(`/company/edit/${companyData.id}`, companyData);
      toast.success(`Empresa "${companyData.name}" atualizada com sucesso!`);
      fetchRecentCompanies();
      closeModal();
    } catch (error) {
      toast.error(
        `Erro ao salvar a empresa: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      SUSPENSA:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
      BAIXADA:
        "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
      DISTRATO:
        "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
      ATIVA:
        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1 - Status Changes */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-dark-border">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <FiAlertTriangle size={18} />
            </div>
            <h2 className="text-base font-semibold text-light-text dark:text-dark-text">
              Suspensas, Baixadas ou Distratadas
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-header">Empresa</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentStatusChanges.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="table-cell text-center text-light-text-secondary dark:text-dark-text-secondary"
                    >
                      Nenhum registro recente
                    </td>
                  </tr>
                ) : (
                  recentStatusChanges.map((company) => (
                    <tr key={company.id} className="table-row">
                      <td className="table-cell font-medium">{company.name}</td>
                      <td className="table-cell">
                        {getStatusBadge(company.status)}
                      </td>
                      <td className="table-cell text-light-text-secondary dark:text-dark-text-secondary">
                        {formatDate(company.statusUpdatedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2 - Active Companies */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-dark-border">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <FiCheckCircle size={18} />
            </div>
            <h2 className="text-base font-semibold text-light-text dark:text-dark-text">
              Ultimas Empresas Liberadas
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-header">Empresa</th>
                  <th className="table-header">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentActiveCompanies.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="table-cell text-center text-light-text-secondary dark:text-dark-text-secondary"
                    >
                      Nenhum registro recente
                    </td>
                  </tr>
                ) : (
                  recentActiveCompanies.map((company) => (
                    <tr key={company.id} className="table-row">
                      <td className="table-cell font-medium">{company.name}</td>
                      <td className="table-cell text-light-text-secondary dark:text-dark-text-secondary">
                        {formatDate(company.statusUpdatedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3 - New Companies (full width) */}
        <div className="card p-0 overflow-hidden lg:col-span-2">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-dark-border">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <FiPlusCircle size={18} />
            </div>
            <h2 className="text-base font-semibold text-light-text dark:text-dark-text">
              Novas Empresas
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-header">Empresa</th>
                  <th className="table-header">Resp. Fiscal</th>
                  <th className="table-header">Resp. DP</th>
                  <th className="table-header">Resp. Contabil</th>
                  <th className="table-header">Data de Inicio</th>
                  <th className="table-header w-16">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {recentCompanies.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="table-cell text-center text-light-text-secondary dark:text-dark-text-secondary"
                    >
                      Nenhum registro recente
                    </td>
                  </tr>
                ) : (
                  recentCompanies.map((company) => (
                    <tr key={company.id} className="table-row">
                      <td className="table-cell font-medium">{company.name}</td>
                      <td className="table-cell">
                        {company.respFiscal?.name?.split(" ")[0] || "N/A"}
                      </td>
                      <td className="table-cell">
                        {company.respDp?.name?.split(" ")[0] || "N/A"}
                      </td>
                      <td className="table-cell">
                        {company.respContabil?.name?.split(" ")[0] || "N/A"}
                      </td>
                      <td className="table-cell text-light-text-secondary dark:text-dark-text-secondary">
                        {company.contractInit
                          ? formatDate(company.contractInit)
                          : "N/A"}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleEditCompany(company)}
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          aria-label="Editar Empresa"
                        >
                          <FiEdit size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
    </ProtectedRoute>
  );
};

export default HomePage;
