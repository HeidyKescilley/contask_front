// src/components/StatusChangeModal.jsx
"use client";

import { useState } from "react";
import { FiX, FiAlertTriangle } from "react-icons/fi";

const StatusChangeModal = ({ company, onClose, onSave }) => {
  const [newStatus, setNewStatus] = useState("");
  const [statusDate, setStatusDate] = useState("");
  const [serviceEndDate, setServiceEndDate] = useState("");
  const [debitValue, setDebitValue] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const statuses = ["ATIVA", "SUSPENSA", "BAIXADA", "DISTRATO"];

  const formatToBrazilianCurrency = (value) => {
    if (!value) return value;
    const numeric = parseFloat(value.replace(/\./g, "").replace(",", "."));
    if (isNaN(numeric)) return value;
    return numeric.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newStatus === "DISTRATO" && (!statusDate || !serviceEndDate)) {
      alert(
        "Por favor, informe o Encerramento do Contrato e a competência final dos serviços."
      );
      return;
    }
    if (newStatus === "SUSPENSA" && !debitValue) {
      alert("Por favor, informe o Valor do Débito.");
      return;
    }
    setShowConfirmation(true);
  };

  const confirmStatusChange = () => {
    if (newStatus === "DISTRATO") {
      onSave({ newStatus, statusDate, serviceEndDate });
    } else if (newStatus === "SUSPENSA") {
      onSave({ newStatus, statusDate, debitValue });
    } else {
      onSave({ newStatus, statusDate });
    }
    setShowConfirmation(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600
            hover:bg-gray-100 dark:hover:bg-dark-card-hover dark:hover:text-dark-text transition-colors"
        >
          <FiX size={20} />
        </button>

        <h2 className="text-xl font-bold mb-5">Alterar Status da Empresa</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-base">Novo Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="input-base"
              required
            >
              <option value="">Selecione o novo status</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-base">
              {newStatus === "DISTRATO"
                ? "Encerramento do Contrato"
                : "Data do Status"}
            </label>
            <input
              type="date"
              value={statusDate}
              onChange={(e) => setStatusDate(e.target.value)}
              className="input-base"
              required
            />
          </div>

          {newStatus === "DISTRATO" && (
            <div>
              <label className="label-base">
                Fazer até a competência
              </label>
              <input
                type="month"
                value={serviceEndDate}
                onChange={(e) => setServiceEndDate(e.target.value)}
                className="input-base"
                required
              />
            </div>
          )}

          {newStatus === "SUSPENSA" && (
            <div>
              <label className="label-base">Valor do Débito</label>
              <input
                type="text"
                value={debitValue}
                onChange={(e) => setDebitValue(e.target.value)}
                onBlur={(e) =>
                  setDebitValue(formatToBrazilianCurrency(e.target.value))
                }
                className="input-base"
                placeholder="Informe o valor do débito"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Confirmar
            </button>
          </div>
        </form>

        {showConfirmation && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={20} />
              <div className="text-sm">
                <p className="text-gray-700 dark:text-dark-text">
                  Tem certeza que deseja alterar o status da empresa{" "}
                  <strong>{company.name}</strong> para{" "}
                  <strong>{newStatus}</strong>?
                  {newStatus === "DISTRATO" && (
                    <>
                      {" "}
                      O contrato será encerrado em{" "}
                      <strong>{statusDate}</strong> e os serviços serão
                      prestados até a competência de{" "}
                      <strong>{serviceEndDate.split("-").reverse().join("/")}</strong>.
                    </>
                  )}
                  {newStatus === "SUSPENSA" && (
                    <>
                      {" "}
                      O débito informado é de{" "}
                      <strong>{debitValue}</strong>.
                    </>
                  )}
                </p>
                <p className="text-gray-500 dark:text-dark-text-secondary mt-1">
                  A empresa e os usuários do Contask receberão uma
                  notificação por email.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="btn-ghost text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmStatusChange}
                className="btn-success text-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusChangeModal;
