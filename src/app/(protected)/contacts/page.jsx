// src/app/(protected)/contacts/page.jsx
"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import api from "../../../utils/api";
import { toast } from "react-toastify";

const ContactsPage = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      const sortedUsers = response.data.users.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setUsers(sortedUsers);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao buscar os usuários."
      );
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex justify-center">
        <div className="card p-0 overflow-hidden w-full max-w-3xl">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-header">Nome</th>
                  <th className="table-header">Setor</th>
                  <th className="table-header">E-mail</th>
                  <th className="table-header">Ramal</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell font-medium">{user.name}</td>
                    <td className="table-cell">{user.department}</td>
                    <td className="table-cell">{user.email}</td>
                    <td className="table-cell">{user.ramal || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ContactsPage;
