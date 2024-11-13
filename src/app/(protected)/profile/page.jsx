// src/app/(protected)/profile/page.jsx
"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../hooks/useAuth";
import api from "../../../utils/api";
import { toast } from "react-toastify";

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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valida se as senhas novas coincidem se o usuário estiver tentando alterá-la
    if (formData.newPassword || formData.confirmNewPassword) {
      if (formData.newPassword !== formData.confirmNewPassword) {
        toast.error("As novas senhas não conferem!");
        return;
      }
    }

    // Monta objeto para enviar ao backend
    const updateData = {
      ramal: formData.ramal,
    };

    // Se o usuário quiser alterar a senha, incluímos também no update
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

        // Atualiza o estado do formulário com os dados atualizados
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

  if (!user) {
    return null; // Caso o usuário não esteja autenticado
  }

  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg">
        <form
          className="w-full max-w-md bg-white dark:bg-dark-card p-6 rounded shadow"
          onSubmit={handleSubmit}
        >
          <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text">
            Perfil de {user.name}
          </h1>
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Nome
            </label>
            <input
              type="text"
              name="name"
              className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nome completo"
              disabled
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              value={formData.email}
              onChange={handleChange}
              placeholder="Seu email"
              disabled
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Departamento
            </label>
            <input
              type="text"
              name="department"
              className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              value={formData.department}
              onChange={handleChange}
              disabled
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Data de Nascimento
            </label>
            <input
              type="date"
              name="birthday"
              className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              value={formData.birthday}
              onChange={handleChange}
              disabled
            />
          </div>
          {/* Campo Ramal (pode ser editado) */}
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Ramal
            </label>
            <input
              type="text"
              name="ramal"
              className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              value={formData.ramal}
              onChange={handleChange}
              placeholder="Ramal"
            />
          </div>
          <hr className="my-4" />
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text">
            Alterar Senha
          </h2>
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Nova Senha
            </label>
            <input
              type="password"
              name="newPassword"
              className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Nova senha"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              name="confirmNewPassword"
              className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              placeholder="Confirme sua nova senha"
            />
          </div>
          <button className="w-full bg-accent-blue text-white py-2 rounded mt-4">
            Atualizar Perfil
          </button>
          {/* Botão para sair da conta */}
          <div className="flex justify-end mt-4">
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Sair da Conta
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
