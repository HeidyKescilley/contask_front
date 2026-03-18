// src/components/CompanyModal.jsx

"use client";

import CompanyForm from "./CompanyForm";

const CompanyModal = ({ type, company, onClose, onSave }) => {
  return (
    <div className="modal-overlay px-4 py-6" onClick={onClose}>
      <div
        className="modal-box w-full max-w-5xl overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
      >
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
