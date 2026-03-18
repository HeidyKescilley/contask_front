// src/components/HistoryModal.jsx
"use client";

import { useState, useEffect } from "react";
import { FiX, FiClock } from "react-icons/fi";
import api from "../utils/api";

const HistoryModal = ({ company, onClose }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/company/status-history/${company.id}`);
        setHistory(res.data);
      } catch (error) {
        console.error("Error fetching status history:", error);
      }
    };
    fetchHistory();
  }, [company.id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      ATIVA: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      SUSPENSA: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      BAIXADA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      DISTRATO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[status] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
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

        <h2 className="text-xl font-bold mb-5">
          Histórico de Status
        </h2>

        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-surface
                  border border-gray-100 dark:border-dark-border"
              >
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-dark-card-hover text-gray-500 dark:text-dark-text-secondary">
                  <FiClock size={16} />
                </div>
                <div className="flex-1">
                  <span className="text-sm text-gray-500 dark:text-dark-text-secondary">
                    {formatDate(item.date)}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-dark-text-secondary py-6">
            Nenhum histórico disponível.
          </p>
        )}
      </div>
    </div>
  );
};

export default HistoryModal;
