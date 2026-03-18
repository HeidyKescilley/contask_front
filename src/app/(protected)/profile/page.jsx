// src/app/(protected)/profile/page.jsx
"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../hooks/useAuth";
import api from "../../../utils/api";
import { toast } from "react-toastify";
import { FiUser, FiLock, FiLogOut } from "react-icons/fi";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    birthday: "",
    ramal: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        department: user.department || "",
        birthday: user.birthday ? user.birthday.slice(0, 10) : "",
        ramal: user.ramal || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword || formData.confirmNewPassword) {
      if (formData.newPassword !== formData.confirmNewPassword) {
        toast.error("As novas senhas nao conferem!");
        return;
      }
    }

    const updateData = { ramal: formData.ramal };

    if (formData.newPassword && formData.confirmNewPassword) {
      updateData.password = formData.newPassword;
      updateData.confirmpassword = formData.confirmNewPassword;
    }

    try {
      const response = await api.patch(`/user/edit/${user.id}`, updateData);
      if (response.status === 200) {
        toast.success(
          response.data.message || "Perfil atualizado com sucesso!"
        );
        setFormData((prev) => ({
          ...prev,
          newPassword: "",
          confirmNewPassword: "",
        }));
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao atualizar o perfil."
      );
    }
  };

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="max-w-lg mx-auto">
        <form className="card space-y-5" onSubmit={handleSubmit}>
          {/* Secao: Informacoes Pessoais */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-dark-border">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <FiUser size={18} />
            </div>
            <h2 className="text-base font-semibold">Informacoes Pessoais</h2>
          </div>

          <div>
            <label className="label-base">Nome</label>
            <input
              type="text"
              name="name"
              className="input-base disabled:opacity-60"
              value={formData.name}
              onChange={handleChange}
              disabled
            />
          </div>

          <div>
            <label className="label-base">Email</label>
            <input
              type="email"
              name="email"
              className="input-base disabled:opacity-60"
              value={formData.email}
              onChange={handleChange}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Departamento</label>
              <input
                type="text"
                name="department"
                className="input-base disabled:opacity-60"
                value={formData.department}
                onChange={handleChange}
                disabled
              />
            </div>
            <div>
              <label className="label-base">Data de Nascimento</label>
              <input
                type="date"
                name="birthday"
                className="input-base disabled:opacity-60"
                value={formData.birthday}
                onChange={handleChange}
                disabled
              />
            </div>
          </div>

          <div>
            <label className="label-base">Ramal</label>
            <input
              type="text"
              name="ramal"
              className="input-base"
              value={formData.ramal}
              onChange={handleChange}
              placeholder="Ramal"
            />
          </div>

          {/* Secao: Alterar Senha */}
          <div className="flex items-center gap-3 pt-2 pb-3 border-b border-gray-100 dark:border-dark-border">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <FiLock size={18} />
            </div>
            <h2 className="text-base font-semibold">Alterar Senha</h2>
          </div>

          <div>
            <label className="label-base">Nova Senha</label>
            <input
              type="password"
              name="newPassword"
              className="input-base"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Nova senha"
            />
          </div>

          <div>
            <label className="label-base">Confirmar Nova Senha</label>
            <input
              type="password"
              name="confirmNewPassword"
              className="input-base"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              placeholder="Confirme sua nova senha"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              Atualizar Perfil
            </button>
            <button type="button" onClick={logout} className="btn-danger">
              <FiLogOut size={16} />
              Sair
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
