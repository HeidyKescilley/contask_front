// src/app/(protected)/admin/export/page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { formatDate } from "../../../../utils/utils";

// Mapeamento de chaves para nomes amigáveis e funções de formatação
const COLUMN_MAP = [
  { key: "num", label: "Número" },
  { key: "name", label: "Razão Social" },
  { key: "cnpj", label: "CNPJ" },
  { key: "ie", label: "Inscrição Estadual" },
  { key: "rule", label: "Regime" },
  { key: "classi", label: "Classificação" },
  { key: "status", label: "Status" },
  { key: "uf", label: "UF" },
  { key: "branchNumber", label: "Filial" },
  {
    key: "isHeadquarters",
    label: "É Matriz?",
    formatter: (val) => (val ? "Sim" : "Não"),
  },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefone" },
  { key: "contact", label: "Contato" },
  {
    key: "contractInit",
    label: "Início do Contrato",
    formatter: (val) => (val ? formatDate(val) : ""),
  },
  {
    key: "statusUpdatedAt",
    label: "Data do Status",
    formatter: (val) => (val ? formatDate(val) : ""),
  },
  {
    key: "respFiscalId",
    label: "Responsável Fiscal",
    formatter: (val, company) => company.respFiscal?.name || "N/A",
  },
  {
    key: "respDpId",
    label: "Responsável DP",
    formatter: (val, company) => company.respDp?.name || "N/A",
  },
  {
    key: "respContabilId",
    label: "Responsável Contábil",
    formatter: (val, company) => company.respContabil?.name || "N/A",
  },
  {
    key: "contactModeId",
    label: "Forma de Envio",
    formatter: (val, company) => company.contactMode?.name || "N/A",
  },
  {
    key: "isZeroedFiscal",
    label: "Fiscal Zerado?",
    formatter: (val) => (val ? "Sim" : "Não"),
  },
  {
    key: "sentToClientFiscal",
    label: "Fiscal Enviado?",
    formatter: (val) => (val ? "Sim" : "Não"),
  },
  {
    key: "declarationsCompletedFiscal",
    label: "Fiscal Obrigações OK?",
    formatter: (val) => (val ? "Sim" : "Não"),
  },
  {
    key: "hasNoFiscalObligations",
    label: "Fiscal Sem Obrigações?",
    formatter: (val) => (val ? "Sim" : "Não"),
  },
  {
    key: "fiscalCompletedAt",
    label: "Fiscal Data Conclusão",
    formatter: (val) => (val ? formatDate(val) : ""),
  },
  { key: "bonusValue", label: "Nota Bonificação (Fiscal)" }, // <-- NOVO CAMPO ADICIONADO
  {
    key: "isZeroedDp",
    label: "DP Zerado?",
    formatter: (val) => (val ? "Sim" : "Não"),
  },
  {
    key: "sentToClientDp",
    label: "DP Enviado?",
    formatter: (val) => (val ? "Sim" : "Não"),
  },
  {
    key: "declarationsCompletedDp",
    label: "DP Obrigações OK?",
    formatter: (val) => (val ? "Sim" : "Não"),
  },
  {
    key: "hasNoDpObligations",
    label: "DP Sem Obrigações?",
    formatter: (val) => (val ? "Sim" : "Não"),
  },
  {
    key: "dpCompletedAt",
    label: "DP Data Conclusão",
    formatter: (val) => (val ? formatDate(val) : ""),
  },
  { key: "employeesCount", label: "Qtd. Funcionários (DP)" }, // <-- NOVO CAMPO ADICIONADO
  {
    key: "openedByUs",
    label: "Aberta por Nós?",
    formatter: (val) => (val ? "Sim" : "Não"),
  },
  { key: "important_info", label: "Infos Importantes" },
  { key: "obs", label: "Observações" },
  {
    key: "isArchived",
    label: "Arquivado?",
    formatter: (val) => (val ? "Sim" : "Não"),
  },
];

const ALL_STATUS = ["ATIVA", "SUSPENSA", "BAIXADA", "DISTRATO"];

const ExportPage = () => {
  const [columns, setColumns] = useState(
    COLUMN_MAP.map((col) => ({ ...col, checked: true }))
  );
  const [allCompanies, setAllCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectAll, setSelectAll] = useState(true);

  // --- ESTADO PARA OS FILTROS ---
  const [filters, setFilters] = useState({
    status: ["ATIVA"],
    respFiscal: "",
    respDp: "",
    archived: "non-archived",
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get("/company/all"), api.get("/users")])
      .then(([companyRes, userRes]) => {
        setAllCompanies(companyRes.data);
        setUsers(userRes.data.users);
      })
      .catch((error) => {
        toast.error("Erro ao buscar dados iniciais.");
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const fiscalUsers = useMemo(
    () => users.filter((u) => u.department === "Fiscal"),
    [users]
  );
  const dpUsers = useMemo(
    () => users.filter((u) => u.department === "Pessoal"),
    [users]
  );

  // --- LÓGICA PARA ATUALIZAR OS FILTROS ---
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleStatusFilterChange = (status) => {
    setFilters((prev) => {
      const currentStatus = prev.status;
      if (currentStatus.includes(status)) {
        return { ...prev, status: currentStatus.filter((s) => s !== status) };
      } else {
        return { ...prev, status: [...currentStatus, status] };
      }
    });
  };

  const handleColumnToggle = (index) => {
    const newColumns = [...columns];
    newColumns[index].checked = !newColumns[index].checked;
    setColumns(newColumns);
    if (!newColumns[index].checked) {
      setSelectAll(false);
    }
  };

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);
    setColumns(columns.map((c) => ({ ...c, checked: isChecked })));
  };

  const handleExport = () => {
    setExporting(true);

    // 1. APLICAR FILTROS
    const filteredCompanies = allCompanies.filter((company) => {
      const statusMatch =
        filters.status.length === 0 || filters.status.includes(company.status);
      const respFiscalMatch =
        !filters.respFiscal ||
        company.respFiscalId === parseInt(filters.respFiscal);
      const respDpMatch =
        !filters.respDp || company.respDpId === parseInt(filters.respDp);

      let archivedMatch = true;
      if (filters.archived === "non-archived")
        archivedMatch = !company.isArchived;
      if (filters.archived === "archived") archivedMatch = company.isArchived;

      return statusMatch && respFiscalMatch && respDpMatch && archivedMatch;
    });

    if (filteredCompanies.length === 0) {
      toast.info("Nenhuma empresa encontrada com os filtros selecionados.");
      setExporting(false);
      return;
    }

    const selectedColumns = columns.filter((col) => col.checked);

    if (selectedColumns.length === 0) {
      toast.error("Selecione pelo menos uma coluna para exportar.");
      setExporting(false);
      return;
    }

    try {
      const headers = selectedColumns.map((col) => col.label);
      const dataToExport = filteredCompanies.map((company) => {
        const row = {};
        selectedColumns.forEach((col) => {
          const value = col.formatter
            ? col.formatter(company[col.key], company)
            : company[col.key] || "";
          row[col.label] = value;
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
        header: headers,
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Empresas");
      XLSX.writeFile(workbook, "Relatorio_Empresas.xlsx");
    } catch (error) {
      toast.error("Ocorreu um erro ao gerar a planilha.");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <ProtectedRoute requiredPermissions={{ roles: ["admin"] }}>
      <div className="w-full px-8 py-8">
        <div className="bg-white dark:bg-dark-card p-6 rounded shadow-md">
          <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-dark-text">
            Exportar Dados de Empresas
          </h1>

          {/* --- SEÇÃO DE FILTROS --- */}
          <div className="border-y py-4 my-4">
            <h2 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-300">
              Filtros
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Filtro de Status */}
              <div>
                <label className="block font-medium mb-1">Status</label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {ALL_STATUS.map((status) => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status)}
                        onChange={() => handleStatusFilterChange(status)}
                        className="mr-1"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
              {/* Filtro de Responsáveis */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block font-medium mb-1">
                    Responsável Fiscal
                  </label>
                  <select
                    value={filters.respFiscal}
                    onChange={(e) =>
                      handleFilterChange("respFiscal", e.target.value)
                    }
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-dark-bg"
                  >
                    <option value="">Todos</option>
                    {fiscalUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Responsável DP
                  </label>
                  <select
                    value={filters.respDp}
                    onChange={(e) =>
                      handleFilterChange("respDp", e.target.value)
                    }
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-dark-bg"
                  >
                    <option value="">Todos</option>
                    {dpUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Filtro de Arquivadas */}
              <div>
                <label className="block font-medium mb-1">
                  Empresas Arquivadas
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="archived"
                      value="non-archived"
                      checked={filters.archived === "non-archived"}
                      onChange={(e) =>
                        handleFilterChange("archived", e.target.value)
                      }
                      className="mr-2"
                    />
                    Apenas Não Arquivadas
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="archived"
                      value="archived"
                      checked={filters.archived === "archived"}
                      onChange={(e) =>
                        handleFilterChange("archived", e.target.value)
                      }
                      className="mr-2"
                    />
                    Apenas Arquivadas
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="archived"
                      value="all"
                      checked={filters.archived === "all"}
                      onChange={(e) =>
                        handleFilterChange("archived", e.target.value)
                      }
                      className="mr-2"
                    />
                    Incluir Todas
                  </label>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Colunas
          </h2>
          {loading ? (
            <p>Carregando colunas...</p>
          ) : (
            <>
              <div className="mb-4 border-b pb-4">
                <label className="flex items-center font-semibold text-lg">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-5 h-5 mr-3"
                  />
                  Selecionar / Desselecionar Todos
                </label>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {columns.map((col, index) => (
                  <label key={col.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={col.checked}
                      onChange={() => handleColumnToggle(index)}
                      className="w-4 h-4 mr-2"
                    />
                    <span className="text-gray-800 dark:text-dark-text">
                      {col.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleExport}
                  disabled={exporting || loading}
                  className="bg-accent-green text-white font-bold py-2 px-6 rounded disabled:bg-gray-400"
                >
                  {exporting ? "Gerando..." : "Criar Planilha"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ExportPage;
