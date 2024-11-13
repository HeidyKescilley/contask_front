// src/app/(protected)/layout.js
"use client";

import { useEffect, useState, useContext } from "react";
import Sidebar from "../../components/Sidebar";
import { CompanyModalContext } from "../../context/CompanyModalContext";
import CompanyModal from "../../components/CompanyModal"; // Atualize o caminho
import api from "../../utils/api";
import { toast } from "react-toastify";

export default function ProtectedLayout({ children }) {
  const [theme, setTheme] = useState("light");

  // Sincroniza o tema com o localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

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
      <Sidebar />
      <div className="flex-1 bg-light-bg dark:bg-dark-bg min-h-screen w-full">
        {children}
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
  );
}
