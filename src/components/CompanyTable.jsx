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
import { useAuth } from "../hooks/useAuth"; // Importa o hook para obter o usuário

const CompanyTable = ({
  companies,
  onEditCompany,
  onBlockCompany,
  onViewHistory,
  onManageAutomations,
  onManualArchiveCompany,
}) => {
  const { user } = useAuth(); // Obtém o usuário autenticado

  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full bg-white dark:bg-dark-card text-black dark:text-dark-text">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
              {" "}
              {/* Adicionado text-left */}
              Número
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
              {" "}
              {/* Adicionado text-left */}
              Razão Social
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
              {" "}
              {/* Adicionado text-left */}
              CNPJ
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
              {" "}
              {/* Adicionado text-left */}
              Regime
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
              {" "}
              {/* Adicionado text-left */}
              Padrão
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
              {" "}
              {/* Adicionado text-left */}
              Resp. Fiscal
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
              {" "}
              {/* Adicionado text-left */}
              Resp. DP
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
              {" "}
              {/* Adicionado text-left */}
              Status
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left">
              {" "}
              {/* Adicionado text-left */}
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
                <td className="px-4 py-2 text-left">{company.num}</td>{" "}
                {/* Adicionado text-left */}
                <td className="px-4 py-2 text-left">{company.name}</td>{" "}
                {/* Adicionado text-left */}
                <td className="px-4 py-2 flex items-center text-left">
                  {" "}
                  {/* Adicionado text-left */}
                  {formatCNPJ(company.cnpj)}
                  <button
                    onClick={() => copyToClipboard(formatCNPJ(company.cnpj))}
                    className="ml-2 text-logo-dark-blue dark:text-accent-blue"
                  >
                    <FiCopy />
                  </button>
                </td>
                <td className="px-4 py-2 text-left">{company.rule}</td>{" "}
                {/* Adicionado text-left */}
                <td className="px-4 py-2 text-left">
                  {" "}
                  {/* Adicionado text-left */}
                  {company.contactMode ? company.contactMode.name : "N/A"}
                </td>
                <td className="px-4 py-2 text-left">
                  {" "}
                  {/* Adicionado text-left */}
                  {company.respFiscal?.name || "não atribuído"}
                </td>
                <td className="px-4 py-2 text-left">
                  {" "}
                  {/* Adicionado text-left */}
                  {company.respDp?.name || "não atribuído"}
                </td>
                <td className="px-4 py-2 text-left">{company.status}</td>{" "}
                {/* Adicionado text-left */}
                <td className="px-4 py-2 flex space-x-2">
                  <button
                    onClick={() => onEditCompany(company)}
                    className="text-green-500 dark:text-accent-green"
                    aria-label="Editar Empresa"
                  >
                    <FiEdit />
                  </button>
                  {user?.role === "admin" && ( // Verifica a role antes de exibir
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
