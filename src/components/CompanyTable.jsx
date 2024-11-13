// src/components/CompanyTable.jsx
"use client";

import { FiEdit, FiLock, FiClock, FiCopy } from "react-icons/fi";
import { copyToClipboard, formatCNPJ } from "../utils/utils";

const CompanyTable = ({
  companies,
  onEditCompany,
  onBlockCompany,
  onViewHistory,
}) => {
  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full bg-white dark:bg-dark-card text-black dark:text-dark-text">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border">
              Número
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border">
              Razão Social
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border">
              CNPJ
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border">
              Regime
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border">
              Resp. Fiscal
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border">
              Resp. DP
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border">
              Status
            </th>
            <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => {
            // Determinar a classe de fundo com base no status
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
                <td className="px-4 py-2">{company.num}</td>
                <td className="px-4 py-2">{company.name}</td>
                <td className="px-4 py-2 flex items-center">
                  {formatCNPJ(company.cnpj)}
                  <button
                    onClick={() => copyToClipboard(formatCNPJ(company.cnpj))}
                    className="ml-2 text-logo-dark-blue dark:text-accent-blue"
                  >
                    <FiCopy />
                  </button>
                </td>
                <td className="px-4 py-2">{company.rule}</td>
                <td className="px-4 py-2">
                  {company.respFiscal && company.respFiscal.name
                    ? company.respFiscal.name
                    : "não atribuído"}
                </td>
                <td className="px-4 py-2">
                  {company.respDp && company.respDp.name
                    ? company.respDp.name
                    : "não atribuído"}
                </td>
                <td className="px-4 py-2">{company.status}</td>
                <td className="px-4 py-2 flex space-x-2">
                  <button
                    onClick={() => onEditCompany(company)}
                    className="text-green-500 dark:text-accent-green"
                    aria-label="Editar Empresa"
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={() => onBlockCompany(company)}
                    className="text-red-500"
                    aria-label="Alterar Status da Empresa"
                  >
                    <FiLock />
                  </button>
                  <button
                    onClick={() => onViewHistory(company)}
                    className="text-yellow-500"
                    aria-label="Visualizar Histórico"
                  >
                    <FiClock />
                  </button>
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
