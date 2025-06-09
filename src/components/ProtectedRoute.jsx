// src/components/ProtectedRoute.jsx
"use client";

import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "./Loading";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Se não houver usuário, redireciona para login
        router.push("/login");
      } else {
        // Se houver requiredRole, verifica a permissão
        if (requiredRole) {
          let hasPermission = false;

          if (Array.isArray(requiredRole)) {
            // Verifica se a role do usuário está na lista de roles permitidas
            hasPermission = requiredRole.includes(user.role);

            // Adiciona verificação para departamento "fiscal" se "fiscal" estiver entre as roles necessárias
            if (
              requiredRole.includes("fiscal") &&
              user.department === "Fiscal"
            ) {
              hasPermission = true;
            }
          } else {
            // Se requiredRole é uma string (role única)
            hasPermission = user.role === requiredRole;
            if (requiredRole === "fiscal" && user.department === "Fiscal") {
              hasPermission = true;
            }
          }

          if (!hasPermission) {
            router.push("/unauthorized"); // Redireciona se não tiver permissão
          }
        }
      }
    }
  }, [user, loading, router, requiredRole]);

  if (loading) {
    return <Loading />;
  }

  // Se não houver usuário ou se não tiver permissão, retorna null (redirecionamento já está no useEffect)
  if (!user) return null;

  if (requiredRole) {
    let hasPermission = false;
    if (Array.isArray(requiredRole)) {
      hasPermission = requiredRole.includes(user.role);
      if (requiredRole.includes("fiscal") && user.department === "Fiscal") {
        hasPermission = true;
      }
    } else {
      hasPermission = user.role === requiredRole;
      if (requiredRole === "fiscal" && user.department === "Fiscal") {
        hasPermission = true;
      }
    }
    if (!hasPermission) return null;
  }

  return children;
};

export default ProtectedRoute;
