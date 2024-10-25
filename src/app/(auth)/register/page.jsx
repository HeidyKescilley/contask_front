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
    <div className="flex items-center justify-center min-h-screen">
      <form className="w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Registro</h2>
        {/* Campos do formulário */}
        <div className="mb-4">
          <label className="block mb-1 dark:text-white">Nome</label>
          <input
            type="text"
            name="name"
            className="w-full border px-3 py-2"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        {/* Email */}
        <div className="mb-4">
          <label className="block mb-1 dark:text-white">Email</label>
          <input
            type="email"
            name="email"
            className="w-full border px-3 py-2"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        {/* Data de Nascimento */}
        <div className="mb-4">
          <label className="block mb-1 dark:text-white">
            Data de Nascimento
          </label>
          <input
            type="date"
            name="birthday"
            className="w-full border px-3 py-2"
            value={formData.birthday}
            onChange={handleChange}
            required
          />
        </div>
        {/* Departamento */}
        <div className="mb-4">
          <label className="block mb-1 dark:text-white">Departamento</label>
          <select
            name="department"
            className="w-full border px-3 py-2"
            value={formData.department}
            onChange={handleChange}
            required
          >
            <option value="">Selecione</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        {/* Senha */}
        <div className="mb-4">
          <label className="block mb-1 dark:text-white">Senha</label>
          <input
            type="password"
            name="password"
            className="w-full border px-3 py-2"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        {/* Confirmação de Senha */}
        <div className="mb-4">
          <label className="block mb-1 dark:text-white">Confirme a Senha</label>
          <input
            type="password"
            name="confirmpassword"
            className="w-full border px-3 py-2"
            value={formData.confirmpassword}
            onChange={handleChange}
            required
          />
        </div>
        <button className="w-full bg-green-500 text-white py-2">
          Registrar
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
