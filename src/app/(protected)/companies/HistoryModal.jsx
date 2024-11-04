// src/app/(protected)/companies/HistoryModal.jsx
"use client";

import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import api from "../../../utils/api";

const HistoryModal = ({ company, onClose }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Fetch the status history when the modal opens
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
    // Adjust for timezone offset if necessary
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    // Format date to dd/mm/yyyy
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
          Histórico de Status
        </h2>
        {history.length > 0 ? (
          <ul className="list-disc pl-5">
            {history.map((item, index) => (
              <li
                key={index}
                className="mb-2 text-gray-800 dark:text-dark-text"
              >
                <span>{formatDate(item.date)}: </span>
                <span>{item.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-800 dark:text-dark-text">
            Nenhum histórico disponível.
          </p>
        )}
      </div>
    </div>
  );
};

export default HistoryModal;
