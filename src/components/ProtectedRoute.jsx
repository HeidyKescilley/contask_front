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
        router.push("/login");
      } else if (requiredRole && user.role !== requiredRole) {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, router, requiredRole]);

  if (loading) {
    return <Loading />;
  }

  return user && (!requiredRole || user.role === requiredRole)
    ? children
    : null;
};

export default ProtectedRoute;
