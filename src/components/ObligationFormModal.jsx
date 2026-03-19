"use client";

import { useState, useEffect } from "react";
import { FiX, FiCheck, FiInfo } from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";

const REGIMES = ["Simples", "Presumido", "Real", "MEI", "Isenta", "Doméstica"];
const CLASSIFICACOES = ["ICMS", "ISS", "ICMS/ISS", "Outros"];
const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

// ── Chip multiselect ─────────────────────────────────────────────────────────
const ChipSelect = ({ label, options, selected, onChange, nullLabel = "Todos" }) => {
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
          {nullLabel}
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
                onChange(next.length === 0 ? [] : next);
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
const ObligationFormModal = ({ onClose, onSaved, editData = null }) => {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    name: "",
    description: "",
    department: "Fiscal",
    periodicity: "monthly",
    deadline: "",
    deadlineType: "calendar_day",
    sendWhenZeroed: true,
    applicableRegimes: [],
    applicableClassificacoes: [],
    applicableUFs: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || "",
        description: editData.description || "",
        department: editData.department || "Fiscal",
        periodicity: editData.periodicity || "monthly",
        deadline: editData.deadline ?? "",
        deadlineType: editData.deadlineType || "calendar_day",
        sendWhenZeroed: editData.sendWhenZeroed !== false,
        applicableRegimes: editData.applicableRegimes || [],
        applicableClassificacoes: editData.applicableClassificacoes || [],
        applicableUFs: editData.applicableUFs || [],
      });
    }
  }, [editData]);

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.deadline) {
      toast.error("Nome e prazo são obrigatórios.");
      return;
    }

    const payload = {
      ...form,
      deadline: parseInt(form.deadline, 10),
      applicableRegimes: form.applicableRegimes.length > 0 ? form.applicableRegimes : null,
      applicableClassificacoes: form.applicableClassificacoes.length > 0 ? form.applicableClassificacoes : null,
      applicableUFs: form.applicableUFs.length > 0 ? form.applicableUFs : null,
    };

    setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/obligation/${editData.id}`, payload);
        toast.success("Obrigação atualizada com sucesso!");
      } else {
        await api.post("/obligation/create", payload);
        toast.success("Obrigação criada com sucesso!");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao salvar obrigação.");
    } finally {
      setLoading(false);
    }
  };

  const periodicityLabels = { monthly: "Mensal", biweekly: "Quinzenal", annual: "Anual" };
  const deadlineTypeLabels = {
    calendar_day: "Dia do mês (1–31)",
    business_days: "Dias úteis após início do período",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800 dark:text-dark-text">
            {isEdit ? "Editar Obrigação" : "Nova Obrigação Acessória"}
          </h2>
          <button onClick={onClose} className="btn-ghost !p-1.5">
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome + Setor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="label-base">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={setField("name")}
                placeholder="Ex: SPED Fiscal, DCTF..."
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="label-base">Setor *</label>
              <select value={form.department} onChange={setField("department")} className="input-base">
                <option value="Fiscal">Fiscal</option>
                <option value="Pessoal">Pessoal (DP)</option>
                <option value="Contábil">Contábil</option>
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="label-base">Descrição</label>
            <textarea
              value={form.description}
              onChange={setField("description")}
              rows={2}
              placeholder="Descrição opcional da obrigação..."
              className="input-base resize-none"
            />
          </div>

          {/* Periodicidade + Prazo */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-base">Periodicidade *</label>
              <select value={form.periodicity} onChange={setField("periodicity")} className="input-base">
                {Object.entries(periodicityLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">Tipo de prazo *</label>
              <select value={form.deadlineType} onChange={setField("deadlineType")} className="input-base">
                {Object.entries(deadlineTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">
                {form.deadlineType === "calendar_day" ? "Dia do mês *" : "Nº de dias úteis *"}
              </label>
              <input
                type="number"
                min={1}
                max={form.deadlineType === "calendar_day" ? 31 : 60}
                value={form.deadline}
                onChange={setField("deadline")}
                className="input-base"
                required
              />
            </div>
          </div>

          {form.deadlineType === "business_days" && (
            <p className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 -mt-2">
              <FiInfo size={12} />
              Os dias úteis são calculados automaticamente excluindo finais de semana e feriados nacionais (via BrasilAPI).
            </p>
          )}

          {/* Envia Zerado */}
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => set("sendWhenZeroed")(!form.sendWhenZeroed)}
                className={`w-10 h-5 rounded-full transition-colors flex items-center ${
                  form.sendWhenZeroed ? "bg-primary-500" : "bg-gray-200 dark:bg-dark-border"
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${form.sendWhenZeroed ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <span className="text-sm text-gray-700 dark:text-dark-text-secondary">
                Envia mesmo quando empresa está zerada
              </span>
            </label>
            {!form.sendWhenZeroed && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 ml-12">
                Empresa zerada → obrigação desabilitada automaticamente naquele mês.
              </p>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-dark-border" />

          {/* Filtros de aplicação */}
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
              {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar obrigação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ObligationFormModal;
