// src/app/(protected)/alert/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";

const AlertPage = () => {
  return (
    <ProtectedRoute>
      <div className="w-full px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text">
          Criar Aviso
        </h1>
        {/* Formulário para criar aviso */}
        <div className="bg-white dark:bg-dark-card p-6 rounded shadow">
          <form>
            <div className="mb-4">
              <label className="block mb-1 text-gray-800 dark:text-dark-text">
                Título
              </label>
              <input
                type="text"
                className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
                placeholder="Título do aviso"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-gray-800 dark:text-dark-text">
                Conteúdo
              </label>
              <textarea
                className="w-full border px-3 py-2 h-32 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
                placeholder="Escreva o conteúdo do aviso aqui..."
                required
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-500 dark:bg-accent-blue text-white px-4 py-2 rounded"
              >
                Publicar
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AlertPage;
