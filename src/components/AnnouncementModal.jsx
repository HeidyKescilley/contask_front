"use client";

import { useState } from "react";
import { FiX, FiBell, FiSend } from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";

const AnnouncementModal = ({ announcements, onDismiss }) => {
  const [dontShow, setDontShow] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  if (!announcements || announcements.length === 0) return null;

  const current = announcements[0];

  const handleClose = () => {
    onDismiss(current.id, dontShow);
    setDontShow(false);
    setReplyText("");
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.post(`/announcements/${current.id}/reply`, { replyText });
      toast.success("Resposta enviada com sucesso!");
      setReplyText("");
    } catch {
      toast.error("Erro ao enviar resposta.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-box max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão fechar (X) */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600
            hover:bg-gray-100 dark:hover:bg-dark-card-hover dark:hover:text-dark-text transition-colors"
        >
          <FiX size={20} />
        </button>

        <div className="flex flex-col gap-4 py-2">
          {/* Cabeçalho */}
          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex-shrink-0">
              <FiBell size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-dark-text leading-tight">
              {current.title}
            </h2>
          </div>

          {/* Conteúdo HTML */}
          <div
            className="text-gray-600 dark:text-dark-text-secondary text-sm leading-relaxed
              prose prose-sm dark:prose-invert max-w-none
              [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
              [&_strong]:text-gray-800 [&_strong]:dark:text-dark-text
              [&_a]:text-blue-600 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: current.content }}
          />

          {/* Campo de resposta (opcional) */}
          {current.allowReply && (
            <div className="flex flex-col gap-2 border-t border-gray-100 dark:border-dark-border pt-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-dark-text-secondary uppercase tracking-wide">
                Sua resposta
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escreva sua resposta aqui..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 dark:border-dark-border
                  bg-white dark:bg-dark-surface text-sm text-gray-700 dark:text-dark-text
                  px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400
                  placeholder-gray-400 dark:placeholder-gray-600"
              />
              <button
                onClick={handleSendReply}
                disabled={sending || !replyText.trim()}
                className="self-end flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                  text-white text-sm font-medium transition-colors"
              >
                <FiSend size={14} />
                {sending ? "Enviando..." : "Enviar resposta"}
              </button>
            </div>
          )}

          {/* Rodapé: contador + checkbox + botão fechar */}
          <div className="flex flex-col gap-3 border-t border-gray-100 dark:border-dark-border pt-3">
            {announcements.length > 1 && (
              <p className="text-xs text-gray-400 dark:text-dark-text-secondary text-center">
                +{announcements.length - 1} outro(s) aviso(s) pendente(s)
              </p>
            )}

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={(e) => setDontShow(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-dark-text-secondary">
                Não mostrar mais esta mensagem
              </span>
            </label>

            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600
                text-white font-medium text-sm transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
