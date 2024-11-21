// src/app/(protected)/unauthorized/page.jsx
"use client";

import { useRouter } from "next/navigation";

const UnauthorizedPage = () => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg">
      <div className="bg-white dark:bg-dark-card p-6 rounded shadow text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-dark-text">
          Acesso Negado
        </h1>
        <p className="mb-4 text-gray-800 dark:text-dark-text">
          Você não tem permissão para acessar esta página.
        </p>
        <button
          onClick={() => router.push("/home")}
          className="bg-accent-blue text-white px-4 py-2 rounded"
        >
          Voltar para a Home
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
