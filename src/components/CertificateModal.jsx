// src/components/CertificateModal.jsx
"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { FiX, FiEye, FiEyeOff, FiDownload, FiUpload, FiAlertTriangle } from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";
import { CompanyModalContext } from "../context/CompanyModalContext";
import { formatCNPJ } from "../utils/utils";

const STATUS_LABELS = {
  vigente: "Válido",
  vencendo: "Vencendo em breve",
  vencido: "Vencido",
};

const STATUS_COLORS = {
  vigente: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
  vencendo: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
  vencido: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
};

const formatDate = (value) => {
  if (!value) return "–";
  return new Date(value).toLocaleDateString("pt-BR");
};

const CertificateModal = ({ company, onClose, onImported }) => {
  const { openAddCompanyModal, refreshTrigger } = useContext(CompanyModalContext);

  const [loading, setLoading] = useState(!!company?.id);
  const [certificate, setCertificate] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingRetry, setPendingRetry] = useState(false);
  const [notFound, setNotFound] = useState(null);

  const fetchCertificate = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/certificate/company/${company.id}`);
      setCertificate(res.data.certificate);
    } catch (error) {
      toast.error("Erro ao carregar dados do certificado.");
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => {
    fetchCertificate();
  }, [fetchCertificate]);

  const submitImport = useCallback(async () => {
    if (!file || !password) {
      toast.error("Selecione o arquivo do certificado e informe a senha.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("certificate", file);
      formData.append("password", password);
      if (company?.id) formData.append("companyId", company.id);

      await api.post("/certificate/import", formData);
      toast.success("Certificado importado com sucesso!");
      setPassword("");
      setFile(null);
      setNotFound(null);
      if (company?.id) await fetchCertificate();
      onImported?.();
    } catch (error) {
      const data = error.response?.data;
      if (error.response?.status === 404 && data?.cnpj) {
        setNotFound(data);
      } else {
        toast.error(data?.message || "Erro ao importar certificado.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [file, password, company?.id, fetchCertificate, onImported]);

  // Após cadastrar a empresa a partir dos dados do certificado (fluxo "não encontrada"),
  // reenvia automaticamente a mesma importação assim que a empresa é salva.
  useEffect(() => {
    if (pendingRetry && refreshTrigger > 0) {
      setPendingRetry(false);
      setNotFound(null);
      submitImport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const handleCreateCompanyFromCertificate = () => {
    if (!notFound) return;
    setPendingRetry(true);
    openAddCompanyModal({ name: notFound.razaoSocial, cnpj: notFound.cnpj });
  };

  const handleDownload = async () => {
    if (!company?.id) return;
    try {
      const res = await api.get(`/certificate/download/${company.id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = certificate?.fileName || "certificado.pfx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Erro ao baixar o certificado.");
    }
  };

  return (
    <div className="modal-overlay px-4 py-6" onClick={onClose}>
      <div
        className="modal-box w-full max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600
            hover:bg-gray-100 dark:hover:bg-dark-card-hover dark:hover:text-dark-text transition-colors"
        >
          <FiX size={20} />
        </button>

        <h2 className="text-xl font-bold mb-1">Certificado Digital</h2>
        <p className="text-sm text-gray-500 dark:text-dark-text-secondary mb-5">
          {company?.name
            ? `${company.name}${company.cnpj ? ` · ${formatCNPJ(String(company.cnpj))}` : ""}`
            : "Importe um certificado — a empresa será identificada automaticamente pelo CNPJ."}
        </p>

        {loading ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : (
          <>
            {certificate ? (
              <div className="mb-6 p-4 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      STATUS_COLORS[certificate.status] || STATUS_COLORS.vencido
                    }`}
                  >
                    {STATUS_LABELS[certificate.status] || certificate.status}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-dark-text-secondary">
                    Validade: <strong>{formatDate(certificate.validUntil)}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-dark-text-secondary w-14 flex-shrink-0">
                    Senha:
                  </span>
                  <span className="font-mono text-sm flex-1 truncate">
                    {showPassword ? certificate.password : "••••••••"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-gray-400 hover:text-primary-500 transition-colors flex-shrink-0"
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="btn-ghost text-xs flex items-center gap-1.5"
                  >
                    <FiDownload size={14} /> Baixar certificado atual
                  </button>
                </div>
              </div>
            ) : (
              company?.id && (
                <div className="mb-6 p-4 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface text-sm text-gray-500 dark:text-dark-text-secondary">
                  Nenhum certificado cadastrado para esta empresa.
                </div>
              )
            )}

            <div className="space-y-3">
              <p className="text-sm font-semibold">Importar novo certificado</p>
              <div>
                <label className="label-base">Arquivo (.pfx / .p12)</label>
                <input
                  type="file"
                  accept=".pfx,.p12"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="input-base"
                />
              </div>
              <div>
                <label className="label-base">Senha do certificado</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base"
                  placeholder="Senha do certificado"
                  autoComplete="off"
                />
              </div>

              {notFound && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-sm text-amber-800 dark:text-amber-300">
                  <div className="flex items-start gap-2">
                    <FiAlertTriangle className="mt-0.5 flex-shrink-0" size={16} />
                    <div>
                      Nenhuma empresa cadastrada com o CNPJ{" "}
                      <strong>{formatCNPJ(String(notFound.cnpj))}</strong>
                      {notFound.razaoSocial && <> ({notFound.razaoSocial})</>}.
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={handleCreateCompanyFromCertificate}
                          className="btn-primary text-xs"
                        >
                          Cadastrar empresa agora
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="btn-ghost">
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={submitImport}
                  disabled={submitting || !file || !password}
                  className="btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiUpload size={14} /> {submitting ? "Importando..." : "Importar"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CertificateModal;
