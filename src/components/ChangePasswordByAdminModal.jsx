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
    onSave(user.id, newPassword);
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
          Alterar Senha para {user.name}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="label-base">Nova Senha</label>
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-base pr-10"
              placeholder="Digite a nova senha"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600
                dark:hover:text-dark-text transition-colors"
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <div className="relative">
            <label className="label-base">Confirmar Nova Senha</label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="input-base pr-10"
              placeholder="Confirme a nova senha"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600
                dark:hover:text-dark-text transition-colors"
            >
              {showConfirmPassword ? (
                <FiEyeOff size={18} />
              ) : (
                <FiEye size={18} />
              )}
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Salvar Nova Senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordByAdminModal;
