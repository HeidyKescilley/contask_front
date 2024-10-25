// src/app/(protected)/companies/HistoryModal.jsx
"use client";

import { FiX } from "react-icons/fi";

const HistoryModal = ({ company, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <FiX size={24} />
        </button>
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          Histórico de Status
        </h2>
        {/* Conteúdo adicional pode ser adicionado aqui no futuro */}
      </div>
    </div>
  );
};

export default HistoryModal;
