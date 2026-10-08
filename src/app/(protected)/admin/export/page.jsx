// src/app/(protected)/admin/export/page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { formatDate } from "../../../../utils/utils";
import { FiDownload } from "react-icons/fi";
import LoadingSpinner from "../../../../components/LoadingSpinner";

// Status calculado pela API: verde/amarelo = dentro da validade, vermelho = vencido, cinza = sem certificado
const CERTIFICATE_STATUS_LABEL = {
  verde: "Ativo",
  amarelo: "Ativo",
  vermelho: "Vencido",
  cinza: "Nao informado",
};

const COLUMN_MAP = [
  { key: "num", label: "Numero" },
  { key: "name", label: "Razao Social" },
  { key: "cnpj", label: "CNPJ" },
  { key: "ie", label: "Inscricao Estadual" },
  { key: "rule", label: "Regime" },
  { key: "classi", label: "Classificacao" },
  { key: "status", label: "Status" },
  { key: "uf", label: "UF" },
  { key: "branchNumber", label: "Filial" },
  {
    key: "isHeadquarters",
    label: "E Matriz?",
    formatter: (val) => (val ? "Sim" : "Nao"),
  },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefone" },
  { key: "contact", label: "Contato" },
  {
    key: "contractInit",
    label: "Inicio do Contrato",
    formatter: (val) => (val ? formatDate(val) : ""),
  },
  {
    key: "statusUpdatedAt",
    label: "Data do Status",
    formatter: (val) => (val ? formatDate(val) : ""),
  },
  {
    key: "respFiscalId",
    label: "Responsavel Fiscal",
    formatter: (val, company) => company.respFiscal?.name || "N/A",
  },
  {
    key: "respDpId",
    label: "Responsavel DP",
    formatter: (val, company) => company.respDp?.name || "N/A",
  },
  {
    key: "respContabilId",
    label: "Responsavel Contabil",
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
    formatter: (val) => (val ? "Sim" : "Nao"),
  },
  {
    key: "sentToClientFiscal",
    label: "Fiscal Enviado?",
    formatter: (val) => (val ? "Sim" : "Nao"),
  },
  {
    key: "fiscalCompletedAt",
    label: "Fiscal Data Conclusao",
    formatter: (val) => (val ? formatDate(val) : ""),
  },
  { key: "bonusValue", label: "Nota Bonificacao (Fiscal)" },
  {
    key: "isZeroedDp",
    label: "DP Zerado?",
    formatter: (val) => (val ? "Sim" : "Nao"),
  },
  {
    key: "sentToClientDp",
    label: "DP Enviado?",
    formatter: (val) => (val ? "Sim" : "Nao"),
  },
  {
    key: "declarationsCompletedDp",
    label: "DP Obrigacoes OK?",
    formatter: (val) => (val ? "Sim" : "Nao"),
  },
  {
    key: "hasNoDpObligations",
    label: "DP Sem Obrigacoes?",
    formatter: (val) => (val ? "Sim" : "Nao"),
  },
  {
    key: "dpCompletedAt",
    label: "DP Data Conclusao",
    formatter: (val) => (val ? formatDate(val) : ""),
  },
  { key: "employeesCount", label: "Qtd. Funcionarios (DP)" },
  {
    key: "isZeroedContabil",
    label: "Contabil Zerado?",
    formatter: (val) => (val ? "Sim" : "Nao"),
  },
  {
    key: "contabilCompletedAt",
    label: "Contabil Data Conclusao",
    formatter: (val) => (val ? formatDate(val) : ""),
  },
  { key: "contabilNota", label: "Nota Contabil" },
  {
    key: "grupoId",
    label: "Grupo",
    formatter: (val, company) => company.grupo?.name || "",
  },
  {
    key: "openedByUs",
    label: "Aberta por Nos?",
    formatter: (val) => (val ? "Sim" : "Nao"),
  },
  { key: "important_info", label: "Infos Importantes" },
  { key: "obs", label: "Observacoes" },
  {
    key: "isArchived",
    label: "Arquivado?",
    formatter: (val) => (val ? "Sim" : "Nao"),
  },
  {
    // Preenchido a partir de /company/status-history-all/list (carregado só quando a coluna está marcada)
    key: "statusHistory",
    label: "Historico de Status",
  },
  {
    key: "certificateStatus",
    label: "Status do Certificado",
    formatter: (val) => CERTIFICATE_STATUS_LABEL[val] || "Nao informado",
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
  const [historyByCompany, setHistoryByCompany] = useState(null);

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

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => {
      const next = { ...prev, [filterName]: value };
      // Arquivadas são BAIXADA/DISTRATO: garante esses status ao pedir arquivadas
      if (filterName === "archived" && value !== "non-archived") {
        next.status = [...new Set([...prev.status, "BAIXADA", "DISTRATO"])];
      }
      return next;
    });
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
    if (!newColumns[index].checked) setSelectAll(false);
  };

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);
    setColumns(columns.map((c) => ({ ...c, checked: isChecked })));
  };

  const filteredList = useMemo(
    () =>
      allCompanies.filter((company) => {
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
        if (filters.archived === "archived") archivedMatch = !!company.isArchived;

        return statusMatch && respFiscalMatch && respDpMatch && archivedMatch;
      }),
    [allCompanies, filters]
  );

  // Empresas arquivadas automaticamente são sempre BAIXADA/DISTRATO
  const archivedHiddenByStatus =
    filters.archived !== "non-archived" &&
    !filters.status.includes("BAIXADA") &&
    !filters.status.includes("DISTRATO") &&
    filters.status.length > 0;

  const handleExport = async () => {
    setExporting(true);

    const filteredCompanies = filteredList;

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
      let history = historyByCompany;
      if (selectedColumns.some((c) => c.key === "statusHistory") && !history) {
        const res = await api.get("/company/status-history-all/list");
        history = {};
        res.data.forEach((h) => {
          (history[h.companyId] ||= []).push(h);
        });
        setHistoryByCompany(history);
      }

      const headers = selectedColumns.map((col) => col.label);
      const dataToExport = filteredCompanies.map((company) => {
        const row = {};
        selectedColumns.forEach((col) => {
          if (col.key === "statusHistory") {
            row[col.label] = (history?.[company.id] || [])
              .map((h) => `${formatDate(h.date)} - ${h.status}`)
              .join("\n");
            return;
          }
          const value = col.formatter
            ? col.formatter(company[col.key], company)
            : company[col.key] ?? "";
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
      {/* Filters */}
      <div className="card mb-5">
        <h2 className="text-base font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <p className="label-base">Status</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {ALL_STATUS.map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-dark-text-secondary cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={() => handleStatusFilterChange(status)}
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label-base">Responsavel Fiscal</label>
              <select
                value={filters.respFiscal}
                onChange={(e) =>
                  handleFilterChange("respFiscal", e.target.value)
                }
                className="input-base"
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
              <label className="label-base">Responsavel DP</label>
              <select
                value={filters.respDp}
                onChange={(e) => handleFilterChange("respDp", e.target.value)}
                className="input-base"
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
          <div>
            <p className="label-base">Empresas Arquivadas</p>
            <div className="flex flex-col gap-2">
              {[
                { value: "non-archived", label: "Apenas Nao Arquivadas" },
                { value: "archived", label: "Apenas Arquivadas" },
                { value: "all", label: "Incluir Todas" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text-secondary cursor-pointer"
                >
                  <input
                    type="radio"
                    name="archived"
                    value={opt.value}
                    checked={filters.archived === opt.value}
                    onChange={(e) =>
                      handleFilterChange("archived", e.target.value)
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {archivedHiddenByStatus && (
              <p className="text-xs text-amber-600 mt-2">
                Empresas arquivadas são BAIXADA ou DISTRATO. Marque um desses status para
                que elas apareçam.
              </p>
            )}
          </div>
        </div>
        {!loading && (
          <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-4">
            {filteredList.length} empresa(s) serão exportadas com os filtros atuais.
          </p>
        )}
      </div>

      {/* Columns */}
      <div className="card">
        <h2 className="text-base font-semibold mb-4">Colunas</h2>
        {loading ? (
          <LoadingSpinner size="md" />
        ) : (
          <>
            <div className="mb-4 pb-3 border-b border-gray-100 dark:border-dark-border">
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
                Selecionar / Desselecionar Todos
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {columns.map((col, index) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text-secondary cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={col.checked}
                    onChange={() => handleColumnToggle(index)}
                  />
                  {col.label}
                </label>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleExport}
                disabled={exporting || loading}
                className="btn-success"
              >
                <FiDownload size={16} />
                {exporting ? "Gerando..." : "Criar Planilha"}
              </button>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default ExportPage;
