"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import {
  FiX, FiPlus, FiEdit2, FiTrash2, FiBookOpen, FiAlertCircle, FiCalendar,
} from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";

const DEPARTMENTS = ["Fiscal", "Pessoal", "Contábil", "Geral"];

const DEPT_COLORS = {
  Fiscal:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Pessoal:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Contábil: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Geral:    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

function formatDateBR(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function isDateOverdue(dateStr) {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr <= today;
}

// ── Formulário de nova/edição ───────────────────────────────────────────────
function OrientationForm({ defaultDepartment, onCancel, onSaved, editData }) {
  const [content, setContent] = useState(editData?.content || "");
  const [department, setDepartment] = useState(editData?.department || defaultDepartment || "Fiscal");
  const [reminderDate, setReminderDate] = useState(editData?.reminderDate || "");
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData;

  const handleSave = async (companyId) => {
    if (!content.trim()) { toast.error("Informe o conteúdo da orientação."); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/orientation/${editData.id}`, { content, reminderDate: reminderDate || null });
        toast.success("Orientação atualizada!");
      } else {
        await api.post(`/orientation/company/${companyId}`, { department, content, reminderDate: reminderDate || null });
        toast.success("Orientação adicionada!");
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao salvar orientação.");
    } finally {
      setSaving(false);
    }
  };

  return { content, setContent, department, setDepartment, reminderDate, setReminderDate, saving, handleSave, isEdit };
}

// ── Modal principal ────────────────────────────────────────────────────────
export default function OrientationsModal({ company, onClose }) {
  const { user } = useContext(AuthContext);
  const [orientations, setOrientations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(user?.department || "Fiscal");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formContent, setFormContent] = useState("");
  const [formDept, setFormDept] = useState(user?.department || "Fiscal");
  const [formReminder, setFormReminder] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchOrientations = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/orientation/company/${company.id}`);
      setOrientations(res.data || []);
    } catch {
      toast.error("Erro ao carregar orientações.");
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => { fetchOrientations(); }, [fetchOrientations]);

  // "Geral" aparece em todas as abas; "Todos" mostra tudo
  const visibleOrientations = activeTab === "Todos"
    ? orientations
    : orientations.filter((o) => o.department === activeTab || o.department === "Geral");

  const handleSaveNew = async () => {
    if (!formContent.trim()) { toast.error("Informe o conteúdo da orientação."); return; }
    setSaving(true);
    try {
      await api.post(`/orientation/company/${company.id}`, {
        department: formDept,
        content: formContent,
        reminderDate: formReminder || null,
      });
      toast.success("Orientação adicionada!");
      setFormContent("");
      setFormReminder("");
      setFormDept(user?.department || "Fiscal");
      setShowForm(false);
      fetchOrientations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (orientation) => {
    if (!formContent.trim()) { toast.error("Informe o conteúdo."); return; }
    setSaving(true);
    try {
      await api.patch(`/orientation/${orientation.id}`, {
        content: formContent,
        reminderDate: formReminder || null,
      });
      toast.success("Orientação atualizada!");
      setEditingId(null);
      fetchOrientations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao atualizar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deseja excluir esta orientação?")) return;
    try {
      await api.delete(`/orientation/${id}`);
      toast.success("Orientação excluída.");
      setOrientations((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao excluir.");
    }
  };

  const canModify = (orientation) =>
    user?.id === orientation.createdById || user?.role === "admin";

  const startEdit = (orientation) => {
    setEditingId(orientation.id);
    setFormContent(orientation.content);
    setFormReminder(orientation.reminderDate || "");
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormContent("");
    setFormReminder("");
  };

  const tabs = ["Todos", ...DEPARTMENTS];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiBookOpen size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-dark-text leading-tight">
                Orientações
              </h2>
              <p className="text-xs text-gray-400 dark:text-dark-text-secondary mt-0.5 truncate max-w-xs" title={company?.name}>
                {company?.name?.length > 50 ? company.name.slice(0, 50) + "…" : company?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setShowForm((v) => !v); setEditingId(null); }}
              className="btn-primary text-xs flex items-center gap-1"
              title="Nova orientação"
            >
              <FiPlus size={13} />
              Nova
            </button>
            <button onClick={onClose} className="btn-ghost !p-1.5">
              <FiX size={15} />
            </button>
          </div>
        </div>

        {/* Formulário de nova orientação */}
        {showForm && (
          <div className="bg-gray-50 dark:bg-dark-surface rounded-xl p-4 mb-4 space-y-3 border border-gray-200 dark:border-dark-border">
            <p className="text-xs font-semibold text-gray-600 dark:text-dark-text-secondary uppercase tracking-wide">
              Nova Orientação
            </p>
            <div>
              <label className="label-base mb-1">Departamento</label>
              <select value={formDept} onChange={(e) => setFormDept(e.target.value)} className="input-base w-full">
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base mb-1">Orientação / Lembrete</label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={3}
                placeholder="Ex: A empresa gerou crédito por pagamento em duplicidade — verificar antes de enviar guia ao cliente."
                className="input-base w-full resize-none"
              />
            </div>
            <div>
              <label className="label-base mb-1">
                <FiCalendar size={11} className="inline mr-1" />
                Data de Lembrete (opcional)
              </label>
              <input
                type="date"
                value={formReminder}
                onChange={(e) => setFormReminder(e.target.value)}
                className="input-base w-48"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowForm(false); setFormContent(""); setFormReminder(""); }} className="btn-secondary text-xs">
                Cancelar
              </button>
              <button onClick={handleSaveNew} disabled={saving} className="btn-primary text-xs disabled:opacity-50">
                {saving ? "Salvando…" : "Adicionar"}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-3 border-b border-gray-100 dark:border-dark-border pb-1 overflow-x-auto">
          {tabs.map((tab) => {
            const count = tab === "Todos"
              ? orientations.length
              : tab === "Geral"
              ? orientations.filter((o) => o.department === "Geral").length
              : orientations.filter((o) => o.department === tab || o.department === "Geral").length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "bg-primary-500 text-white"
                    : "text-gray-500 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-surface"
                }`}
              >
                {tab}
                {count > 0 && (
                  <span className={`text-[10px] px-1 rounded-full ${activeTab === tab ? "bg-white/20" : "bg-gray-200 dark:bg-dark-border text-gray-600 dark:text-dark-text-secondary"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Lista */}
        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">Carregando…</div>
          ) : visibleOrientations.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Nenhuma orientação para este departamento.
            </div>
          ) : (
            visibleOrientations.map((o) => {
              const isOverdue = isDateOverdue(o.reminderDate);
              const isEditing = editingId === o.id;

              return (
                <div
                  key={o.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    isOverdue
                      ? "border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/10"
                      : "border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card"
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        rows={3}
                        className="input-base w-full resize-none text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <label className="label-base text-xs whitespace-nowrap">Lembrete:</label>
                        <input
                          type="date"
                          value={formReminder}
                          onChange={(e) => setFormReminder(e.target.value)}
                          className="input-base text-xs py-1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={cancelEdit} className="btn-secondary text-xs">Cancelar</button>
                        <button onClick={() => handleSaveEdit(o)} disabled={saving} className="btn-primary text-xs disabled:opacity-50">
                          {saving ? "Salvando…" : "Salvar"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 dark:text-dark-text whitespace-pre-wrap">{o.content}</p>
                        </div>
                        {canModify(o) && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => startEdit(o)}
                              className="text-gray-400 hover:text-blue-500 transition-colors p-0.5"
                              title="Editar"
                            >
                              <FiEdit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(o.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                              title="Excluir"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${DEPT_COLORS[o.department] || "bg-gray-100 text-gray-600"}`}>
                          {o.department}
                        </span>
                        {o.reminderDate && (
                          <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            isOverdue
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                              : "bg-gray-100 text-gray-500 dark:bg-dark-surface dark:text-dark-text-secondary"
                          }`}>
                            <FiAlertCircle size={9} />
                            Lembrete: {formatDateBR(o.reminderDate)}{isOverdue ? " (vencido)" : ""}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 dark:text-dark-text-secondary ml-auto">
                          {o.createdBy?.name} · {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end mt-4 pt-3 border-t border-gray-100 dark:border-dark-border">
          <button onClick={onClose} className="btn-ghost">Fechar</button>
        </div>
      </div>
    </div>
  );
}
