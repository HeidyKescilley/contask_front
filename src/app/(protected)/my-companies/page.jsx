// src/app/(protected)/my-companies/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";

const MyCompaniesPage = () => {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Minhas Empresas</h1>
        {/* Lista das suas empresas */}
      </div>
    </ProtectedRoute>
  );
};

export default MyCompaniesPage;
