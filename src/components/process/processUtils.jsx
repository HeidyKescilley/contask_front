// src/components/process/processUtils.jsx
import { FiUser, FiClock } from "react-icons/fi";

export const STATUS_META = {
  in_progress: {
    label: "Em andamento",
    badge: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  },
  paused: {
    label: "Pausado",
    badge: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  },
  completed: {
    label: "Concluído",
    badge: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  },
  canceled: {
    label: "Cancelado",
    badge: "bg-gray-100 text-gray-500 dark:bg-dark-surface dark:text-dark-text-secondary",
  },
};

export const RESPONSIBLE_META = {
  office: {
    label: "Escritório",
    badge: "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300",
  },
  client: {
    label: "Aguarda cliente",
    badge: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  },
};

export const ORIGIN_LABEL = { office: "Motivo interno (escritório)", client: "Motivo do cliente" };

export const DEPT_BADGE = {
  Administrativo: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
  Fiscal: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  Pessoal: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  "Contábil": "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  Processual: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
  Financeiro: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
};
export const deptBadge = (dept) =>
  DEPT_BADGE[dept] || "bg-gray-100 text-gray-600 dark:bg-dark-surface dark:text-dark-text-secondary";

export const EVENT_LABEL = {
  started: "Processo iniciado",
  step_completed: "Passo concluído",
  step_skipped: "Passo dispensado",
  step_reopened: "Passo reaberto",
  paused: "Processo pausado",
  resumed: "Processo retomado",
  reactivated: "Processo reativado",
  canceled: "Processo cancelado",
  completed: "Processo concluído",
  edited: "Dados editados",
  steps_edited: "Passos editados",
  note: "Anotação",
};

export const formatDate = (value) => {
  if (!value) return "—";
  // DATEONLY chega como "YYYY-MM-DD": evita deslocamento de fuso
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return d.toLocaleDateString("pt-BR");
};

export const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

export const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.in_progress;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${meta.badge}`}>
      {meta.label}
    </span>
  );
};

export const ResponsibleBadge = ({ responsible }) => {
  const meta = RESPONSIBLE_META[responsible] || RESPONSIBLE_META.office;
  const Icon = responsible === "client" ? FiClock : FiUser;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${meta.badge}`}>
      <Icon size={10} /> {meta.label}
    </span>
  );
};

export const ProgressBar = ({ done, total }) => {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-dark-border overflow-hidden">
        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-500 dark:text-dark-text-secondary tabular-nums whitespace-nowrap">
        {done}/{total}
      </span>
    </div>
  );
};

export const errorMessage = (err, fallback = "Ocorreu um erro.") =>
  err?.response?.data?.message || fallback;
