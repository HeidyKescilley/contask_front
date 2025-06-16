// src/components/ProtectedRoute.jsx
"use client";

import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "./Loading";

// Função auxiliar para verificar permissões de forma clara e correta
const hasRequiredPermission = (user, permissions) => {
  // Se não há permissões requeridas, permite o acesso
  if (!permissions) {
    return true;
  }

  const { roles = [], departments = [] } = permissions;

  // Se o usuário tiver a ROLE necessária, concede permissão
  if (roles.length > 0 && roles.includes(user.role)) {
    return true;
  }

  // Se o usuário tiver o DEPARTMENT necessário, concede permissão
  if (departments.length > 0 && departments.includes(user.department)) {
    return true;
  }

  // Se nenhuma das condições for atendida, nega o acesso
  return false;
};

const ProtectedRoute = ({ children, requiredPermissions }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Aguarda o carregamento do usuário
    }

    if (!user) {
      router.push("/login");
      return;
    }

    // Agora usa a nova função de verificação
    if (
      requiredPermissions &&
      !hasRequiredPermission(user, requiredPermissions)
    ) {
      router.push("/unauthorized");
    }
  }, [user, loading, router, requiredPermissions]);

  if (loading || !user) {
    return <Loading />;
  }

  // Verificação final antes de renderizar
  if (
    requiredPermissions &&
    !hasRequiredPermission(user, requiredPermissions)
  ) {
    return null; // O useEffect já está redirecionando
  }

  return children;
};

export default ProtectedRoute;
