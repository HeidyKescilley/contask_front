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
      {/* Lado esquerdo — imagem de fundo */}
      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: "url(/your-image.png)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 to-primary-800/40" />
        <div className="relative z-10 flex flex-col justify-end h-full p-12 text-white">
          <h1 className="text-4xl font-bold mb-3">Contask</h1>
          <p className="text-lg text-white/80 max-w-md">
            Gerencie suas empresas, tarefas e equipes em um só lugar.
          </p>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <form
          className="w-full max-w-md card p-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="flex justify-center mb-2">
            <Image src="/logo.png" width={120} height={120} alt="Logo" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">
              Bem-vindo de volta
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">
              Faça login para acessar sua conta
            </p>
          </div>

          <div>
            <label className="label-base">Email</label>
            <input
              type="email"
              className="input-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="label-base">Senha</label>
            <input
              type="password"
              className="input-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            Entrar
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-dark-text-secondary">
            Não tem uma conta?{" "}
            <a
              href="/register"
              className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
            >
              Cadastre-se
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
