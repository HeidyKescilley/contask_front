// src/components/ChangeRoleModal.jsx
"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";

const ChangeRoleModal = ({ user, onClose, onSave }) => {
  const [selectedRole, setSelectedRole] = useState(user.role || "user");

  const roles = ["user", "not-validated", "admin"];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(selectedRole);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600
            hover:bg-gray-100 dark:hover:bg-dark-card-hover dark:hover:text-dark-text transition-colors"
        >
          <FiX size={20} />
        </button>
        <h2 className="text-xl font-bold mb-5">
          Alterar Nível do Usuário
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-base">Novo Nível</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input-base"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeRoleModal;
