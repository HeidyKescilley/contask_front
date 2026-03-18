// src/utils/utils.js
import { toast } from "react-toastify";

// ─── Clipboard ───────────────────────────────────────────────────────────────

export const copyToClipboard = (text, label = "Texto") => {
  const value = String(text);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`${label} copiado!`))
      .catch(() => toast.error("Erro ao copiar."));
  } else {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.cssText = "position:fixed;left:-9999px;top:-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      toast.success(`${label} copiado!`);
    } catch {
      toast.error("Erro ao copiar.");
    }
    document.body.removeChild(ta);
  }
};

// ─── Formatação de documentos ─────────────────────────────────────────────────

/** Formata CPF: 000.000.000-00 */
export const formatCPF = (value) => {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
};

/** Formata CNPJ: 00.000.000/0000-00 */
export const formatCNPJ = (value) => {
  const d = value.replace(/\D/g, "").slice(0, 14);
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
};

/**
 * Aplica máscara progressiva enquanto o usuário digita.
 * Até 11 dígitos → máscara de CPF.
 * 12–14 dígitos  → máscara de CNPJ.
 */
export const applyDocumentMask = (value) => {
  const d = value.replace(/\D/g, "").slice(0, 14);
  const n = d.length;

  if (n <= 11) {
    // CPF progressivo
    if (n <= 3) return d;
    if (n <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (n <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  // CNPJ progressivo
  if (n <= 2) return d;
  if (n <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (n <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (n <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

// ─── Validação de documentos ──────────────────────────────────────────────────

export const validateCPF = (value) => {
  const d = value.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;

  const calc = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(d[i]) * (len + 1 - i);
    const rem = (sum * 10) % 11;
    return rem >= 10 ? 0 : rem;
  };

  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
};

export const validateCNPJ = (value) => {
  const d = value.replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;

  const calcDigit = (str, weights) => {
    const sum = str
      .split("")
      .reduce((acc, ch, i) => acc + parseInt(ch) * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  return (
    calcDigit(d.slice(0, 12), w1) === parseInt(d[12]) &&
    calcDigit(d.slice(0, 13), w2) === parseInt(d[13])
  );
};

/**
 * Valida CPF (11 dígitos) ou CNPJ (14 dígitos) automaticamente.
 * Retorna false se o número de dígitos for diferente de 11 ou 14.
 */
export const validateDocument = (value) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return validateCPF(digits);
  if (digits.length === 14) return validateCNPJ(digits);
  return false;
};

/** Retorna "CPF", "CNPJ" ou null com base no número de dígitos */
export const getDocumentType = (value) => {
  const n = value.replace(/\D/g, "").length;
  if (n === 11) return "CPF";
  if (n === 14) return "CNPJ";
  return null;
};

// ─── Datas ────────────────────────────────────────────────────────────────────

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  const day   = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year  = date.getFullYear();
  return `${day}/${month}/${year}`;
};
