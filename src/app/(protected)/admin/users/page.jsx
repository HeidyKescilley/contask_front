// src/app/(protected)/admin/users/page.jsx
"use client";

import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useState, useEffect } from "react";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import { FiEdit, FiTrash2, FiKey } from "react-icons/fi"; // Importado FiKey
import ChangeRoleModal from "../../../../components/ChangeRoleModal";
import ChangePasswordByAdminModal from "../../../../components/ChangePasswordByAdminModal"; // Importado novo modal

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false); // Novo estado
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null); // Novo estado

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.users);
    } catch (error) {
      toast.error("Erro ao buscar usuários.");
    }
  };

  const handleChangeRole = (user) => {
    setSelectedUser(user);
    setShowChangeRoleModal(true);
  };

  const handleSaveRole = async (newRole) => {
    try {
      await api.patch(`/admin/user/${selectedUser.id}/role`, { role: newRole });
      toast.success("Nível do usuário atualizado com sucesso.");
      fetchUsers(); // Atualiza a lista de usuários
      setShowChangeRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error("Erro ao atualizar nível do usuário.");
    }
  };

  const handleCloseModal = () => {
    setShowChangeRoleModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (userId, userName) => {
    if (confirm(`Tem certeza que deseja deletar o usuário ${userName}?`)) {
      try {
        await api.delete(`/admin/user/${userId}`);
        toast.success("Usuário deletado com sucesso.");
        fetchUsers(); // Atualiza a lista de usuários
      } catch (error) {
        toast.error("Erro ao deletar usuário.");
      }
    }
  };

  // Funções para o modal de alterar senha
  const openChangePasswordModal = (user) => {
    // Nova função
    setSelectedUserForPassword(user);
    setShowChangePasswordModal(true);
  };

  const closeChangePasswordModal = () => {
    // Nova função
    setShowChangePasswordModal(false);
    setSelectedUserForPassword(null);
  };

  const handleSaveNewPassword = async (userId, newPassword) => {
    // Nova função
    try {
      await api.patch(`/admin/user/${userId}/change-password`, { newPassword });
      toast.success(
        "Senha do usuário atualizada com sucesso e email de notificação enviado."
      );
      closeChangePasswordModal();
      // Não é necessário refetchUsers() aqui pois a lista de usuários não muda, apenas a senha.
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao atualizar a senha do usuário."
      );
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="w-full px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-black dark:text-dark-text">
          Gestão de Usuários
        </h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-dark-card text-black dark:text-dark-text rounded shadow">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-dark-border">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-dark-border">
                  Departamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-dark-border">
                  Nível
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-dark-border">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <td className="px-4 py-2 whitespace-nowrap text-left">
                    {user.name}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-left">
                    {user.department}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-left">
                    {user.role}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap flex space-x-3">
                    <button
                      onClick={() => handleChangeRole(user)}
                      className="text-blue-500 hover:text-blue-700"
                      aria-label="Alterar Nível do Usuário"
                      title="Alterar Nível"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button // Botão para alterar senha
                      onClick={() => openChangePasswordModal(user)}
                      className="text-orange-500 hover:text-orange-700"
                      aria-label="Alterar Senha do Usuário"
                      title="Alterar Senha"
                    >
                      <FiKey size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Deletar Usuário"
                      title="Deletar Usuário"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Modal para alterar o nível do usuário */}
        {showChangeRoleModal && selectedUser && (
          <ChangeRoleModal
            user={selectedUser}
            onClose={handleCloseModal}
            onSave={handleSaveRole}
          />
        )}
        {/* Modal para alterar a senha do usuário */}
        {showChangePasswordModal &&
          selectedUserForPassword && ( // Renderiza novo modal
            <ChangePasswordByAdminModal
              user={selectedUserForPassword}
              onClose={closeChangePasswordModal}
              onSave={handleSaveNewPassword}
            />
          )}
      </div>
    </ProtectedRoute>
  );
};

export default AdminUsersPage;
