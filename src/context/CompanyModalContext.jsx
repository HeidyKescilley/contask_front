// src/context/CompanyModalContext.jsx
"use client";

import { createContext, useState } from "react";

export const CompanyModalContext = createContext();

export const CompanyModalProvider = ({ children }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add"); // 'add' ou 'edit'
  const [selectedCompany, setSelectedCompany] = useState(null);

  const openAddCompanyModal = () => {
    setModalType("add");
    setSelectedCompany(null);
    setShowModal(true);
  };

  const openEditCompanyModal = (company) => {
    setModalType("edit");
    setSelectedCompany(company);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCompany(null);
  };

  return (
    <CompanyModalContext.Provider
      value={{
        showModal,
        modalType,
        selectedCompany,
        openAddCompanyModal,
        openEditCompanyModal,
        closeModal,
        setShowModal,
        setModalType,
        setSelectedCompany,
      }}
    >
      {children}
    </CompanyModalContext.Provider>
  );
};
