// src/app/(protected)/certificates/CertificatesPageContent.jsx
"use client";

import { useState, useMemo } from "react";
import {
  FiShield,
  FiAlertTriangle,
  FiXCircle,
  FiDownload,
  FiUpload,
  FiSearch,
} from "react-icons/fi";
import useCachedFetch from "../../../hooks/useCachedFetch";
import api from "../../../utils/api";
import { toast } from "react-toastify";
import { formatCNPJ } from "../../../utils/utils";
import CertificateModal from "../../../components/CertificateModal";

const STATUS_LABELS = {
  vigente: "Válido",
  vencendo: "Vencendo em breve",
  vencido: "Vencido",
  sem_certificado: "Sem certificado",
};

const STATUS_BADGE = {
  vigente: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  vencendo: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  vencido: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  sem_certificado: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const formatDate = (value) => {
  if (!value) return "–";
  return new Date(value).toLocaleDateString("pt-BR");
};

const StatCard = ({ icon, label, value, colorClass }) => (
  <div className="card flex items-center gap-3">
    <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  </div>
);

const CertificatesPageContent = () => {
  const { data, loading, refresh } = useCachedFetch("/certificate/monitor");
  const companies = useMemo(() => data || [], [data]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [modalCompany, setModalCompany] = useState(undefined); // undefined = fechado; null = genérico; obj = específico
  const [exporting, setExporting] = useState(false);
  const [includeFiles, setIncludeFiles] = useState(false);

  const vencendo = useMemo(
    () =>
      companies
        .filter((c) => c.status === "vencendo")
        .sort((a, b) => (a.diasRestantes ?? 0) - (b.diasRestantes ?? 0)),
    [companies]
  );

  const vencidos = useMemo(
    () =>
      companies
        .filter((c) => c.status === "vencido")
        .sort((a, b) => (a.diasRestantes ?? 0) - (b.diasRestantes ?? 0)),
    [companies]
  );

  const filteredCompanies = useMemo(() => {
    let list = [...companies];
    if (statusFilter !== "todos") {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (search.trim()) {
      const term = normalizeText(search.trim());
      // Só compara CNPJ quando a busca tem dígitos — "".includes("") é sempre true e fazia toda empresa passar
      const digits = search.replace(/\D/g, "");
      list = list.filter(
        (c) =>
          normalizeText(c.name).includes(term) ||
          (digits && String(c.cnpj || "").replace(/\D/g, "").includes(digits))
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [companies, statusFilter, search]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/certificate/export", {
        responseType: "blob",
        params: includeFiles ? { includeFiles: "true" } : undefined,
      });
      const mime = includeFiles ? "application/zip" : "application/json";
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `certificados_validos_${dateStr}.${includeFiles ? "zip" : "json"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Exportação concluída!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao exportar certificados."
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          <StatCard
            icon={<FiAlertTriangle size={18} />}
            label="Vencendo em até 15 dias"
            value={loading ? "…" : vencendo.length}
            colorClass="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            icon={<FiXCircle size={18} />}
            label="Vencidos"
            value={loading ? "…" : vencidos.length}
            colorClass="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          />
          <StatCard
            icon={<FiShield size={18} />}
            label="Total monitorado"
            value={loading ? "…" : companies.length}
            colorClass="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalCompany(null)}
            className="btn-primary flex items-center gap-1.5 whitespace-nowrap"
          >
            <FiUpload size={14} /> Importar certificado
          </button>
          <label
            className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-dark-text-secondary whitespace-nowrap cursor-pointer select-none"
            title="Gera um .zip com a lista (JSON) e os arquivos dos certificados"
          >
            <input
              type="checkbox"
              checked={includeFiles}
              onChange={(e) => setIncludeFiles(e.target.checked)}
              disabled={exporting}
            />
            Incluir arquivos
          </label>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-ghost flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
          >
            <FiDownload size={14} /> {exporting ? "Exportando..." : "Exportar válidos"}
          </button>
        </div>
      </div>

      {(vencendo.length > 0 || vencidos.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <FiAlertTriangle size={14} /> Vencendo nos próximos 15 dias
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-border">
              {vencendo.length === 0 ? (
                <p className="p-4 text-sm text-gray-400">Nenhum certificado vencendo.</p>
              ) : (
                vencendo.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setModalCompany(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-amber-50/60 dark:hover:bg-amber-900/10 transition-colors flex items-center justify-between gap-2"
                  >
                    <span className="text-sm truncate">{c.name}</span>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {c.diasRestantes} dia(s)
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <FiXCircle size={14} /> Certificados vencidos
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-border">
              {vencidos.length === 0 ? (
                <p className="p-4 text-sm text-gray-400">Nenhum certificado vencido.</p>
              ) : (
                vencidos.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setModalCompany(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50/60 dark:hover:bg-red-900/10 transition-colors flex items-center justify-between gap-2"
                  >
                    <span className="text-sm truncate">{c.name}</span>
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                      {Math.abs(c.diasRestantes)} dia(s) atrás
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por razão social ou CNPJ..."
            className="input-base pl-8"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-base w-auto"
        >
          <option value="todos">Todos os status</option>
          <option value="vigente">Válidos</option>
          <option value="vencendo">Vencendo em breve</option>
          <option value="vencido">Vencidos</option>
          <option value="sem_certificado">Sem certificado</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: "calc(100vh - 480px)" }}>
          <table className="min-w-full table-fixed">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="table-header" style={{ minWidth: "220px" }}>Empresa</th>
                <th className="table-header w-44">CNPJ</th>
                <th className="table-header w-32">Status</th>
                <th className="table-header w-28">Validade</th>
                <th className="table-header w-20 text-center">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((c) => (
                <tr key={c.id} className="table-row">
                  <td className="table-cell truncate" title={c.name}>{c.name}</td>
                  <td className="table-cell font-mono text-xs">{formatCNPJ(String(c.cnpj))}</td>
                  <td className="table-cell">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        STATUS_BADGE[c.status] || STATUS_BADGE.sem_certificado
                      }`}
                    >
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </td>
                  <td className="table-cell text-xs">{formatDate(c.certificate?.validUntil)}</td>
                  <td className="table-cell text-center">
                    <button
                      onClick={() => setModalCompany(c)}
                      className="p-1 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      title="Gerenciar certificado"
                    >
                      <FiShield size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-cell text-center py-8 text-gray-400 dark:text-dark-text-secondary">
                    Nenhuma empresa encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalCompany !== undefined && (
        <CertificateModal
          company={modalCompany}
          onClose={() => setModalCompany(undefined)}
          onImported={refresh}
        />
      )}
    </>
  );
};

export default CertificatesPageContent;
