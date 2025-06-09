// src/components/CompanyTable.jsx
"use client";

import {
  FiEdit,
  FiLock,
  FiClock,
  FiCopy,
  FiZap,
  FiArchive,
} from "react-icons/fi";
import { copyToClipboard, formatCNPJ } from "../utils/utils";
import { useAuth } from "../hooks/useAuth";

const CompanyTable = ({
  companies,
  onEditCompany,
  onBlockCompany,
  onViewHistory,
  onManageAutomations,
  onManualArchiveCompany,
}) => {
  const { user } = useAuth();

  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full table-fixed bg-white dark:bg-dark-card text-black dark:text-dark-text">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-16">
              Número
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-64">
              Razão Social
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-44">
              CNPJ
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-24">
              Regime
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-24">
              Padrão
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-32">
              Resp. Fiscal
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-32">
              Resp. DP
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-16">
              UF
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-16">
              Matriz
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-24">
              Status
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-28">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => {
            let rowClassName =
              "border-b border-gray-400 dark:border-dark-border";

            if (company.status === "SUSPENSA") {
              rowClassName += " bg-yellow-100 dark:bg-yellow-900";
            } else if (
              company.status === "BAIXADA" ||
              company.status === "DISTRATO"
            ) {
              rowClassName += " bg-red-100 dark:bg-red-900";
            }

            return (
              <tr key={company.id} className={rowClassName}>
                <td className="px-4 py-2 text-left">{company.num}</td>
                <td
                  className="px-4 py-2 text-left whitespace-nowrap overflow-hidden text-ellipsis"
                  title={company.name}
                >
                  {company.name}
                </td>
                <td className="px-4 py-2 text-left flex items-center">
                  <span className="flex-grow whitespace-nowrap overflow-hidden text-ellipsis mr-0.5">
                    {" "}
                    {/* Ajustado mr para 0.5 */}
                    {formatCNPJ(company.cnpj)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(formatCNPJ(company.cnpj))}
                    className="flex-shrink-0 text-logo-dark-blue dark:text-accent-blue ml-0.5" /* Ajustado ml para 0.5 */
                  >
                    <FiCopy />
                  </button>
                </td>
                <td className="px-4 py-2 text-left">{company.rule}</td>
                <td className="px-4 py-2 text-left">
                  {company.contactMode ? company.contactMode.name : "N/A"}
                </td>
                <td className="px-4 py-2 text-left">
                  {company.respFiscal?.name || "não atribuído"}
                </td>
                <td className="px-4 py-2 text-left">
                  {company.respDp?.name || "não atribuído"}
                </td>
                <td className="px-4 py-2 text-left">{company.uf || "N/A"}</td>
                <td className="px-4 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={company.isHeadquarters || false}
                    disabled
                    className="form-checkbox h-5 w-5 text-purple-600 disabled:opacity-50" // Cor roxa para destaque
                  />
                </td>
                <td className="px-4 py-2 text-left">{company.status}</td>
                <td className="px-4 py-2 flex space-x-2">
                  <button
                    onClick={() => onEditCompany(company)}
                    className="text-green-500 dark:text-accent-green"
                    aria-label="Editar Empresa"
                  >
                    <FiEdit />
                  </button>
                  {user?.role === "admin" && (
                    <button
                      onClick={() => onBlockCompany(company)}
                      className="text-red-500"
                      aria-label="Alterar Status da Empresa"
                    >
                      <FiLock />
                    </button>
                  )}
                  <button
                    onClick={() => onViewHistory(company)}
                    className="text-yellow-500"
                    aria-label="Visualizar Histórico"
                  >
                    <FiClock />
                  </button>
                  <button
                    onClick={() => onManageAutomations(company)}
                    className="text-blue-500"
                    aria-label="Gerenciar Automações"
                  >
                    <FiZap />
                  </button>
                  {onManualArchiveCompany && (
                    <button
                      onClick={() => onManualArchiveCompany(company)}
                      className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                      aria-label="Arquivar Empresa Manualmente"
                      title="Arquivar Empresa Manualmente"
                    >
                      <FiArchive />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyTable;
