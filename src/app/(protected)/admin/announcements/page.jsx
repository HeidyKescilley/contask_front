// src/app/(protected)/admin/announcements/page.jsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import {
  FiBell,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEyeOff,
  FiEye,
  FiX,
  FiCheck,
  FiMessageSquare,
} from "react-icons/fi";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const EMPTY_FORM = { title: "", content: "", allowReply: false };

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/announcements");
      setAnnouncements(res.data.announcements || []);
    } catch {
      toast.error("Erro ao carregar avisos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const handleOpenEdit = (announcement) => {
    setEditingId(announcement.id);
    setForm({
      title: announcement.title,
      content: announcement.content,
      allowReply: announcement.allowReply,
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("O título é obrigatório.");
      return;
    }
    if (!form.content || form.content === "<p><br></p>" || !form.content.trim()) {
      toast.error("O conteúdo é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/announcements/${editingId}`, form);
        toast.success("Aviso atualizado com sucesso!");
      } else {
        await api.post("/announcements", form);
        toast.success("Aviso criado com sucesso!");
      }
      handleCloseForm();
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao salvar aviso.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/announcements/${id}/toggle`);
      toast.success(res.data.message);
      fetchAnnouncements();
    } catch {
      toast.error("Erro ao alterar status do aviso.");
    }
  };

  const handleDelete = async (id) => {
    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }
    try {
      await api.delete(`/announcements/${id}`);
      toast.success("Aviso removido.");
      setDeletingId(null);
      fetchAnnouncements();
    } catch {
      toast.error("Erro ao remover aviso.");
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <ProtectedRoute requiredPermissions={{ roles: ["admin"] }}>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-500">
              <FiBell size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-text">
                Avisos
              </h1>
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                Avisos exibidos para todos os usuários ao acessar o sistema
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors"
          >
            <FiPlus size={16} />
            Novo Aviso
          </button>
        </div>

        {/* Formulário de criação/edição */}
        {showForm && (
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800 dark:text-dark-text">
                {editingId ? "Editar aviso" : "Novo aviso"}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
                  dark:hover:bg-dark-card-hover transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Título */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-dark-text-secondary uppercase tracking-wide mb-1.5">
                Título
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex.: Manutenção programada nesta sexta-feira"
                className="w-full rounded-lg border border-gray-200 dark:border-dark-border
                  bg-white dark:bg-dark-surface text-sm text-gray-700 dark:text-dark-text
                  px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400
                  placeholder-gray-400 dark:placeholder-gray-600"
              />
            </div>

            {/* Conteúdo */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-dark-text-secondary uppercase tracking-wide mb-1.5">
                Conteúdo (aceita texto e HTML)
              </label>
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
                <ReactQuill
                  value={form.content}
                  onChange={(val) => setForm((f) => ({ ...f, content: val }))}
                  theme="snow"
                  placeholder="Escreva o conteúdo do aviso..."
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ color: [] }, { background: [] }],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link"],
                      ["clean"],
                    ],
                  }}
                />
              </div>
            </div>

            {/* Permitir resposta */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.allowReply}
                onChange={(e) => setForm((f) => ({ ...f, allowReply: e.target.checked }))}
                className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-dark-text flex items-center gap-1.5">
                  <FiMessageSquare size={14} />
                  Permitir que usuários respondam este aviso
                </span>
                <span className="text-xs text-gray-400 dark:text-dark-text-secondary">
                  As respostas serão enviadas para heidy.franca@contelb.com.br
                </span>
              </div>
            </label>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleCloseForm}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border
                  text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-surface
                  text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg
                  bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                  text-white text-sm font-medium transition-colors"
              >
                <FiCheck size={15} />
                {saving ? "Salvando..." : "Salvar aviso"}
              </button>
            </div>
          </div>
        )}

        {/* Lista de avisos */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-32 text-gray-400">
              Carregando...
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
              <FiBell size={28} />
              <p className="text-sm">Nenhum aviso cadastrado ainda.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border text-left">
                  <th className="px-5 py-3.5 font-semibold text-gray-500 dark:text-dark-text-secondary">
                    Título
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-gray-500 dark:text-dark-text-secondary whitespace-nowrap">
                    Resposta
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-gray-500 dark:text-dark-text-secondary whitespace-nowrap">
                    Criado em
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-gray-500 dark:text-dark-text-secondary">
                    Status
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 dark:text-dark-text-secondary text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-gray-50 dark:border-dark-border last:border-0
                      hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-gray-800 dark:text-dark-text">
                        {a.title}
                      </span>
                      {a.creator && (
                        <span className="block text-xs text-gray-400 mt-0.5">
                          por {a.creator.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {a.allowReply ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                          <FiMessageSquare size={12} /> Sim
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-dark-text-secondary whitespace-nowrap">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                          ${a.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                      >
                        {a.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Editar */}
                        <button
                          onClick={() => handleOpenEdit(a)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50
                            dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <FiEdit2 size={15} />
                        </button>

                        {/* Ativar/Desativar */}
                        <button
                          onClick={() => handleToggle(a.id)}
                          title={a.isActive ? "Desativar" : "Ativar"}
                          className={`p-1.5 rounded-lg transition-colors
                            ${a.isActive
                              ? "text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                              : "text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                            }`}
                        >
                          {a.isActive ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                        </button>

                        {/* Excluir (com confirmação) */}
                        <button
                          onClick={() => handleDelete(a.id)}
                          title={deletingId === a.id ? "Clique novamente para confirmar" : "Excluir"}
                          className={`p-1.5 rounded-lg transition-colors
                            ${deletingId === a.id
                              ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                              : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            }`}
                          onBlur={() => setDeletingId(null)}
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AnnouncementsPage;
