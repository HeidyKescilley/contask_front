// src/components/AddGrupoModal.jsx

import { useState } from "react";
import { FiX } from "react-icons/fi";

const AddGrupoModal = ({ onClose, onSave }) => {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() !== "") {
      onSave(name.trim());
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
        <h2 className="text-xl font-bold mb-5">Adicionar Novo Grupo</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-base">Nome do Grupo</label>
            <input
              type="text"
              className="input-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGrupoModal;
