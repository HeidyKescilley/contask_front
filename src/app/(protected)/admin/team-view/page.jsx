// src/app/(protected)/admin/team-view/page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import AgentCompaniesView from "../../my-companies/AgentCompaniesView";
import { useAuth } from "../../../../hooks/useAuth";

const TeamViewPage = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await api.get("/users");
        setAllUsers(res.data.users || []);
      } catch (error) {
        toast.error("Falha ao carregar a lista de usuarios para o filtro.");
      }
    };
    fetchAllUsers();
  }, []);

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

  const filteredUsers = useMemo(() => {
    if (selectedDepartment === "all") return [];
    return allUsers.filter((user) => user.department === selectedDepartment);
  }, [allUsers, selectedDepartment]);

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setSelectedUser("all");
  };

  const departments = ["Fiscal", "Pessoal", "Contabil"];

  return (
    <ProtectedRoute requiredPermissions={{ roles: ["admin"] }}>
      <div className="card mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          <div>
            <label htmlFor="department-filter" className="label-base">
              Departamento
            </label>
            <select
              id="department-filter"
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              className="input-base"
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
            <label htmlFor="user-filter" className="label-base">
              Usuario
            </label>
            <select
              id="user-filter"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              disabled={selectedDepartment === "all"}
              className="input-base disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>

      <div>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-10 h-10 rounded-full border-[3px] border-gray-200 dark:border-dark-border border-t-primary-500 animate-spin" />
          </div>
        ) : selectedDepartment === "all" ? (
          <div className="card text-center py-10">
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              Selecione um departamento para comecar.
            </p>
          </div>
        ) : (
          <AgentCompaniesView
            companies={companies}
            user={user}
            isReadOnly={true}
            viewDepartment={selectedDepartment}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default TeamViewPage;
