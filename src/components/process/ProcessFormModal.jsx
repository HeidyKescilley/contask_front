"use client";

import { useEffect, useState } from "react";
import { FiX, FiCheck } from "react-icons/fi";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { errorMessage } from "./processUtils";

// Inicia um processo a partir de um padrão, ou edita os dados de um processo existente.
const ProcessFormModal = ({ templates = [], instance = null, defaultTemplateId = null, onClose, onSaved }) => {
  const isEdit = !!instance;
  const [templateId, setTemplateId] = useState(
    instance?.templateId || defaultTemplateId || templates[0]?.id || "",
  );
  const [form, setForm] = useState({
    name: instance?.name || "",
    clientName: instance?.clientName || "",
    clientDoc: instance?.clientDoc || "",
    dueDate: instance?.dueDate || "",
    notes: instance?.notes || "",
    responsibleUserId: instance?.responsibleUser?.id || "",
  });
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  const template = templates.find((t) => t.id === Number(templateId));
  const department = instance?.department || template?.department;

  useEffect(() => {
    if (!department) return;
    api
      .get("/process/users", { params: { department } })
      .then((res) => setUsers(res.data.users || []))
      .catch(() => setUsers([]));
  }, [department]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Informe um nome para identificar o processo.");
    const payload = {
      ...form,
      responsibleUserId: form.responsibleUserId ? Number(form.responsibleUserId) : null,
      dueDate: form.dueDate || null,
    };
    setSaving(true);
    try {
      let saved;
      if (isEdit) {
        ({ data: saved } = await api.patch(`/process/instances/${instance.id}`, payload));
        toast.success("Processo atualizado.");
      } else {
        if (!templateId) return toast.error("Escolha um padrão.");
        ({ data: saved } = await api.post("/process/instances", { ...payload, templateId: Number(templateId) }));
        toast.success("Processo iniciado.");
      }
      onSaved(saved.instance);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao salvar o processo."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800 dark:text-dark-text">
            {isEdit ? "Editar dados do processo" : "Iniciar processo"}
          </h2>
          <button onClick={onClose} className="btn-ghost !p-1.5"><FiX size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isEdit && (
            <div>
              <label className="label-base">Padrão *</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="input-base" required>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — {t.department}</option>
                ))}
              </select>
              {template && (
                <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1">
                  {template.steps.length} passo(s) serão copiados para este processo.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="label-base">Nome do processo *</label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="Ex: Abertura – Padaria do João"
              className="input-base"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-base">Cliente</label>
              <input type="text" value={form.clientName} onChange={set("clientName")} className="input-base" />
            </div>
            <div>
              <label className="label-base">CNPJ / CPF</label>
              <input type="text" value={form.clientDoc} onChange={set("clientDoc")} className="input-base" />
            </div>
            <div>
              <label className="label-base">Responsável</label>
              <select value={form.responsibleUserId} onChange={set("responsibleUserId")} className="input-base">
                <option value="">— Sem responsável —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-base">Prazo</label>
              <input type="date" value={form.dueDate || ""} onChange={set("dueDate")} className="input-base" />
            </div>
          </div>

          <div>
            <label className="label-base">Observações</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3} className="input-base resize-y" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              <FiCheck size={15} /> {saving ? "Salvando..." : isEdit ? "Salvar" : "Iniciar processo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessFormModal;
