"use client";

import { useState } from "react";
import { FiX, FiCheck } from "react-icons/fi";

// Pede um motivo (e, na pausa, se é do escritório ou do cliente).
const ReasonModal = ({ title, description, confirmLabel, askOrigin = false, danger = false, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [origin, setOrigin] = useState("office");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSaving(true);
    try {
      const ok = await onConfirm({ reason: reason.trim(), origin });
      if (ok !== false) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800 dark:text-dark-text">{title}</h2>
          <button onClick={onClose} className="btn-ghost !p-1.5"><FiX size={16} /></button>
        </div>
        {description && <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-3">{description}</p>}

        <form onSubmit={submit} className="space-y-3">
          {askOrigin && (
            <div>
              <label className="label-base">A pausa acontece por</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "office", label: "Motivo interno", hint: "Do escritório" },
                  { value: "client", label: "Motivo do cliente", hint: "Aguardando o cliente" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setOrigin(opt.value)}
                    className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                      origin === opt.value
                        ? "bg-primary-500/10 border-primary-500 text-primary-700 dark:text-primary-300"
                        : "border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-primary-300"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{opt.label}</span>
                    <span className="block text-[11px] opacity-80">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label-base">Motivo *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              autoFocus
              required
              className="input-base resize-y"
              placeholder="Descreva o motivo"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Voltar</button>
            <button type="submit" disabled={saving || !reason.trim()} className={danger ? "btn-danger" : "btn-primary"}>
              <FiCheck size={15} /> {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReasonModal;
