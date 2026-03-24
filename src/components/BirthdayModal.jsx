"use client";

import { FiX, FiGift } from "react-icons/fi";
import api from "../utils/api";

const BirthdayModal = ({ birthdayUsers, onDismiss }) => {
  if (!birthdayUsers || birthdayUsers.length === 0) return null;

  const handleClose = async (userId) => {
    try {
      await api.post("/birthday/seen", { birthdayUserId: userId });
    } catch (_) {}
    onDismiss(userId);
  };

  // Exibe o primeiro da fila; ao fechar, remove ele e o próximo aparece
  const current = birthdayUsers[0];

  return (
    <div className="modal-overlay" onClick={() => handleClose(current.id)}>
      <div
        className="modal-box max-w-md relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => handleClose(current.id)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600
            hover:bg-gray-100 dark:hover:bg-dark-card-hover dark:hover:text-dark-text transition-colors"
        >
          <FiX size={20} />
        </button>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500">
            <FiGift size={36} />
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-800 dark:text-dark-text">
              Que dia mais feliz!
            </p>
            <p className="mt-1 text-gray-600 dark:text-dark-text-secondary">
              Hoje é aniversário de{" "}
              <span className="font-bold text-gray-800 dark:text-dark-text">
                {current.name}
              </span>
              {current.department && (
                <> do departamento <span className="font-semibold">{current.department}</span></>
              )}
              !
            </p>
          </div>

          {birthdayUsers.length > 1 && (
            <p className="text-xs text-gray-400 dark:text-dark-text-secondary">
              +{birthdayUsers.length - 1} outro(s) aniversariante(s) hoje
            </p>
          )}

          <button
            onClick={() => handleClose(current.id)}
            className="mt-2 px-6 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BirthdayModal;
