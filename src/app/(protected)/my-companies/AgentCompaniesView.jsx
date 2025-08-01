// D:\projetos\contask_v2\contask_front\src\app\(protected)\my-companies\AgentCompaniesView.jsx
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import api from "../../../utils/api";
import { toast } from "react-toastify";
import { formatDate } from "../../../utils/utils";

const AgentCompaniesView = ({ companies, user, fetchCompanies }) => {
  const [tempValues, setTempValues] = useState({});
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

  const canEditFiscal = user?.department === "Fiscal";
  const canEditDp = user?.department === "Pessoal";

  useEffect(() => {
    const initialTempValues = {};
    companies.forEach((company) => {
      initialTempValues[company.id] = {
        bonusValue: company.bonusValue ?? "",
        employeesCount: company.employeesCount ?? "",
      };
    });
    setTempValues(initialTempValues);
  }, [companies]);

  const handleCheckboxChange = useCallback(
    async (companyId, field, currentValue) => {
      try {
        const newValue = !currentValue;
        const updateData = { [field]: newValue };

        if (field === "isZeroedFiscal" && newValue) {
          updateData.bonusValue = 1;
          updateData.sentToClientFiscal = false;
        }
        if (field === "isZeroedDp" && newValue) {
          updateData.employeesCount = 0;
          updateData.sentToClientDp = false;
        }
        if (field === "hasNoFiscalObligations" && newValue) {
          updateData.declarationsCompletedFiscal = false;
        }
        if (field === "hasNoDpObligations" && newValue) {
          updateData.declarationsCompletedDp = false;
        }

        await api.patch(`/company/update-agent-data/${companyId}`, updateData);
        toast.success("Dados atualizados com sucesso!");
        fetchCompanies();
      } catch (error) {
        toast.error(error.response?.data?.message || "Erro ao atualizar.");
      }
    },
    [fetchCompanies]
  );

  const handleValueChange = useCallback((companyId, field, value) => {
    setTempValues((prev) => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        [field]: value,
      },
    }));
  }, []);

  // ALTERAÇÃO: Função de salvar que será chamada pelo onBlur
  const handleSaveOnBlur = useCallback(
    async (companyId, field) => {
      const company = companies.find((c) => c.id === companyId);
      if (!company) return;

      const valueToSave = tempValues[companyId]?.[field];

      // Não faz nada se o valor não mudou ou está vazio
      if (valueToSave === (company[field] ?? "") || valueToSave === "") return;

      const updateData = {};

      if (field === "bonusValue") {
        if (
          !company.sentToClientFiscal ||
          !company.declarationsCompletedFiscal
        ) {
          toast.error(
            "Marque 'Envio' e 'Obrigações' do Fiscal antes de salvar a bonificação."
          );
          return;
        }
        const parsedValue = parseInt(valueToSave, 10);
        if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 5) {
          toast.error("A nota para o Fiscal deve ser um número entre 0 e 5.");
          return;
        }
        updateData[field] = parsedValue;
      } else if (field === "employeesCount") {
        if (!company.sentToClientDp || !company.declarationsCompletedDp) {
          toast.error(
            "Marque 'Envio' e 'Obrigações' do DP antes de salvar o número de funcionários."
          );
          return;
        }
        const parsedValue = parseInt(valueToSave, 10);
        if (isNaN(parsedValue) || parsedValue < 0) {
          toast.error("O número de funcionários deve ser um número válido.");
          return;
        }
        updateData[field] = parsedValue;
      }

      try {
        await api.patch(`/company/update-agent-data/${companyId}`, updateData);
        toast.success("Valor salvo com sucesso!");
        fetchCompanies(); // Atualiza os dados para refletir o valor salvo
      } catch (error) {
        toast.error(error.response?.data?.message || "Erro ao salvar o valor.");
      }
    },
    [companies, tempValues, fetchCompanies]
  );

  const handleFilterChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCheckboxFilterChange = useCallback((category, value, checked) => {
    if (
      [
        "sentToClient",
        "declarationsCompleted",
        "bonusFilled",
        "isZeroed",
      ].includes(category)
    ) {
      setFilters((prev) => ({
        ...prev,
        [category]: checked ? value : null,
      }));
    } else if (["regime", "classi"].includes(category)) {
      setFilters((prev) => ({
        ...prev,
        [category]: checked
          ? [...prev[category], value]
          : prev[category].filter((item) => item !== value),
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
    let filtered = companies.filter((c) => c.status === "ATIVA");

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

    // ALTERAÇÃO: Lógica de filtros corrigida para ser ciente do departamento
    const departmentFieldPrefix =
      user?.department === "Fiscal" ? "Fiscal" : "Dp";

    if (filters.sentToClient !== null) {
      const fieldName = `sentToClient${departmentFieldPrefix}`;
      filtered = filtered.filter((c) => c[fieldName] === filters.sentToClient);
    }
    if (filters.declarationsCompleted !== null) {
      const fieldName = `declarationsCompleted${departmentFieldPrefix}`;
      filtered = filtered.filter(
        (c) => c[fieldName] === filters.declarationsCompleted
      );
    }
    if (filters.isZeroed !== null) {
      const fieldName = `isZeroed${departmentFieldPrefix}`;
      filtered = filtered.filter((c) => c[fieldName] === filters.isZeroed);
    }
    if (filters.bonusFilled !== null) {
      if (user?.department === "Fiscal") {
        filtered = filtered.filter(
          (c) =>
            (c.bonusValue !== null && c.bonusValue !== undefined) ===
            filters.bonusFilled
        );
      } else if (user?.department === "Pessoal") {
        filtered = filtered.filter(
          (c) =>
            (c.employeesCount !== null && c.employeesCount !== undefined) ===
            filters.bonusFilled
        );
      }
    }
    if (filters.regime.length > 0) {
      filtered = filtered.filter((c) => filters.regime.includes(c.rule));
    }
    if (filters.classi.length > 0) {
      filtered = filtered.filter((c) => filters.classi.includes(c.classi));
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [companies, searchTerm, filters, user]);

  return (
    <div className="bg-white dark:bg-dark-card p-4 rounded shadow mb-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text">
        Visualização Agente: {user?.department}
      </h2>

      {/* Seção de Filtros */}
      <div className="flex flex-wrap items-center justify-start mb-4 space-x-4">
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
        {/* ... (código dos filtros de checkbox - sem alteração na sua estrutura) ... */}
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
                  handleCheckboxFilterChange(
                    "sentToClient",
                    true,
                    e.target.checked
                  )
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
                  handleCheckboxFilterChange(
                    "sentToClient",
                    false,
                    e.target.checked
                  )
                }
                className="mr-1"
              />
              <span>Não Enviados</span>
            </label>
          </div>
        </div>
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
                    "declarationsCompleted",
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
                    "declarationsCompleted",
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
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800 dark:text-dark-text mb-1">
            Bonificação/Funcionários:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center text-gray-800 dark:text-dark-text whitespace-nowrap">
              <input
                type="checkbox"
                checked={filters.bonusFilled === true}
                onChange={(e) =>
                  handleCheckboxFilterChange(
                    "bonusFilled",
                    true,
                    e.target.checked
                  )
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
                  handleCheckboxFilterChange(
                    "bonusFilled",
                    false,
                    e.target.checked
                  )
                }
                className="mr-1"
              />
              <span>Vazia</span>
            </label>
          </div>
        </div>
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

      <div className="flex justify-end mt-4">
        <button
          onClick={clearFilters}
          className="bg-accent-red text-white px-4 py-2 rounded hover:bg-accent-red-light"
        >
          Limpar Filtros
        </button>
      </div>

      {/* Tabela de Empresas */}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full table-auto bg-white dark:bg-dark-card text-black dark:text-dark-text">
          {/* ... (código do thead da tabela - sem alteração) ... */}
          <thead>
            <tr className="border-b-2 border-gray-400 dark:border-dark-border">
              <th className="px-2 py-2 text-left w-16" rowSpan="2">
                Nº
              </th>
              <th className="px-2 py-2 text-left w-64" rowSpan="2">
                Razão Social
              </th>
              <th className="px-2 py-2 text-left w-16" rowSpan="2">
                Filial
              </th>
              <th className="px-2 py-2 text-left w-24" rowSpan="2">
                Regime
              </th>
              <th className="px-2 py-2 text-left w-16" rowSpan="2">
                UF
              </th>
              <th className="px-2 py-2 text-center w-16" rowSpan="2">
                Matriz
              </th>
              {canEditFiscal && (
                <th
                  colSpan="6"
                  className="px-4 py-2 text-center border-b border-l border-gray-400 dark:border-dark-border bg-blue-100 dark:bg-blue-900"
                >
                  Fiscal
                </th>
              )}
              {canEditDp && (
                <th
                  colSpan="6"
                  className="px-4 py-2 text-center border-b border-l border-gray-400 dark:border-dark-border bg-green-100 dark:bg-green-900"
                >
                  Departamento Pessoal
                </th>
              )}
            </tr>
            <tr className="border-b-2 border-gray-400 dark:border-dark-border">
              {canEditFiscal && (
                <>
                  <th className="px-2 py-2 text-center w-20 border-l border-gray-400 dark:border-dark-border bg-blue-50 dark:bg-blue-800">
                    Envio
                  </th>
                  <th className="px-2 py-2 text-center w-20 bg-blue-50 dark:bg-blue-800">
                    Obrigações Acessórias
                  </th>
                  <th className="px-2 py-2 text-center w-24 bg-blue-50 dark:bg-blue-800">
                    Sem Obrigações
                  </th>
                  <th className="px-2 py-2 text-center w-20 bg-blue-50 dark:bg-blue-800">
                    Zerado
                  </th>
                  <th className="px-2 py-2 text-center w-20 bg-blue-50 dark:bg-blue-800">
                    Nota
                  </th>
                  <th className="px-2 py-2 text-center w-28 bg-blue-50 dark:bg-blue-800">
                    Data Conclusão
                  </th>
                </>
              )}
              {canEditDp && (
                <>
                  <th className="px-2 py-2 text-center w-20 border-l border-gray-400 dark:border-dark-border bg-green-50 dark:bg-green-800">
                    Envio
                  </th>
                  <th className="px-2 py-2 text-center w-20 bg-green-50 dark:bg-green-800">
                    Obrigações Acessórias
                  </th>
                  <th className="px-2 py-2 text-center w-24 bg-green-50 dark:bg-green-800">
                    Sem Obrigações
                  </th>
                  <th className="px-2 py-2 text-center w-20 bg-green-50 dark:bg-green-800">
                    Zerado
                  </th>
                  <th className="px-2 py-2 text-center w-32 bg-green-50 dark:bg-green-800">
                    Funcionários
                  </th>
                  <th className="px-2 py-2 text-center w-28 bg-green-50 dark:bg-green-800">
                    Data Conclusão
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCompanies.map((company) => {
              const disableFiscalBonus =
                !company.sentToClientFiscal ||
                !company.declarationsCompletedFiscal ||
                company.isZeroedFiscal ||
                !canEditFiscal;
              const disableDpEmployees =
                !company.sentToClientDp ||
                !company.declarationsCompletedDp ||
                company.isZeroedDp ||
                !canEditDp;
              return (
                <tr
                  key={company.id}
                  className="border-b border-gray-300 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  {/* ... (código das células iniciais - sem alteração) ... */}
                  <td className="px-2 py-2 text-left">{company.num}</td>
                  <td
                    className="px-2 py-2 text-left whitespace-nowrap overflow-hidden text-ellipsis"
                    title={company.name}
                  >
                    {company.name}
                  </td>
                  <td className="px-2 py-2 text-left">
                    {company.branchNumber || "N/A"}
                  </td>
                  <td className="px-2 py-2 text-left">{company.rule}</td>
                  <td className="px-2 py-2 text-left">{company.uf || "N/A"}</td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={company.isHeadquarters || false}
                      readOnly
                      disabled
                      className="form-checkbox h-5 w-5 disabled:opacity-50"
                    />
                  </td>

                  {/* Dados do Fiscal */}
                  {canEditFiscal && (
                    <>
                      <td className="px-2 py-2 text-center border-l border-gray-300 dark:border-dark-border">
                        <input
                          type="checkbox"
                          checked={company.sentToClientFiscal}
                          onChange={() =>
                            handleCheckboxChange(
                              company.id,
                              "sentToClientFiscal",
                              company.sentToClientFiscal
                            )
                          }
                          disabled={company.isZeroedFiscal || !canEditFiscal}
                          className="form-checkbox h-5 w-5 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={company.declarationsCompletedFiscal}
                          onChange={() =>
                            handleCheckboxChange(
                              company.id,
                              "declarationsCompletedFiscal",
                              company.declarationsCompletedFiscal
                            )
                          }
                          disabled={
                            !canEditFiscal || company.hasNoFiscalObligations
                          }
                          className="form-checkbox h-5 w-5 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={company.hasNoFiscalObligations}
                          onChange={() =>
                            handleCheckboxChange(
                              company.id,
                              "hasNoFiscalObligations",
                              company.hasNoFiscalObligations
                            )
                          }
                          disabled={!canEditFiscal}
                          className="form-checkbox h-5 w-5 text-red-600 disabled:opacity-50"
                          title="Marcar se a empresa não possui obrigações fiscais a serem entregues"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={company.isZeroedFiscal}
                          onChange={() =>
                            handleCheckboxChange(
                              company.id,
                              "isZeroedFiscal",
                              company.isZeroedFiscal
                            )
                          }
                          disabled={!canEditFiscal}
                          className="form-checkbox h-5 w-5 text-purple-600 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-2 py-2">
                        {/* ALTERAÇÃO: Removido botão de salvar e adicionado onBlur */}
                        <input
                          type="text"
                          value={tempValues[company.id]?.bonusValue ?? ""}
                          onChange={(e) =>
                            handleValueChange(
                              company.id,
                              "bonusValue",
                              e.target.value
                            )
                          }
                          onBlur={() =>
                            handleSaveOnBlur(company.id, "bonusValue")
                          }
                          disabled={disableFiscalBonus}
                          className="w-full border px-2 py-1 bg-gray-100 dark:bg-dark-bg text-center rounded disabled:opacity-50"
                          placeholder="0-5"
                        />
                      </td>
                      <td className="px-2 py-2 text-left">
                        {company.fiscalCompletedAt
                          ? formatDate(company.fiscalCompletedAt)
                          : "N/A"}
                      </td>
                    </>
                  )}

                  {/* Dados do DP */}
                  {canEditDp && (
                    <>
                      <td className="px-2 py-2 text-center border-l border-gray-300 dark:border-dark-border">
                        <input
                          type="checkbox"
                          checked={company.sentToClientDp}
                          onChange={() =>
                            handleCheckboxChange(
                              company.id,
                              "sentToClientDp",
                              company.sentToClientDp
                            )
                          }
                          disabled={company.isZeroedDp || !canEditDp}
                          className="form-checkbox h-5 w-5 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={company.declarationsCompletedDp}
                          onChange={() =>
                            handleCheckboxChange(
                              company.id,
                              "declarationsCompletedDp",
                              company.declarationsCompletedDp
                            )
                          }
                          disabled={!canEditDp || company.hasNoDpObligations}
                          className="form-checkbox h-5 w-5 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={company.hasNoDpObligations}
                          onChange={() =>
                            handleCheckboxChange(
                              company.id,
                              "hasNoDpObligations",
                              company.hasNoDpObligations
                            )
                          }
                          disabled={!canEditDp}
                          className="form-checkbox h-5 w-5 text-red-600 disabled:opacity-50"
                          title="Marcar se a empresa não possui obrigações de DP a serem entregues"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={company.isZeroedDp}
                          onChange={() =>
                            handleCheckboxChange(
                              company.id,
                              "isZeroedDp",
                              company.isZeroedDp
                            )
                          }
                          disabled={!canEditDp}
                          className="form-checkbox h-5 w-5 text-purple-600 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-2 py-2">
                        {/* ALTERAÇÃO: Removido botão de salvar e adicionado onBlur */}
                        <input
                          type="text"
                          value={tempValues[company.id]?.employeesCount ?? ""}
                          onChange={(e) =>
                            handleValueChange(
                              company.id,
                              "employeesCount",
                              e.target.value
                            )
                          }
                          onBlur={() =>
                            handleSaveOnBlur(company.id, "employeesCount")
                          }
                          disabled={disableDpEmployees}
                          className="w-full border px-2 py-1 bg-gray-100 dark:bg-dark-bg text-center rounded disabled:opacity-50"
                          placeholder="Nº"
                        />
                      </td>
                      <td className="px-2 py-2 text-left">
                        {company.dpCompletedAt
                          ? formatDate(company.dpCompletedAt)
                          : "N/A"}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredAndSortedCompanies.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            Nenhuma empresa ATIVA encontrada para você ou para os filtros
            aplicados.
          </p>
        )}
      </div>
    </div>
  );
};

export default AgentCompaniesView;
