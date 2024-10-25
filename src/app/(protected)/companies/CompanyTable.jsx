// src/app/(protected)/companies/CompanyTable.jsx

"use client";

import { FiEdit, FiLock, FiClock, FiCopy } from "react-icons/fi";
import { copyToClipboard, formatCNPJ } from "../../../utils/utils";

const CompanyTable = ({
  companies,
  onEditCompany,
  onBlockCompany,
  onViewHistory,
}) => {
  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full bg-white dark:bg-gray-800">
        <thead>
          <tr>
            <th className="px-4 py-2">Número</th>
            <th className="px-4 py-2">Razão Social</th>
            <th className="px-4 py-2">CNPJ</th>
            <th className="px-4 py-2">Regime</th>
            <th className="px-4 py-2">Resp. Fiscal</th>
            <th className="px-4 py-2">Resp. DP</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id} className="border-t dark:border-gray-700">
              <td className="px-4 py-2">{company.num}</td>
              <td className="px-4 py-2">{company.name}</td>
              <td className="px-4 py-2 flex items-center">
                {formatCNPJ(company.cnpj)}
                <button
                  onClick={() => copyToClipboard(formatCNPJ(company.cnpj))}
                  className="ml-2 text-blue-500"
                >
                  <FiCopy />
                </button>
              </td>
              <td className="px-4 py-2">{company.rule}</td>
              <td className="px-4 py-2">{company.respFiscal?.name || "-"}</td>
              <td className="px-4 py-2">{company.respDp?.name || "-"}</td>
              <td className="px-4 py-2">{company.status}</td>
              <td className="px-4 py-2 flex space-x-2">
                <button
                  onClick={() => onEditCompany(company)}
                  className="text-green-500"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={() => onBlockCompany(company.id)}
                  className="text-red-500"
                >
                  <FiLock />
                </button>
                <button
                  onClick={() => onViewHistory(company)}
                  className="text-yellow-500"
                >
                  <FiClock />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyTable;
