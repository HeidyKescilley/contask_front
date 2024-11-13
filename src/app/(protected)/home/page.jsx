// src/app/(protected)/home/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useState, useEffect, useContext } from "react";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/utils";
import { CompanyModalContext } from "../../../context/CompanyModalContext";
import CompanyModal from "../../../components/CompanyModal";
import { toast } from "react-toastify";
import { FiEdit } from "react-icons/fi"; // Importação do ícone de edição

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
      // Buscar os dados completos da empresa
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
      fetchRecentCompanies(); // Atualiza os dados após a edição
      closeModal();
    } catch (error) {
      toast.error(
        `Erro ao salvar a empresa: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  return (
    <ProtectedRoute>
      <div className="w-full px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-black dark:text-dark-text">
          Home
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="bg-white dark:bg-dark-card rounded shadow-md">
            <div className="bg-logo-light-blue dark:bg-dark-card p-4 rounded-t">
              <h2 className="text-xl font-semibold text-white dark:text-dark-text">
                Últimas Empresas Suspensas, Baixadas ou Distratadas
              </h2>
            </div>
            <div className="p-6">
              {/* Tabela */}
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left text-black dark:text-dark-text border-b border-gray-400">
                      Empresa
                    </th>
                    <th className="text-left text-black dark:text-dark-text border-b border-gray-400">
                      Status
                    </th>
                    <th className="text-left text-black dark:text-dark-text border-b border-gray-400">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentStatusChanges.map((company) => (
                    <tr key={company.id}>
                      <td className="text-black dark:text-dark-text border-b border-gray-400 px-4 py-2">
                        {company.name}
                      </td>
                      <td className="text-black dark:text-dark-text border-b border-gray-400 px-4 py-2">
                        {company.status}
                      </td>
                      <td className="text-black dark:text-dark-text border-b border-gray-400 px-4 py-2">
                        {formatDate(company.statusUpdatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-white dark:bg-dark-card rounded shadow-md">
            <div className="bg-logo-light-blue dark:bg-dark-card p-4 rounded-t">
              <h2 className="text-xl font-semibold text-white dark:text-dark-text">
                Últimas Empresas Liberadas
              </h2>
            </div>
            <div className="p-6">
              {/* Tabela */}
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left text-black dark:text-dark-text border-b border-gray-400">
                      Empresa
                    </th>
                    <th className="text-left text-black dark:text-dark-text border-b border-gray-400">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentActiveCompanies.map((company) => (
                    <tr key={company.id}>
                      <td className="text-black dark:text-dark-text border-b border-gray-400 px-4 py-2">
                        {company.name}
                      </td>
                      <td className="text-black dark:text-dark-text border-b border-gray-400 px-4 py-2">
                        {formatDate(company.statusUpdatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Card 3 */}
          <div className="bg-white dark:bg-dark-card rounded shadow-md md:col-span-2">
            <div className="bg-logo-light-blue dark:bg-dark-card p-4 rounded-t">
              <h2 className="text-xl font-semibold text-white dark:text-dark-text">
                Novas Empresas
              </h2>
            </div>
            <div className="p-6">
              {/* Tabela */}
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left text-black dark:text-dark-text border-b border-gray-400">
                      Empresa
                    </th>
                    <th className="text-left text-black dark:text-dark-text border-b border-gray-400">
                      Resp. Fiscal
                    </th>
                    <th className="text-left text-black dark:text-dark-text border-b border-gray-400">
                      Resp. DP
                    </th>
                    <th className="text-left text-black dark:text-dark-text border-b border-gray-400">
                      Resp. Contábil
                    </th>
                    <th className="text-left text-black dark:text-dark-text border-b border-gray-400">
                      Data de Início
                    </th>
                    <th className="text-left text-black dark:text-dark-text border-b border-gray-400">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentCompanies.map((company) => (
                    <tr key={company.id}>
                      <td className="text-black dark:text-dark-text border-b border-gray-400 px-4 py-2">
                        {company.name}
                      </td>
                      <td className="text-black dark:text-dark-text border-b border-gray-400 px-4 py-2">
                        {company.respFiscal?.name || "não atribuído"}
                      </td>
                      <td className="text-black dark:text-dark-text border-b border-gray-400 px-4 py-2">
                        {company.respDp?.name || "não atribuído"}
                      </td>
                      <td className="text-black dark:text-dark-text border-b border-gray-400 px-4 py-2">
                        {company.respContabil?.name || "não atribuído"}
                      </td>
                      <td className="text-black dark:text-dark-text border-b border-gray-400 px-4 py-2">
                        {company.contractInit
                          ? formatDate(company.contractInit)
                          : "N/A"}
                      </td>
                      <td className="border-b border-gray-400 px-4 py-2">
                        <button
                          onClick={() => handleEditCompany(company)}
                          className="text-green-500 dark:text-accent-green"
                          aria-label="Editar Empresa"
                        >
                          <FiEdit />
                        </button>
                      </td>
                    </tr>
                  ))}
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
      </div>
    </ProtectedRoute>
  );
};

export default HomePage;
