// src/app/(protected)/my-companies/AgentCompaniesView.jsx
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import api from "../../../utils/api";
import { toast } from "react-toastify";
import { FiSave } from "react-icons/fi";

const AgentCompaniesView = ({ companies, user, fetchCompanies }) => {
  const [tempBonusValues, setTempBonusValues] = useState({});

  useEffect(() => {
    const initialTempValues = {};
    companies.forEach((company) => {
      if (company.isZeroed) {
        if (user?.department === "Fiscal") {
          initialTempValues[company.id] = 1;
        } else if (user?.department === "Pessoal") {
          initialTempValues[company.id] = 0;
        }
      } else {
        if (user?.department === "Fiscal") {
          initialTempValues[company.id] = company.bonusValue || "";
        } else if (user?.department === "Pessoal") {
          initialTempValues[company.id] = company.employeesCount || "";
        }
      }
    });
    setTempBonusValues(initialTempValues);
  }, [companies, user?.department]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    sentToClient: null,
    declarationsCompleted: null,
    bonusFilled: null,
    isZeroed: null,
    regime: [],
    classi: [],
  });

  const regimes = [
    "Simples",
    "Presumido",
    "Real",
    "MEI",
    "Isenta",
    "Doméstica",
  ];
  const classificacoes = ["ICMS", "ISS", "ICMS/ISS", "Outros"];

  const handleCheckboxChange = useCallback(
    async (companyId, field, currentValue) => {
      try {
        const newValue = !currentValue;
        const updateData = { [field]: newValue };

        if (field === "isZeroed") {
          if (newValue) {
            if (user?.department === "Fiscal") {
              updateData.bonusValue = 1;
            } else if (user?.department === "Pessoal") {
              updateData.employeesCount = 0;
            }
          }
        }

        await api.patch(`/company/update-agent-data/${companyId}`, updateData);
        toast.success("Dados atualizados com sucesso!");
        fetchCompanies();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Erro ao atualizar o checkbox."
        );
      }
    },
    [fetchCompanies, user?.department]
  );

  const handleBonusChange = useCallback(
    (e, companyId) => {
      const { value } = e.target;
      if (user?.department === "Fiscal") {
        if (value === "" || (/^[0-5]$/.test(value) && value.length <= 1)) {
          setTempBonusValues((prev) => ({
            ...prev,
            [companyId]: value,
          }));
        }
      } else if (user?.department === "Pessoal") {
        if (value === "" || /^\d*$/.test(value)) {
          setTempBonusValues((prev) => ({
            ...prev,
            [companyId]: value,
          }));
        }
      }
    },
    [user]
  );

  const handleSaveBonus = useCallback(
    async (companyId, bonusValue) => {
      try {
        if (
          bonusValue === undefined ||
          bonusValue === null ||
          bonusValue === ""
        ) {
          toast.error("Por favor, preencha um valor para a bonificação.");
          return;
        }

        const companyToUpdate = companies.find((c) => c.id === companyId);
        if (companyToUpdate.isZeroed) {
          toast.info(
            "Empresa está marcada como 'Zerado'. O valor da bonificação é definido automaticamente."
          );
          return;
        }

        if (
          !companyToUpdate.sentToClient ||
          !companyToUpdate.declarationsCompleted
        ) {
          toast.error(
            "Marque 'Envio' e 'Obrigações Acessórias' antes de salvar a bonificação."
          );
          return;
        }

        const updateData = {};
        if (user?.department === "Fiscal") {
          const parsedValue = parseInt(bonusValue, 10);
          if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 5) {
            toast.error("A nota para o Fiscal deve ser entre 0 e 5.");
            return;
          }
          updateData.bonusValue = parsedValue;
        } else if (user?.department === "Pessoal") {
          const parsedValue = parseInt(bonusValue, 10);
          if (isNaN(parsedValue)) {
            toast.error("A quantidade de funcionários deve ser um número.");
            return;
          }
          updateData.employeesCount = parsedValue;
        }

        await api.patch(`/company/update-agent-data/${companyId}`, updateData);
        toast.success("Bonificação salva com sucesso!");
        fetchCompanies();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Erro ao salvar a bonificação."
        );
      }
    },
    [companies, user, fetchCompanies]
  );

  const handleFilterChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCheckboxFilterChange = useCallback((category, value, checked) => {
    if (category === "simple") {
      setFilters((prev) => ({
        ...prev,
        sentToClient: checked ? value : null,
      }));
    } else if (category === "declarations") {
      setFilters((prev) => ({
        ...prev,
        declarationsCompleted: checked ? value : null,
      }));
    } else if (category === "bonus") {
      setFilters((prev) => ({
        ...prev,
        bonusFilled: checked ? value : null,
      }));
    } else if (category === "isZeroed") {
      setFilters((prev) => ({
        ...prev,
        isZeroed: checked ? value : null,
      }));
    } else if (category === "regime") {
      setFilters((prev) => ({
        ...prev,
        regime: checked
          ? [...prev.regime, value]
          : prev.regime.filter((item) => item !== value),
      }));
    } else if (category === "classi") {
      setFilters((prev) => ({
        ...prev,
        classi: checked
          ? [...prev.classi, value]
          : prev.classi.filter((item) => item !== value),
      }));
    }
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilters({
      sentToClient: null,
      declarationsCompleted: null,
      bonusFilled: null,
      isZeroed: null,
      regime: [],
      classi: [],
    });
  }, []);

  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = [...companies];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(lowerSearchTerm) ||
          company.num?.toString().includes(lowerSearchTerm) ||
          company.cnpj?.includes(lowerSearchTerm) ||
          company.uf?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (filters.sentToClient !== null) {
      filtered = filtered.filter(
        (company) => company.sentToClient === filters.sentToClient
      );
    }
    if (filters.declarationsCompleted !== null) {
      filtered = filtered.filter(
        (company) =>
          company.declarationsCompleted === filters.declarationsCompleted
      );
    }
    if (filters.bonusFilled !== null) {
      if (user?.department === "Fiscal") {
        filtered = filtered.filter((company) =>
          filters.bonusFilled
            ? company.bonusValue !== null && company.bonusValue !== undefined
            : company.bonusValue === null || company.bonusValue === undefined
        );
      } else if (user?.department === "Pessoal") {
        filtered = filtered.filter((company) =>
          filters.bonusFilled
            ? company.employeesCount !== null &&
              company.employeesCount !== undefined
            : company.employeesCount === null ||
              company.employeesCount === undefined
        );
      }
    }
    if (filters.isZeroed !== null) {
      filtered = filtered.filter(
        (company) => company.isZeroed === filters.isZeroed
      );
    }

    if (filters.regime.length > 0) {
      filtered = filtered.filter((company) =>
        filters.regime.includes(company.rule)
      );
    }
    if (filters.classi.length > 0) {
      filtered = filtered.filter((company) =>
        filters.classi.includes(company.classi)
      );
    }

    filtered.sort((a, b) => {
      if (a.isZeroed !== b.isZeroed) {
        return a.isZeroed ? 1 : -1;
      }
      if (!a.isZeroed && !b.isZeroed && a.sentToClient !== b.sentToClient) {
        return a.sentToClient ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [companies, searchTerm, filters, user]);

  return (
    <div className="bg-white dark:bg-dark-card p-4 rounded shadow mb-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text">
        Visualização Agente: {user?.department}
      </h2>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-start mb-4 space-x-4">
        {/* Input de pesquisa */}
        <div>
          <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
            Pesquisa (Nome/Número/CNPJ/UF):
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={handleFilterChange}
            className="border px-2 py-1 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Filtro de Envio */}
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800 dark:text-dark-text mb-1">
            Envio:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap">
              <input
                type="checkbox"
                checked={filters.sentToClient === true}
                onChange={(e) =>
                  handleCheckboxFilterChange("simple", true, e.target.checked)
                }
                className="mr-1"
              />
              <span>Enviados</span>
            </label>
            <label className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap">
              <input
                type="checkbox"
                checked={filters.sentToClient === false}
                onChange={(e) =>
                  handleCheckboxFilterChange("simple", false, e.target.checked)
                }
                className="mr-1"
              />
              <span>Não Enviados</span>
            </label>
          </div>
        </div>

        {/* Filtro de Declarações Acessórias */}
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800 dark:text-dark-text mb-1">
            Obrigações Acessórias:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap">
              <input
                type="checkbox"
                checked={filters.declarationsCompleted === true}
                onChange={(e) =>
                  handleCheckboxFilterChange(
                    "declarations",
                    true,
                    e.target.checked
                  )
                }
                className="mr-1"
              />
              <span>Concluídas</span>
            </label>
            <label className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap">
              <input
                type="checkbox"
                checked={filters.declarationsCompleted === false}
                onChange={(e) =>
                  handleCheckboxFilterChange(
                    "declarations",
                    false,
                    e.target.checked
                  )
                }
                className="mr-1"
              />
              <span>Não Concluídas</span>
            </label>
          </div>
        </div>

        {/* Filtro de Bonificação */}
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800 dark:text-dark-text mb-1">
            Bonificação:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap">
              <input
                type="checkbox"
                checked={filters.bonusFilled === true}
                onChange={(e) =>
                  handleCheckboxFilterChange("bonus", true, e.target.checked)
                }
                className="mr-1"
              />
              <span>Preenchida</span>
            </label>
            <label className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap">
              <input
                type="checkbox"
                checked={filters.bonusFilled === false}
                onChange={(e) =>
                  handleCheckboxFilterChange("bonus", false, e.target.checked)
                }
                className="mr-1"
              />
              <span>Vazia</span>
            </label>
          </div>
        </div>

        {/* Filtro de Zerado */}
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800 dark:text-dark-text mb-1">
            Zerado:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap">
              <input
                type="checkbox"
                checked={filters.isZeroed === true}
                onChange={(e) =>
                  handleCheckboxFilterChange("isZeroed", true, e.target.checked)
                }
                className="mr-1"
              />
              <span>Zeradas</span>
            </label>
            <label className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap">
              <input
                type="checkbox"
                checked={filters.isZeroed === false}
                onChange={(e) =>
                  handleCheckboxFilterChange(
                    "isZeroed",
                    false,
                    e.target.checked
                  )
                }
                className="mr-1"
              />
              <span>Não Zeradas</span>
            </label>
          </div>
        </div>

        {/* Filtro de Regime */}
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800 dark:text-dark-text mb-1">
            Regime:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {regimes.map((regime) => (
              <label
                key={regime}
                className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap"
              >
                <input
                  type="checkbox"
                  value={regime}
                  checked={filters.regime.includes(regime)}
                  onChange={(e) =>
                    handleCheckboxFilterChange(
                      "regime",
                      regime,
                      e.target.checked
                    )
                  }
                  className="mr-1"
                />
                <span>{regime}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filtro de Classificação */}
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800 dark:text-dark-text mb-1">
            Classificação:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {classificacoes.map((classi) => (
              <label
                key={classi}
                className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap"
              >
                <input
                  type="checkbox"
                  value={classi}
                  checked={filters.classi.includes(classi)}
                  onChange={(e) =>
                    handleCheckboxFilterChange(
                      "classi",
                      classi,
                      e.target.checked
                    )
                  }
                  className="mr-1"
                />
                <span>{classi}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Botão "Limpar Filtros" */}
      <div className="flex justify-end mt-4">
        <button
          onClick={clearFilters}
          className="bg-accent-red text-white px-4 py-2 rounded hover:bg-accent-red-light"
        >
          Limpar Filtros
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full table-fixed bg-white dark:bg-dark-card text-black dark:text-dark-text">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-16">
                Nº
              </th>
              <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-16">
                Filial
              </th>
              <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-56">
                Razão Social
              </th>
              <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-24">
                Regime
              </th>
              <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-16">
                UF
              </th>
              <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-16">
                Matriz
              </th>{" "}
              {/* Nova coluna Matriz */}
              <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-20">
                Envio
              </th>
              <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-32">
                Obrigações Acessórias
              </th>
              <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-28">
                Bonificação
              </th>
              <th className="px-4 py-2 border-b border-gray-400 dark:border-dark-border text-left w-20">
                Zerado
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCompanies.map((company) => (
              <tr
                key={company.id}
                className={`border-b border-gray-400 dark:border-dark-border ${
                  company.isZeroed ? "bg-purple-100 dark:bg-purple-900" : ""
                }`}
              >
                <td className="px-4 py-2 text-left">{company.num}</td>
                <td className="px-4 py-2 text-left">
                  {company.branchNumber || "N/A"}
                </td>
                <td
                  className="px-4 py-2 text-left whitespace-nowrap overflow-hidden text-ellipsis"
                  title={company.name}
                >
                  {company.name.length > 50
                    ? company.name.substring(0, 50) + "..."
                    : company.name}
                </td>
                <td className="px-4 py-2 text-left">{company.rule}</td>
                <td className="px-4 py-2 text-left">{company.uf || "N/A"}</td>
                <td className="px-4 py-2 text-left">
                  {" "}
                  {/* Nova célula para Matriz */}
                  <input
                    type="checkbox"
                    checked={company.isHeadquarters || false}
                    disabled // Desabilita edição direta na tabela
                    className="form-checkbox h-5 w-5 text-blue-600 disabled:opacity-50"
                  />
                </td>
                <td className="px-4 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={company.sentToClient || false}
                    onChange={() =>
                      handleCheckboxChange(
                        company.id,
                        "sentToClient",
                        company.sentToClient
                      )
                    }
                    disabled={company.isZeroed}
                    className="form-checkbox h-5 w-5 text-blue-600 disabled:opacity-50"
                  />
                </td>
                <td className="px-4 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={company.declarationsCompleted || false}
                    onChange={() =>
                      handleCheckboxChange(
                        company.id,
                        "declarationsCompleted",
                        company.declarationsCompleted
                      )
                    }
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </td>
                <td className="px-4 py-2 flex items-center space-x-1 justify-start">
                  <input
                    type="text"
                    value={
                      tempBonusValues[company.id] !== undefined
                        ? tempBonusValues[company.id]
                        : ""
                    }
                    onChange={(e) => handleBonusChange(e, company.id)}
                    disabled={
                      company.isZeroed ||
                      !company.sentToClient ||
                      !company.declarationsCompleted
                    }
                    className="w-20 border px-2 py-1 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded text-left disabled:opacity-50"
                    placeholder={
                      user?.department === "Fiscal" ? "0-5" : "Funcionários"
                    }
                  />
                  <button
                    onClick={() =>
                      handleSaveBonus(company.id, tempBonusValues[company.id])
                    }
                    disabled={
                      company.isZeroed ||
                      !company.sentToClient ||
                      !company.declarationsCompleted
                    }
                    className="bg-accent-blue text-white p-2 rounded hover:bg-logo-dark-blue disabled:opacity-50"
                  >
                    <FiSave size={16} />
                  </button>
                </td>
                <td className="px-4 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={company.isZeroed || false}
                    onChange={() =>
                      handleCheckboxChange(
                        company.id,
                        "isZeroed",
                        company.isZeroed
                      )
                    }
                    className="form-checkbox h-5 w-5 text-purple-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAndSortedCompanies.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            Nenhuma empresa encontrada para esta visualização ou filtros.
          </p>
        )}
      </div>
    </div>
  );
};

export default AgentCompaniesView;
