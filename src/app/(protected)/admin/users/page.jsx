// src/app/(protected)/admin/users/page.jsx
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
      const sortedUsers = response.data.users.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setUsers(sortedUsers);
    } catch (error) {
      toast.error("Erro ao buscar usuarios.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangeRole = (user) => {
    setSelectedUser(user);
    setShowChangeRoleModal(true);
  };
  const handleSaveRole = async (newRole) => {
    try {
      await api.patch(`/admin/user/${selectedUser.id}/role`, { role: newRole });
      toast.success("Nivel do usuario atualizado com sucesso.");
      fetchUsers();
      setShowChangeRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error("Erro ao atualizar nivel do usuario.");
    }
  };
  const handleCloseModal = () => {
    setShowChangeRoleModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (userId, userName) => {
    if (confirm(`Tem certeza que deseja deletar o usuario ${userName}?`)) {
      try {
        await api.delete(`/admin/user/${userId}`);
        toast.success("Usuario deletado com sucesso.");
        fetchUsers();
      } catch (error) {
        toast.error("Erro ao deletar usuario.");
      }
    }
  };

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
      toast.success("Senha do usuario atualizada com sucesso.");
      closeChangePasswordModal();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao atualizar a senha do usuario."
      );
    }
  };

  const handleToggleBonus = async (userId, currentStatus) => {
    setUsers(
      users.map((u) =>
        u.id === userId ? { ...u, hasBonus: !currentStatus } : u
      )
    );
    try {
      await api.patch(`/admin/user/${userId}/toggle-bonus`);
      toast.success("Status de bonus atualizado!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao alterar status de bonus."
      );
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, hasBonus: currentStatus } : u
        )
      );
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
      user: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
      "not-validated": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[role] || "bg-gray-100 text-gray-700"
        }`}
      >
        {role}
      </span>
    );
  };

  return (
    <ProtectedRoute requiredPermissions={{ roles: ["admin"] }}>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead>
              <tr>
                <th className="table-header w-1/3">Nome</th>
                <th className="table-header w-1/5">Departamento</th>
                <th className="table-header w-1/5">Nivel</th>
                <th className="table-header w-[120px] text-center">Bonus</th>
                <th className="table-header w-[120px]">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="table-row">
                  <td className="table-cell font-medium">{user.name}</td>
                  <td className="table-cell">{user.department}</td>
                  <td className="table-cell">{getRoleBadge(user.role)}</td>
                  <td className="table-cell text-center">
                    {["Fiscal", "Pessoal", "Contabil"].includes(
                      user.department
                    ) ? (
                      <input
                        type="checkbox"
                        checked={user.hasBonus || false}
                        onChange={() =>
                          handleToggleBonus(user.id, user.hasBonus)
                        }
                        className="cursor-pointer"
                      />
                    ) : (
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">
                        -
                      </span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleChangeRole(user)}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Alterar Nivel"
                      >
                        <FiEdit size={15} />
                      </button>
                      <button
                        onClick={() => openChangePasswordModal(user)}
                        className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                        title="Alterar Senha"
                      >
                        <FiKey size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Deletar Usuario"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
    </ProtectedRoute>
  );
};

export default AdminUsersPage;
