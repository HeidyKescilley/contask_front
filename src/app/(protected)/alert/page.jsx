// src/app/(protected)/alert/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";

// Dynamically import ReactQuill to prevent SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const AlertPage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("internal");
  const [departments, setDepartments] = useState([]);
  const [companyIds, setCompanyIds] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectAllDepartments, setSelectAllDepartments] = useState(false);
  const [selectAllCompanies, setSelectAllCompanies] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchCompanies();
  }, []);

  const fetchDepartments = async () => {
    // Assuming departments are predefined
    setAllDepartments([
      "Pessoal",
      "Fiscal",
      "Contábil",
      "Processual",
      "Financeiro",
      "Outros",
    ]);
  };

  const fetchCompanies = async () => {
    try {
      const res = await api.get("/company/all");
      setAllCompanies(res.data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !content) {
      toast.error("Título e conteúdo são obrigatórios.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("type", type);

    if (type === "internal") {
      formData.append(
        "departments",
        JSON.stringify(selectAllDepartments ? allDepartments : departments)
      );
    } else if (type === "external") {
      formData.append(
        "companyIds",
        JSON.stringify(
          selectAllCompanies ? allCompanies.map((c) => c.id) : companyIds
        )
      );
    }

    // Append attachments
    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      await api.post("/alerts/create", formData);
      toast.success("Alerta criado e emails enviados com sucesso!");
      // Reset form
      setTitle("");
      setContent("");
      setDepartments([]);
      setCompanyIds([]);
      setAttachments([]);
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error(error.response?.data?.message || "Erro ao criar o alerta.");
    }
  };

  return (
    <ProtectedRoute>
      <div className="w-full px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text">
          Criar Alerta
        </h1>
        {/* Formulário para criar alerta */}
        <div className="bg-white dark:bg-dark-card p-6 rounded shadow">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 text-gray-800 dark:text-dark-text">
                Título
              </label>
              <input
                type="text"
                className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do alerta"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-gray-800 dark:text-dark-text">
                Conteúdo
              </label>
              <ReactQuill
                value={content}
                onChange={setContent}
                className="bg-white dark:bg-dark-bg text-gray-800 dark:text-dark-text"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-gray-800 dark:text-dark-text">
                Anexos
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setAttachments(Array.from(e.target.files))}
                className="w-full"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-gray-800 dark:text-dark-text">
                Tipo de Alerta
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              >
                <option value="internal">Interno</option>
                <option value="external">Externo</option>
              </select>
            </div>
            {type === "internal" && (
              <div className="mb-4">
                <label className="block mb-1 text-gray-800 dark:text-dark-text">
                  Departamentos
                </label>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectAllDepartments}
                    onChange={(e) => {
                      setSelectAllDepartments(e.target.checked);
                      if (e.target.checked) {
                        setDepartments(allDepartments);
                      } else {
                        setDepartments([]);
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-gray-800 dark:text-dark-text">
                    Selecionar Todos
                  </span>
                </div>
                {!selectAllDepartments && (
                  <div className="grid grid-cols-2 gap-2">
                    {allDepartments.map((dept) => (
                      <label key={dept} className="flex items-center">
                        <input
                          type="checkbox"
                          value={dept}
                          checked={departments.includes(dept)}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDepartments((prev) =>
                              prev.includes(value)
                                ? prev.filter((d) => d !== value)
                                : [...prev, value]
                            );
                          }}
                          className="mr-2"
                        />
                        <span className="text-gray-800 dark:text-dark-text">
                          {dept}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            {type === "external" && (
              <div className="mb-4">
                <label className="block mb-1 text-gray-800 dark:text-dark-text">
                  Empresas
                </label>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectAllCompanies}
                    onChange={(e) => {
                      setSelectAllCompanies(e.target.checked);
                      if (e.target.checked) {
                        setCompanyIds(allCompanies.map((c) => c.id));
                      } else {
                        setCompanyIds([]);
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-gray-800 dark:text-dark-text">
                    Selecionar Todas
                  </span>
                </div>
                {!selectAllCompanies && (
                  <div className="max-h-64 overflow-y-scroll border p-2 bg-gray-100 dark:bg-dark-bg">
                    {allCompanies.map((company) => (
                      <label key={company.id} className="flex items-center">
                        <input
                          type="checkbox"
                          value={company.id}
                          checked={companyIds.includes(company.id)}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setCompanyIds((prev) =>
                              prev.includes(value)
                                ? prev.filter((id) => id !== value)
                                : [...prev, value]
                            );
                          }}
                          className="mr-2"
                        />
                        <span className="text-gray-800 dark:text-dark-text">
                          {company.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-500 dark:bg-accent-blue text-white px-4 py-2 rounded"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AlertPage;
