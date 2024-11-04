// src/app/(protected)/profile/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../hooks/useAuth";

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="w-full px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text">
          Perfil de {user.name}
        </h1>
        {/* Detalhes do perfil */}
        <div className="bg-white dark:bg-dark-card p-6 rounded shadow">
          <p className="text-gray-800 dark:text-dark-text">
            Email: {user.email}
          </p>
          {/* Outros detalhes do perfil */}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
