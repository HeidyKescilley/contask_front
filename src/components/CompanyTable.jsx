// src/components/CompanyTable.jsx
"use client";

import { memo, useCallback } from "react";
import {
  FiEdit,
  FiLock,
  FiClock,
  FiCopy,
  FiZap,
  FiArchive,
  FiRotateCcw,
  FiBookOpen,
  FiShield,
} from "react-icons/fi";
import { copyToClipboard, formatCNPJ } from "../utils/utils";
import { useAuth } from "../hooks/useAuth";

const STATUS_STYLES = {
  ATIVA:    "badge-green",
  SUSPENSA: "badge-amber",
  BAIXADA:  "badge-red",
  DISTRATO: "badge-red",
};

const ROW_HIGHLIGHT = {
  SUSPENSA: " bg-status-warning-bg/40 dark:bg-status-warning-bg-dark/25",
  BAIXADA:  " bg-status-error-bg/40   dark:bg-status-error-bg-dark/25",
  DISTRATO: " bg-status-error-bg/40   dark:bg-status-error-bg-dark/25",
};

const StatusBadge = memo(({ status }) => (
  <span className={STATUS_STYLES[status] || "badge badge-gray"}>
    {status}
  </span>
));
StatusBadge.displayName = "StatusBadge";

const CERTIFICATE_STATUS_STYLES = {
  verde: "text-status-success-text dark:text-status-success-text-dark hover:opacity-80",
  amarelo: "text-status-warning-text dark:text-status-warning-text-dark hover:opacity-80",
  vermelho: "text-status-error-text dark:text-status-error-text-dark hover:opacity-80",
  cinza: "text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500",
};

const CERTIFICATE_STATUS_LABELS = {
  verde: "Certificado em dia",
  amarelo: "Certificado vencendo em breve",
  vermelho: "Certificado vencido",
  cinza: "Sem certificado cadastrado",
};

const CertificateStatusIcon = memo(({ status, onClick }) => (
  <button
    onClick={onClick}
    className={`p-1 rounded-lg transition-colors ${CERTIFICATE_STATUS_STYLES[status] || CERTIFICATE_STATUS_STYLES.cinza}`}
    title={CERTIFICATE_STATUS_LABELS[status] || CERTIFICATE_STATUS_LABELS.cinza}
    aria-label="Certificado digital"
  >
    <FiShield size={15} />
  </button>
));
CertificateStatusIcon.displayName = "CertificateStatusIcon";

const ActionButton = memo(({ onClick, className, label, children }) => (
  <button
    onClick={onClick}
    className={`p-1 rounded-lg transition-colors ${className}`}
    aria-label={label}
    title={label}
  >
    {children}
  </button>
));
ActionButton.displayName = "ActionButton";

const CompanyRow = memo(({
  company, isAdmin,
  onEditCompany, onBlockCompany, onViewHistory, onManageAutomations, onManualArchiveCompany, onManualUnarchiveCompany, onOpenOrientations, onOpenCertificate
}) => {
  const rowClass = `table-row${ROW_HIGHLIGHT[company.status] || ""}`;

  return (
    <tr className={rowClass}>
      <td className="table-cell font-mono text-xs">{company.num}</td>
      <td className="table-cell text-center">{company.branchNumber || "–"}</td>
      <td className="table-cell max-w-[160px]">
        <div className="flex items-center gap-1.5">
          {onOpenOrientations && (
            <button
              onClick={() => onOpenOrientations(company)}
              className="flex-shrink-0 text-purple-400 hover:text-purple-600 dark:text-purple-500 dark:hover:text-purple-300 transition-colors"
              title="Orientações da empresa"
            >
              <FiBookOpen size={12} />
            </button>
          )}
          <span
            className="block truncate text-xs"
            title={company.name}
          >
            {company.name.length > 33
              ? `${company.name.slice(0, 33)}…`
              : company.name}
          </span>
          <button
            onClick={() => copyToClipboard(company.name, "Razão Social")}
            className="flex-shrink-0 text-gray-400 hover:text-primary-500 transition-colors"
            title="Copiar Razão Social"
          >
            <FiCopy size={12} />
          </button>
        </div>
      </td>
      <td className="table-cell whitespace-nowrap relative group pr-7">
        <span className="font-mono text-xs tracking-[0.06em] tabular-nums">
          {formatCNPJ(company.cnpj)}
        </span>
        <button
          onClick={() => copyToClipboard(company.cnpj, "CNPJ")}
          className="absolute right-2 top-1/2 -translate-y-1/2
            text-gray-300 dark:text-gray-600
            group-hover:text-primary-500 dark:group-hover:text-primary-400
            transition-colors"
          title="Copiar CNPJ"
        >
          <FiCopy size={12} />
        </button>
      </td>
      <td className="table-cell">{company.rule}</td>
      <td className="table-cell">{company.contactMode?.name || "–"}</td>
      <td className="table-cell">{company.respFiscal?.name?.split(" ")[0] || "–"}</td>
      <td className="table-cell">{company.respDp?.name?.split(" ")[0] || "–"}</td>
      <td className="table-cell text-center">{company.uf || "–"}</td>
      <td className="table-cell text-center">
        {onOpenCertificate && (
          <CertificateStatusIcon
            status={company.certificateStatus || "cinza"}
            onClick={() => onOpenCertificate(company)}
          />
        )}
      </td>
      <td className="table-cell text-center">
        {company.isHeadquarters ? (
          <span className="w-2 h-2 bg-primary-500 rounded-full inline-block" title="Matriz" />
        ) : (
          <span className="text-gray-300 dark:text-gray-600 text-xs">–</span>
        )}
      </td>
      <td className="table-cell"><StatusBadge status={company.status} /></td>
      <td className="table-cell">
        <div className="flex items-center gap-0.5">
          <ActionButton
            onClick={() => onEditCompany(company)}
            className="text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            label="Editar"
          >
            <FiEdit size={14} />
          </ActionButton>
          {isAdmin && (
            <ActionButton
              onClick={() => onBlockCompany(company)}
              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              label="Alterar Status"
            >
              <FiLock size={14} />
            </ActionButton>
          )}
          <ActionButton
            onClick={() => onViewHistory(company)}
            className="text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            label="Historico"
          >
            <FiClock size={14} />
          </ActionButton>
          <ActionButton
            onClick={() => onManageAutomations(company)}
            className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            label="Automacoes"
          >
            <FiZap size={14} />
          </ActionButton>
          {company.isArchived
            ? onManualUnarchiveCompany && (
                <ActionButton
                  onClick={() => onManualUnarchiveCompany(company)}
                  className="text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  label="Desarquivar"
                >
                  <FiRotateCcw size={14} />
                </ActionButton>
              )
            : onManualArchiveCompany && (
                <ActionButton
                  onClick={() => onManualArchiveCompany(company)}
                  className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600"
                  label="Arquivar"
                >
                  <FiArchive size={14} />
                </ActionButton>
              )}
        </div>
      </td>
    </tr>
  );
});
CompanyRow.displayName = "CompanyRow";

const CompanyTable = ({
  companies,
  onEditCompany,
  onBlockCompany,
  onViewHistory,
  onManageAutomations,
  onManualArchiveCompany,
  onManualUnarchiveCompany,
  onOpenOrientations,
  onOpenCertificate,
  tableMaxHeight = "calc(100vh - 280px)",
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="card p-0 overflow-hidden mt-3">
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: tableMaxHeight }}>
        <table className="min-w-full table-fixed">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="table-header w-12">Nº</th>
              <th className="table-header w-12 text-center">Filial</th>
              <th className="table-header" style={{ minWidth: "200px" }}>Razao Social</th>
              <th className="table-header w-44">CNPJ</th>
              <th className="table-header w-20">Regime</th>
              <th className="table-header w-20">Padrao</th>
              <th className="table-header w-24">Resp. Fiscal</th>
              <th className="table-header w-24">Resp. DP</th>
              <th className="table-header w-10 text-center">UF</th>
              <th className="table-header w-16 text-center">Certificado</th>
              <th className="table-header w-14 text-center">Matriz</th>
              <th className="table-header w-24">Status</th>
              <th className="table-header w-24">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <CompanyRow
                key={company.id}
                company={company}
                isAdmin={isAdmin}
                onEditCompany={onEditCompany}
                onBlockCompany={onBlockCompany}
                onViewHistory={onViewHistory}
                onManageAutomations={onManageAutomations}
                onManualArchiveCompany={onManualArchiveCompany}
                onManualUnarchiveCompany={onManualUnarchiveCompany}
                onOpenOrientations={onOpenOrientations}
                onOpenCertificate={onOpenCertificate}
              />
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={13} className="table-cell text-center py-8 text-gray-400 dark:text-dark-text-secondary">
                  Nenhuma empresa encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(CompanyTable);
