// src/app/(protected)/layout.js

"use client";

import { useEffect, useState, useContext } from "react";
import Sidebar from "../../components/Sidebar";
import { CompanyModalContext } from "../../context/CompanyModalContext";
import CompanyModal from "../../components/CompanyModal";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { SidebarContext } from "../../context/SidebarContext";

export default function ProtectedLayout({ children }) {
  const { isExpanded } = useContext(SidebarContext);

  const { showModal, modalType, selectedCompany, closeModal } =
    useContext(CompanyModalContext);

  const handleSaveCompany = async (companyData) => {
    try {
      if (modalType === "add") {
        await api.post("/company/add", companyData);
        toast.success(`Empresa "${companyData.name}" adicionada com sucesso!`);
      } else if (modalType === "edit") {
        await api.patch(`/company/edit/${companyData.id}`, companyData);
        toast.success(`Empresa "${companyData.name}" atualizada com sucesso!`);
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

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Conteúdo Principal */}
      <div
        className={`flex-1 bg-light-bg dark:bg-dark-bg min-h-screen transition-all duration-200 ease-in-out ${
          isExpanded ? "ml-64" : "ml-20"
        }`}
      >
        {children}
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
    </div>
  );
}
