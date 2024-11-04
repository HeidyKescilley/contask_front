// src/app/(protected)/home/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";

const HomePage = () => {
  return (
    <ProtectedRoute>
      <div className="w-full px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text">
          Home
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="bg-white dark:bg-dark-card p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-dark-text">
              Últimas Empresas Suspensas, Baixadas ou Distratadas
            </h2>
            {/* Conteúdo */}
          </div>
          {/* Card 2 */}
          <div className="bg-white dark:bg-dark-card p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-dark-text">
              Últimas Empresas Liberadas
            </h2>
            {/* Conteúdo */}
          </div>
          {/* Card 3 */}
          <div className="bg-white dark:bg-dark-card p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-dark-text">
              Novas Empresas
            </h2>
            {/* Conteúdo */}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default HomePage;
