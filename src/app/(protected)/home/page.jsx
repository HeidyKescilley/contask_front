// src/app/(protected)/home/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";

const HomePage = () => {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Home</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="bg-white dark:bg-gray-700 dark:text-white p-6 rounded shadow ">
            <h2 className="text-xl font-semibold mb-2">
              Últimas Empresas Suspensas, Baixadas ou Distratadas
            </h2>
            {/* Conteúdo */}
          </div>
          {/* Card 2 */}
          <div className="bg-white dark:bg-gray-700 dark:text-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">
              Últimas Empresas Liberadas
            </h2>
            {/* Conteúdo */}
          </div>
          {/* Card 3 */}
          <div className="bg-white dark:bg-gray-700 dark:text-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Novas Empresas</h2>
            {/* Conteúdo */}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default HomePage;
