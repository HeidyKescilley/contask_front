// src/components/CompanyModal.jsx

"use client";

import CompanyForm from "./CompanyForm";

const CompanyModal = ({ type, company, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 dark:text-white">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-2xl">
        <CompanyForm
          initialData={company}
          onCancel={onClose}
          onSubmit={onSave}
          type={type}
        />
      </div>
    </div>
  );
};

export default CompanyModal;
