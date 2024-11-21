// src/context/AuthContext.jsx
"use client";

import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import api from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Estado de carregamento

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      fetchUserData(decoded.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const response = await api.get(`/user/${userId}`);
      if (response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });
      const { token } = res.data;
      localStorage.setItem("token", token);
      const decoded = jwtDecode(token);

      toast.success(
        `Bem-vindo, ${decoded.name}! Você foi autenticado com sucesso.`
      );

      await fetchUserData(decoded.id);

      router.push("/home");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Erro ao fazer login.";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      await axios.post("http://localhost:5000/register", userData);
      toast.success("Usuário registrado com sucesso!");
      router.push("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao registrar.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
    toast.info("Você saiu da sua conta.");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
