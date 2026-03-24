// src/app/(protected)/layout.js
"use client";

import { useContext, useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import PageHeader from "../../components/PageHeader";
import { CompanyModalContext } from "../../context/CompanyModalContext";
import CompanyModal from "../../components/CompanyModal";
import BirthdayModal from "../../components/BirthdayModal";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { SidebarContext } from "../../context/SidebarContext";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedLayout({ children }) {
  const { isExpanded } = useContext(SidebarContext);
  const { user } = useAuth();
  const [birthdayUsers, setBirthdayUsers] = useState([]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/birthday/today")
      .then((res) => setBirthdayUsers(res.data.birthdayUsers || []))
      .catch(() => {});
  }, [user]);

  const handleDismissBirthday = (userId) => {
    setBirthdayUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const { showModal, modalType, selectedCompany, closeModal, triggerRefresh } =
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
      triggerRefresh();
    } catch (error) {
      toast.error(
        `Erro ao salvar a empresa: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main
        className={`flex-1 bg-light-bg dark:bg-dark-bg min-h-screen
          transition-[margin] duration-300 ease-in-out
          ${isExpanded ? "ml-64" : "ml-[60px]"}`}
      >
        {/* Inner scroll container for content */}
        <div className="p-4 md:p-5 min-w-0">
          <PageHeader />
          {children}
        </div>
      </main>

      {showModal && (
        <CompanyModal
          type={modalType}
          company={selectedCompany}
          onClose={closeModal}
          onSave={handleSaveCompany}
        />
      )}

      {birthdayUsers.length > 0 && (
        <BirthdayModal
          birthdayUsers={birthdayUsers}
          onDismiss={handleDismissBirthday}
        />
      )}
    </div>
  );
}
