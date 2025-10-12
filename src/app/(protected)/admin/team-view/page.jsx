// src/app/(protected)/admin/team-view/page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import Loading from "../../../../components/Loading";
import AgentCompaniesView from "../../my-companies/AgentCompaniesView";
import { useAuth } from "../../../../hooks/useAuth";

const TeamViewPage = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // State for filters
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");

  // Fetch all users once on component mount for the filter dropdown
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await api.get("/users"); // Endpoint que retorna todos os usuários
        setAllUsers(res.data.users || []);
      } catch (error) {
        toast.error("Falha ao carregar a lista de usuários para o filtro.");
      }
    };
    fetchAllUsers();
  }, []);

  // Fetch companies whenever a filter changes
  useEffect(() => {
    if (selectedDepartment === "all") {
      setCompanies([]);
      setLoading(false);
      return;
    }

    const fetchCompaniesForView = async () => {
      setLoading(true);
      try {
        const params = {
          department: selectedDepartment,
          userId: selectedUser,
        };
        const res = await api.get("/admin/team-view", { params });
        setCompanies(res.data || []);
      } catch (error) {
        toast.error("Falha ao carregar os dados das empresas.");
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompaniesForView();
  }, [selectedDepartment, selectedUser]);

  // Memoized list of users for the second dropdown, based on the selected department
  const filteredUsers = useMemo(() => {
    if (selectedDepartment === "all") {
      return [];
    }
    return allUsers.filter((user) => user.department === selectedDepartment);
  }, [allUsers, selectedDepartment]);

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setSelectedUser("all"); // Reset user when department changes
  };

  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

  const departments = ["Fiscal", "Pessoal", "Contábil"];

  return (
    <ProtectedRoute requiredPermissions={{ roles: ["admin"] }}>
      <div className="w-full px-8 py-8">
        <div className="bg-white dark:bg-dark-card p-6 rounded shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text">
            Visão de Equipes
          </h1>

          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
            <div>
              <label
                htmlFor="department-filter"
                className="block mb-1 text-gray-800 dark:text-dark-text font-semibold"
              >
                Departamento
              </label>
              <select
                id="department-filter"
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              >
                <option value="all">-- Selecione um Departamento --</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="user-filter"
                className="block mb-1 text-gray-800 dark:text-dark-text font-semibold"
              >
                Usuário
              </label>
              <select
                id="user-filter"
                value={selectedUser}
                onChange={handleUserChange}
                disabled={selectedDepartment === "all"}
                className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">Todos do Departamento</option>
                {filteredUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content Area */}
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
              </div>
            ) : selectedDepartment === "all" ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                Selecione um departamento para começar.
              </p>
            ) : (
              <AgentCompaniesView
                companies={companies}
                user={user} // Passa o usuário admin (necessário para a lógica interna do componente)
                isReadOnly={true} // Ativa o modo somente leitura
                viewDepartment={selectedDepartment} // Informa o departamento em foco
              />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default TeamViewPage;
