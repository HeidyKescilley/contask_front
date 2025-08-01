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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl bg-white dark:bg-dark-card p-6 rounded shadow">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text text-center">
            Contatos Internos
          </h1>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-dark-card text-black dark:text-dark-text">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
                    Nome
                  </th>
                  <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
                    Setor
                  </th>
                  <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
                    E-mail
                  </th>
                  <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
                    Ramal
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-400 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                  >
                    <td className="px-4 py-2 text-left">{user.name}</td>
                    <td className="px-4 py-2 text-left">{user.department}</td>
                    <td className="px-4 py-2 text-left">{user.email}</td>
                    <td className="px-4 py-2 text-left">
                      {user.ramal || "N/A"}
                    </td>
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
