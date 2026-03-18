// src/app/(protected)/alert/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";
import { FiSend } from "react-icons/fi";

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
    setAllDepartments([
      "Pessoal",
      "Fiscal",
      "Contabil",
      "Processual",
      "Financeiro",
      "Outros",
    ]);
    fetchCompanies();
  }, []);

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
      toast.error("Titulo e conteudo sao obrigatorios.");
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

    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      await api.post("/alerts/create", formData);
      toast.success("Alerta criado e emails enviados com sucesso!");
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
    <ProtectedRoute requiredRole="admin">
      <div className="card max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-base">Titulo</label>
            <input
              type="text"
              className="input-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titulo do alerta"
              required
            />
          </div>

          <div>
            <label className="label-base">Conteudo</label>
            <ReactQuill
              value={content}
              onChange={setContent}
              className="bg-white dark:bg-dark-surface rounded-xl overflow-hidden"
            />
          </div>

          <div>
            <label className="label-base">Anexos</label>
            <input
              type="file"
              multiple
              onChange={(e) => setAttachments(Array.from(e.target.files))}
              className="text-sm text-light-text-secondary dark:text-dark-text-secondary"
            />
          </div>

          <div>
            <label className="label-base">Tipo de Alerta</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-base !w-auto min-w-[200px]"
            >
              <option value="internal">Interno</option>
              <option value="external">Externo</option>
            </select>
          </div>

          {type === "internal" && (
            <div>
              <label className="label-base">Departamentos</label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text-secondary cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={selectAllDepartments}
                  onChange={(e) => {
                    setSelectAllDepartments(e.target.checked);
                    setDepartments(e.target.checked ? allDepartments : []);
                  }}
                />
                Selecionar Todos
              </label>
              {!selectAllDepartments && (
                <div className="grid grid-cols-2 gap-2">
                  {allDepartments.map((dept) => (
                    <label
                      key={dept}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text-secondary cursor-pointer"
                    >
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
                      />
                      {dept}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {type === "external" && (
            <div>
              <label className="label-base">Empresas</label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text-secondary cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={selectAllCompanies}
                  onChange={(e) => {
                    setSelectAllCompanies(e.target.checked);
                    setCompanyIds(
                      e.target.checked ? allCompanies.map((c) => c.id) : []
                    );
                  }}
                />
                Selecionar Todas
              </label>
              {!selectAllCompanies && (
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-dark-border rounded-xl p-3 space-y-1">
                  {allCompanies.map((company) => (
                    <label
                      key={company.id}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text-secondary cursor-pointer"
                    >
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
                      />
                      {company.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary">
              <FiSend size={16} />
              Enviar
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default AlertPage;
