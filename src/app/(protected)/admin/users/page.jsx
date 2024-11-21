// src/app/(protected)/admin/users/page.jsx
"use client";

import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useState, useEffect } from "react";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import ChangeRoleModal from "../../../../components/ChangeRoleModal";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="w-full px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-black dark:text-dark-text">
          Gestão de Usuários
        </h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-dark-card text-black dark:text-dark-text">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border">
                  Nome
                </th>
                <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border">
                  Departamento
                </th>
                <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border">
                  Nível
                </th>
                <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-400 dark:border-dark-border"
                >
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.department}</td>
                  <td className="px-4 py-2">{user.role}</td>
                  <td className="px-4 py-2 flex space-x-2">
                    <button
                      onClick={() => handleChangeRole(user)}
                      className="text-blue-500"
                      aria-label="Alterar Nível do Usuário"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      className="text-red-500"
                      aria-label="Deletar Usuário"
                    >
                      <FiTrash2 />
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
      </div>
    </ProtectedRoute>
  );
};

export default AdminUsersPage;
