// D:\projetos\contask_v2\contask_front\src\app\(protected)\admin\users\page.jsx
"use client";

import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useState, useEffect } from "react";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import { FiEdit, FiTrash2, FiKey } from "react-icons/fi";
import ChangeRoleModal from "../../../../components/ChangeRoleModal";
import ChangePasswordByAdminModal from "../../../../components/ChangePasswordByAdminModal";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      // Ordena os usuários em ordem alfabética pelo nome
      const sortedUsers = response.data.users.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setUsers(sortedUsers);
    } catch (error) {
      toast.error("Erro ao buscar usuários.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Funções para Nível (Role) ---
  const handleChangeRole = (user) => {
    setSelectedUser(user);
    setShowChangeRoleModal(true);
  };
  const handleSaveRole = async (newRole) => {
    try {
      await api.patch(`/admin/user/${selectedUser.id}/role`, { role: newRole });
      toast.success("Nível do usuário atualizado com sucesso.");
      fetchUsers();
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

  // --- Função para Deletar ---
  const handleDeleteUser = async (userId, userName) => {
    if (confirm(`Tem certeza que deseja deletar o usuário ${userName}?`)) {
      try {
        await api.delete(`/admin/user/${userId}`);
        toast.success("Usuário deletado com sucesso.");
        fetchUsers();
      } catch (error) {
        toast.error("Erro ao deletar usuário.");
      }
    }
  };

  // --- Funções para Senha ---
  const openChangePasswordModal = (user) => {
    setSelectedUserForPassword(user);
    setShowChangePasswordModal(true);
  };
  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setSelectedUserForPassword(null);
  };
  const handleSaveNewPassword = async (userId, newPassword) => {
    try {
      await api.patch(`/admin/user/${userId}/change-password`, { newPassword });
      toast.success(
        "Senha do usuário atualizada com sucesso e email de notificação enviado."
      );
      closeChangePasswordModal();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao atualizar a senha do usuário."
      );
    }
  };

  // --- Função para Bônus ---
  const handleToggleBonus = async (userId, currentStatus) => {
    // Feedback visual imediato
    setUsers(
      users.map((u) =>
        u.id === userId ? { ...u, hasBonus: !currentStatus } : u
      )
    );
    try {
      await api.patch(`/admin/user/${userId}/toggle-bonus`);
      toast.success("Status de bônus atualizado!");
      // Opcional: Re-fetch para garantir consistência total, embora o feedback visual já tenha sido dado.
      // fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao alterar status de bônus."
      );
      // Reverte a mudança visual em caso de erro
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, hasBonus: currentStatus } : u
        )
      );
    }
  };

  return (
    <ProtectedRoute requiredPermissions={{ roles: ["admin"] }}>
      <div className="w-full px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-black dark:text-dark-text">
          Gestão de Usuários
        </h1>
        <div className="overflow-x-auto">
          {/* AJUSTE DE DESIGN: adicionado table-fixed e w-full */}
          <table className="min-w-full table-fixed w-full bg-white dark:bg-dark-card text-black dark:text-dark-text rounded shadow">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                {/* AJUSTE DE DESIGN: adicionado classes de largura (w-*) para cada coluna */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/3">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/5">
                  Departamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/5">
                  Nível
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[120px]">
                  Recebe Bônus?
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[120px]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <td className="px-4 py-2 whitespace-nowrap">{user.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {user.department}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{user.role}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-center">
                    {user.department === "Fiscal" ? (
                      <input
                        type="checkbox"
                        checked={user.hasBonus || false}
                        onChange={() =>
                          handleToggleBonus(user.id, user.hasBonus)
                        }
                        className="h-5 w-5 text-accent-blue focus:ring-accent-blue border-gray-300 rounded cursor-pointer"
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap flex space-x-3">
                    <button
                      onClick={() => handleChangeRole(user)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Alterar Nível"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      onClick={() => openChangePasswordModal(user)}
                      className="text-orange-500 hover:text-orange-700"
                      title="Alterar Senha"
                    >
                      <FiKey size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      className="text-red-500 hover:text-red-700"
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
        {/* Modais */}
        {showChangeRoleModal && selectedUser && (
          <ChangeRoleModal
            user={selectedUser}
            onClose={handleCloseModal}
            onSave={handleSaveRole}
          />
        )}
        {showChangePasswordModal && selectedUserForPassword && (
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
