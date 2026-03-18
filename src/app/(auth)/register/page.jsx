// src/app/(auth)/register/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useRouter } from "next/navigation";

const RegisterPage = () => {
  const { user, register } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    birthday: "",
    department: "",
    ramal: "",
    password: "",
    confirmpassword: "",
  });

  useEffect(() => {
    if (user) {
      router.push("/home");
    }
  }, [user, router]);

  const departments = [
    "Pessoal",
    "Fiscal",
    "Contábil",
    "Processual",
    "Financeiro",
    "Outros",
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(formData);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg p-6">
      <form
        className="w-full max-w-md card p-8 space-y-4"
        onSubmit={handleSubmit}
      >
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold">Registro</h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">
            Crie sua conta para acessar o sistema
          </p>
        </div>

        <div>
          <label className="label-base">Nome</label>
          <input
            type="text"
            name="name"
            className="input-base"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nome completo"
            required
          />
        </div>

        <div>
          <label className="label-base">Email</label>
          <input
            type="email"
            name="email"
            className="input-base"
            value={formData.email}
            onChange={handleChange}
            placeholder="Seu email"
            required
          />
        </div>

        <div>
          <label className="label-base">Data de Nascimento</label>
          <input
            type="date"
            name="birthday"
            className="input-base"
            value={formData.birthday}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="label-base">Departamento</label>
          <select
            name="department"
            className="input-base"
            value={formData.department}
            onChange={handleChange}
            required
          >
            <option value="">Selecione um departamento</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-base">Ramal (opcional)</label>
          <input
            type="text"
            name="ramal"
            className="input-base"
            value={formData.ramal}
            onChange={handleChange}
            placeholder="Ramal"
          />
        </div>

        <div>
          <label className="label-base">Senha</label>
          <input
            type="password"
            name="password"
            className="input-base"
            value={formData.password}
            onChange={handleChange}
            placeholder="Sua senha"
            required
          />
        </div>

        <div>
          <label className="label-base">Confirme a Senha</label>
          <input
            type="password"
            name="confirmpassword"
            className="input-base"
            value={formData.confirmpassword}
            onChange={handleChange}
            placeholder="Confirme sua senha"
            required
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          Registrar
        </button>

        <p className="text-center text-sm text-gray-500 dark:text-dark-text-secondary">
          Já tem uma conta?{" "}
          <a
            href="/login"
            className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
          >
            Faça login
          </a>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
