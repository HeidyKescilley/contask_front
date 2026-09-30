"use client";

import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown, FiX } from "react-icons/fi";

// Itens de checklist chegam como string (padrão) ou { text, done } (processo).
const toItem = (item) => (typeof item === "string" ? { text: item, done: false } : item);

export const newStep = () => ({
  key: `new-${Math.random().toString(36).slice(2)}`,
  title: "",
  description: "",
  responsible: "office",
  checklist: [],
});

// Converte passos vindos da API para o formato editável.
export const toEditableSteps = (steps = []) =>
  steps.map((s) => ({
    key: `id-${s.id}`,
    id: s.id,
    title: s.title,
    description: s.description || "",
    responsible: s.responsible,
    status: s.status,
    checklist: (s.checklist || []).map(toItem),
  }));

const RESP_OPTIONS = [
  { value: "office", label: "Escritório" },
  { value: "client", label: "Aguarda cliente" },
];

const StepsEditor = ({ steps, onChange }) => {
  const update = (index, patch) =>
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index) => onChange(steps.filter((_, i) => i !== index));

  const updateItem = (stepIndex, itemIndex, text) => {
    const checklist = steps[stepIndex].checklist.map((c, i) => (i === itemIndex ? { ...c, text } : c));
    update(stepIndex, { checklist });
  };
  const addItem = (stepIndex) =>
    update(stepIndex, { checklist: [...steps[stepIndex].checklist, { text: "", done: false }] });
  const removeItem = (stepIndex, itemIndex) =>
    update(stepIndex, { checklist: steps[stepIndex].checklist.filter((_, i) => i !== itemIndex) });

  return (
    <div className="space-y-3">
      {steps.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">Nenhum passo ainda. Adicione o primeiro abaixo.</p>
      )}
      {steps.map((step, index) => (
        <div
          key={step.key}
          className="rounded-xl border border-gray-200 dark:border-dark-border p-3 space-y-2.5 bg-white/50 dark:bg-dark-surface/40"
        >
          <div className="flex items-start gap-2">
            <span className="mt-1.5 w-6 h-6 flex-shrink-0 rounded-full bg-primary-500/15 text-primary-600 dark:text-primary-300 text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <input
              type="text"
              value={step.title}
              onChange={(e) => update(index, { title: e.target.value })}
              placeholder="Título do passo"
              className="input-base flex-1"
            />
            <div className="flex items-center flex-shrink-0">
              <button type="button" title="Mover para cima" onClick={() => move(index, -1)} disabled={index === 0} className="btn-ghost !p-1.5 !bg-transparent disabled:opacity-30">
                <FiArrowUp size={14} />
              </button>
              <button type="button" title="Mover para baixo" onClick={() => move(index, 1)} disabled={index === steps.length - 1} className="btn-ghost !p-1.5 !bg-transparent disabled:opacity-30">
                <FiArrowDown size={14} />
              </button>
              <button type="button" title="Remover passo" onClick={() => remove(index)} className="btn-ghost !p-1.5 !bg-transparent text-red-500">
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>

          <div className="pl-8 space-y-2.5">
            <textarea
              value={step.description}
              onChange={(e) => update(index, { description: e.target.value })}
              placeholder="Descrição / anotações (opcional)"
              rows={2}
              className="input-base resize-y"
            />

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-text-secondary">
                Responsável
              </span>
              {RESP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update(index, { responsible: opt.value })}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    step.responsible === opt.value
                      ? "bg-primary-500 text-white border-primary-500"
                      : "border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-primary-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-text-secondary mb-1.5">
                Checklist do passo (opcional)
              </p>
              <div className="space-y-1.5">
                {step.checklist.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateItem(index, itemIndex, e.target.value)}
                      placeholder="Item do checklist"
                      className="input-base !py-1.5"
                    />
                    <button type="button" onClick={() => removeItem(index, itemIndex)} className="btn-ghost !p-1.5 !bg-transparent text-gray-400 hover:text-red-500">
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addItem(index)} className="mt-1.5 text-xs text-primary-600 dark:text-primary-300 hover:underline inline-flex items-center gap-1">
                <FiPlus size={12} /> Adicionar item
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...steps, newStep()])}
        className="btn-outline w-full !py-2 text-xs"
      >
        <FiPlus size={14} /> Adicionar passo
      </button>
    </div>
  );
};

export default StepsEditor;
