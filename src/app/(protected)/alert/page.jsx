// src/app/(protected)/alert/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";

const AlertPage = () => {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Criar Aviso</h1>
        {/* Formulário para criar aviso */}
      </div>
    </ProtectedRoute>
  );
};

export default AlertPage;
