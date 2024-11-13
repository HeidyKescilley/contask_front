// src/app/(auth)/login/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";

const LoginPage = () => {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (user) {
      router.push("/home");
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="flex min-h-screen bg-light-bg dark:bg-dark-bg">
      <div
        className="w-1/2 bg-cover"
        style={{ backgroundImage: "url(/your-image.png)" }}
      >
        {/* Imagem do lado esquerdo */}
      </div>
      <div className="w-1/2 flex items-center justify-center">
        <form
          className="w-full max-w-md bg-white dark:bg-dark-card p-6 rounded shadow"
          onSubmit={handleSubmit}
        >
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" width="150" height="150" alt="Logo" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-card border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu email"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Senha
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-card border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
            />
          </div>
          <button className="w-full bg-accent-blue text-white py-2 rounded-md">
            Entrar
          </button>
          <p className="flex my-2 justify-center text-gray-800 dark:text-dark-text-secondary">
            Não tem uma conta?
            <a href="/register" className="pl-2 underline">
              Clique aqui
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
