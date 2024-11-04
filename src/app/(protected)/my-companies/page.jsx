// src/app/(protected)/my-companies/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";

const MyCompaniesPage = () => {
  return (
    <ProtectedRoute>
      <div className="w-full px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text">
          Minhas Empresas
        </h1>
        {/* Lista das suas empresas */}
        <div className="bg-white dark:bg-dark-card p-6 rounded shadow">
          <p className="text-gray-800 dark:text-dark-text">
            Você não possui empresas atribuídas no momento.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default MyCompaniesPage;
