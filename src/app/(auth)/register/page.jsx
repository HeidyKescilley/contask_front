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

  // Redireciona se já estiver autenticado
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
    <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg">
      <form
        className="w-full max-w-md bg-white dark:bg-dark-card p-6 rounded shadow"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-dark-text">
          Registro
        </h2>
        {/* Campos do formulário */}
        <div className="mb-4">
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Nome
          </label>
          <input
            type="text"
            name="name"
            className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-card border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nome completo"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Email
          </label>
          <input
            type="email"
            name="email"
            className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-card border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.email}
            onChange={handleChange}
            placeholder="Seu email"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Data de Nascimento
          </label>
          <input
            type="date"
            name="birthday"
            className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-card border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.birthday}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Departamento
          </label>
          <select
            name="department"
            className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-card border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
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
        {/* Campo Ramal (opcional) */}
        <div className="mb-4">
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Ramal (opcional)
          </label>
          <input
            type="text"
            name="ramal"
            className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-card border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.ramal}
            onChange={handleChange}
            placeholder="Ramal"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Senha
          </label>
          <input
            type="password"
            name="password"
            className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-card border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.password}
            onChange={handleChange}
            placeholder="Sua senha"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Confirme a Senha
          </label>
          <input
            type="password"
            name="confirmpassword"
            className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-dark-card border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.confirmpassword}
            onChange={handleChange}
            placeholder="Confirme sua senha"
            required
          />
        </div>
        <button className="w-full bg-accent-blue text-white py-2 rounded">
          Registrar
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
