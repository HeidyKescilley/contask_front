"use client";

import { useState } from "react";
import { FiX, FiCheck } from "react-icons/fi";
import api from "../../utils/api";
import { toast } from "react-toastify";
import StepsEditor, { toEditableSteps } from "./StepsEditor";
import { errorMessage } from "./processUtils";

// Cria/edita um padrão de processo (nome, departamento e passos com checklists).
const TemplateFormModal = ({ template = null, departments, isAdmin, onClose, onSaved }) => {
  const isEdit = !!template;
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [department, setDepartment] = useState(template?.department || departments[0] || "");
  const [steps, setSteps] = useState(toEditableSteps(template?.steps || []));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Informe o nome do padrão.");
    if (steps.length === 0) return toast.error("Adicione ao menos um passo.");
    if (steps.some((s) => !s.title.trim())) return toast.error("Todos os passos precisam de um título.");

    const payload = {
      name: name.trim(),
      description,
      department,
      steps: steps.map((s) => ({
        title: s.title,
        description: s.description,
        responsible: s.responsible,
        checklist: s.checklist.map((c) => c.text),
      })),
    };
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/process/templates/${template.id}`, payload);
        toast.success("Padrão atualizado.");
      } else {
        await api.post("/process/templates", payload);
        toast.success("Padrão criado.");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao salvar o padrão."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800 dark:text-dark-text">
            {isEdit ? "Editar padrão de processo" : "Novo padrão de processo"}
          </h2>
          <button onClick={onClose} className="btn-ghost !p-1.5"><FiX size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="label-base">Nome *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Abertura de Empresa"
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="label-base">Departamento *</label>
              {isAdmin ? (
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="input-base">
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <input type="text" value={department} disabled className="input-base opacity-70" />
              )}
            </div>
          </div>

          <div>
            <label className="label-base">Descrição / observações</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Orientações gerais sobre este tipo de processo"
              className="input-base resize-y"
            />
          </div>

          <div>
            <p className="label-base">Passos</p>
            <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-2">
              Alterar o padrão não modifica processos já iniciados; eles mantêm uma cópia própria dos passos.
            </p>
            <StepsEditor steps={steps} onChange={setSteps} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              <FiCheck size={15} /> {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar padrão"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateFormModal;
