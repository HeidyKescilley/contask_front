"use client";

import { useState, useEffect } from "react";
import { FiX, FiCheck } from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";

const DEPARTMENTS = ["Fiscal", "Pessoal", "Contábil"];
const REGIMES = ["Simples", "Presumido", "Real", "MEI", "Isenta", "Doméstica"];
const CLASSIFICACOES = ["ICMS", "ISS", "ICMS/ISS", "Outros"];
const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

// ── Chip multiselect ─────────────────────────────────────────────────────────
const ChipSelect = ({ label, options, selected, onChange }) => {
  const isAll = !selected || selected.length === 0;
  return (
    <div>
      <p className="label-base mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange([])}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            isAll
              ? "bg-primary-500 text-white border-primary-500"
              : "bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-primary-300"
          }`}
        >
          Todos
        </button>
        {options.map((opt) => {
          const active = selected?.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const next = active
                  ? (selected || []).filter((v) => v !== opt)
                  : [...(selected || []), opt];
                onChange(next);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-primary-500 text-white border-primary-500"
                  : "bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-primary-300"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Modal principal ──────────────────────────────────────────────────────────
const TaxFormModal = ({ onClose, onSaved, editData = null }) => {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    name: "",
    department: "Fiscal",
    applicableRegimes: [],
    applicableClassificacoes: [],
    applicableUFs: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || "",
        department: editData.department || "Fiscal",
        applicableRegimes: editData.applicableRegimes || [],
        applicableClassificacoes: editData.applicableClassificacoes || [],
        applicableUFs: editData.applicableUFs || [],
      });
    }
  }, [editData]);

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      department: form.department,
      applicableRegimes: form.applicableRegimes.length > 0 ? form.applicableRegimes : null,
      applicableClassificacoes: form.applicableClassificacoes.length > 0 ? form.applicableClassificacoes : null,
      applicableUFs: form.applicableUFs.length > 0 ? form.applicableUFs : null,
    };
    setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/tax/${editData.id}`, payload);
        toast.success("Imposto atualizado com sucesso!");
      } else {
        await api.post("/tax/create", payload);
        toast.success("Imposto criado com sucesso!");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao salvar imposto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800 dark:text-dark-text">
            {isEdit ? "Editar Imposto" : "Novo Imposto"}
          </h2>
          <button onClick={onClose} className="btn-ghost !p-1.5">
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome + Departamento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label-base">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: ICMS, DAS, PIS/COFINS..."
                className="input-base"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="label-base">Departamento *</label>
              <div className="flex gap-2 mt-1">
                {DEPARTMENTS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, department: d }))}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      form.department === d
                        ? "bg-primary-500 text-white border-primary-500"
                        : "border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-primary-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-dark-border" />

          {/* Filtros */}
          <p className="text-xs font-semibold text-gray-400 dark:text-dark-text-secondary uppercase tracking-wider">
            Filtros de aplicação automática
          </p>
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary -mt-2">
            Deixe &quot;Todos&quot; para aplicar a todas as empresas sem filtro.
          </p>

          <ChipSelect
            label="Regimes"
            options={REGIMES}
            selected={form.applicableRegimes}
            onChange={set("applicableRegimes")}
          />
          <ChipSelect
            label="Classificações"
            options={CLASSIFICACOES}
            selected={form.applicableClassificacoes}
            onChange={set("applicableClassificacoes")}
          />
          <ChipSelect
            label="UFs"
            options={STATES}
            selected={form.applicableUFs}
            onChange={set("applicableUFs")}
          />

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              <FiCheck size={15} />
              {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar imposto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaxFormModal;
