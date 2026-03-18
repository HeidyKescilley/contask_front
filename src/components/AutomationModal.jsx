// src/components/AutomationModal.jsx
"use client";

import { useState, useEffect } from "react";
import { FiX, FiPlus } from "react-icons/fi";
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
      await api.post("/automation/create", {
        name: newAutomationName.trim(),
      });
      toast.success("Automação adicionada com sucesso!");
      fetchAutomations();
      setShowAddAutomationModal(false);
      setNewAutomationName("");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao adicionar automação."
      );
    }
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

        <h2 className="text-xl font-bold mb-5">Gerenciar Automações</h2>

        <div className="space-y-2 mb-5">
          {allAutomations.map((automation) => (
            <label
              key={automation.id}
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-card-hover
                cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedAutomations.includes(automation.id)}
                onChange={() => handleCheckboxChange(automation.id)}
              />
              <span className="text-sm">{automation.name}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-dark-border">
          <button
            onClick={() => setShowAddAutomationModal(true)}
            className="btn-success text-sm"
          >
            <FiPlus size={16} />
            Adicionar
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost text-sm">
              Cancelar
            </button>
            <button onClick={handleSave} className="btn-primary text-sm">
              Salvar
            </button>
          </div>
        </div>
      </div>

      {showAddAutomationModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddAutomationModal(false)}
        >
          <div
            className="modal-box max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddAutomationModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                hover:bg-gray-100 dark:hover:bg-dark-card-hover dark:hover:text-dark-text transition-colors"
            >
              <FiX size={20} />
            </button>
            <h2 className="text-xl font-bold mb-5">
              Nova Automação
            </h2>
            <div className="mb-5">
              <label className="label-base">Nome da Automação</label>
              <input
                type="text"
                value={newAutomationName}
                onChange={(e) => setNewAutomationName(e.target.value)}
                className="input-base"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddAutomationModal(false)}
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button onClick={handleAddAutomation} className="btn-success">
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
