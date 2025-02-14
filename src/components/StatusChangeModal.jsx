// src/components/StatusChangeModal.jsx
"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";

const StatusChangeModal = ({ company, onClose, onSave }) => {
  const [newStatus, setNewStatus] = useState("");
  const [statusDate, setStatusDate] = useState("");
  const [serviceEndDate, setServiceEndDate] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const statuses = ["ATIVA", "SUSPENSA", "BAIXADA", "DISTRATO"]; // Lista de status

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newStatus === "DISTRATO" && (!statusDate || !serviceEndDate)) {
      alert(
        "Por favor, informe o Encerramento do Contrato e a data final da prestação de serviços."
      );
      return;
    }
    setShowConfirmation(true);
  };

  const confirmStatusChange = () => {
    if (newStatus === "DISTRATO") {
      onSave({ newStatus, contractEndDate: statusDate, serviceEndDate });
    } else {
      onSave({ newStatus, statusDate });
    }
    setShowConfirmation(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-dark-card p-6 rounded shadow-lg w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <FiX size={24} />
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text">
          Alterar Status da Empresa
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Novo Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
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
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              {newStatus === "DISTRATO" ? "Encerramento do Contrato" : "Data do Status"}
            </label>
            <input
              type="date"
              value={statusDate}
              onChange={(e) => setStatusDate(e.target.value)}
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              required
            />
          </div>
          {newStatus === "DISTRATO" && (
            <div className="mb-4">
              <label className="block mb-1 text-gray-800 dark:text-dark-text">
                Prestar serviços até dia
              </label>
              <input
                type="date"
                value={serviceEndDate}
                onChange={(e) => setServiceEndDate(e.target.value)}
                className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
                required
              />
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 dark:bg-accent-blue text-white px-4 py-2 rounded"
            >
              Confirmar
            </button>
          </div>
        </form>
        {showConfirmation && (
          <div className="mt-4">
            <p className="text-gray-800 dark:text-dark-text">
              Tem certeza que deseja alterar o status da empresa{" "}
              <strong>{company.name}</strong> para <strong>{newStatus}</strong>?
              {newStatus === "DISTRATO" && (
                <>
                  {" "}
                  O contrato será encerrado em <strong>{statusDate}</strong> e os serviços serão prestados até <strong>{serviceEndDate}</strong>.
                </>
              )}
              A empresa e todos os usuários do Contask receberão uma notificação por email.
            </p>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={confirmStatusChange}
                className="bg-green-500 dark:bg-accent-green text-white px-4 py-2 rounded"
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
