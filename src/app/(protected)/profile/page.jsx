// src/app/(protected)/profile/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../hooks/useAuth";

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Perfil de {user.name}</h1>
        {/* Detalhes do perfil */}
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
