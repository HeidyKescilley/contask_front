// src/components/AutomationModal.jsx
"use client";

import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";

const AutomationModal = ({ company, onClose }) => {
  const [allAutomations, setAllAutomations] = useState([]);
  const [selectedAutomations, setSelectedAutomations] = useState([]);
  const [showAddAutomationModal, setShowAddAutomationModal] = useState(false);
  const [newAutomationName, setNewAutomationName] = useState("");

  useEffect(() => {
    fetchAutomations();
  }, []);

  useEffect(() => {
    if (company.automations) {
      setSelectedAutomations(company.automations.map((a) => a.id));
    }
  }, [company]);

  const fetchAutomations = async () => {
    try {
      const res = await api.get("/automation/all");
      setAllAutomations(res.data);
    } catch (error) {
      console.error("Erro ao buscar automações:", error);
    }
  };

  const handleCheckboxChange = (automationId) => {
    setSelectedAutomations((prev) =>
      prev.includes(automationId)
        ? prev.filter((id) => id !== automationId)
        : [...prev, automationId]
    );
  };

  const handleSave = async () => {
    try {
      await api.patch(`/company/edit/${company.id}`, {
        automationIds: selectedAutomations,
      });
      toast.success("Automações atualizadas com sucesso!");
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao atualizar as automações."
      );
    }
  };

  const handleAddAutomation = async () => {
    if (!newAutomationName.trim()) {
      toast.error("O nome da automação é obrigatório.");
      return;
    }
    try {
      const res = await api.post("/automation/create", {
        name: newAutomationName.trim(),
      });
      toast.success("Automação adicionada com sucesso!");
      fetchAutomations(); // Atualiza a lista
      setShowAddAutomationModal(false);
      setNewAutomationName("");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao adicionar automação."
      );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      {/* Modal Principal */}
      <div className="bg-white dark:bg-dark-card p-6 rounded shadow-lg w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <FiX size={24} />
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text">
          Gerenciar Automações
        </h2>
        <div className="mb-4">
          {allAutomations.map((automation) => (
            <label key={automation.id} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedAutomations.includes(automation.id)}
                onChange={() => handleCheckboxChange(automation.id)}
                className="mr-2"
              />
              <span className="text-gray-800 dark:text-dark-text">
                {automation.name}
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => setShowAddAutomationModal(true)}
            className="bg-accent-green text-white px-4 py-2 rounded"
          >
            Adicionar Automação
          </button>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-500 dark:bg-accent-blue text-white px-4 py-2 rounded"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>

      {/* Modal para Adicionar Nova Automação */}
      {showAddAutomationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-60">
          <div className="bg-white dark:bg-dark-card p-6 rounded shadow-lg w-full max-w-md relative">
            <button
              onClick={() => setShowAddAutomationModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text">
              Adicionar Nova Automação
            </h2>
            <div className="mb-4">
              <label className="block mb-1 text-gray-800 dark:text-dark-text">
                Nome da Automação
              </label>
              <input
                type="text"
                value={newAutomationName}
                onChange={(e) => setNewAutomationName(e.target.value)}
                className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddAutomationModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddAutomation}
                className="bg-green-500 dark:bg-accent-green text-white px-4 py-2 rounded"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationModal;
