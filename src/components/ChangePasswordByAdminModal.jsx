// src/components/ChangePasswordByAdminModal.jsx
"use client";

import { useState } from "react";
import { FiX, FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-toastify";

const ChangePasswordByAdminModal = ({ user, onClose, onSave }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
      toast.error("Por favor, preencha ambos os campos de senha.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    // Adicionar aqui uma validação de complexidade de senha, se desejar.
    // Ex: if(newPassword.length < 8) { toast.error("A senha deve ter no mínimo 8 caracteres."); return; }
    onSave(user.id, newPassword);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-dark-card p-6 rounded shadow-lg w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <FiX size={24} />
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text">
          Alterar Senha para {user.name}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Nova Senha
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded pr-10"
              placeholder="Digite a nova senha"
              required
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-600 dark:text-gray-400"
            >
                {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <div className="mb-6 relative">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Confirmar Nova Senha
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded pr-10"
              placeholder="Confirme a nova senha"
              required
            />
             <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-600 dark:text-gray-400"
            >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 dark:bg-accent-blue text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700"
            >
              Salvar Nova Senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordByAdminModal;