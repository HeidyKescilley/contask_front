// src/components/CompanyForm.jsx

"use client";

import { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiPlus,
  FiMail,
  FiAlertCircle,
  FiCheckCircle,
  FiCheck,
  FiClipboard,
  FiTrash2,
} from "react-icons/fi";
import api from "../utils/api";
import AddContactModeModal from "./AddContactModeModal";
import { useAuth } from "../hooks/useAuth";
import {
  applyDocumentMask,
  validateDocument,
  getDocumentType,
  formatCNPJ,
  formatCPF,
} from "../utils/utils";

// ── Divisor de seção ──────────────────────────────────────────────────────────
const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-2 mb-2 mt-3 first:mt-0">
    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-dark-text-secondary whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 h-px bg-gray-100 dark:bg-dark-border" />
  </div>
);

// ── Toggle pill para checkboxes ────────────────────────────────────────────────
const TogglePill = ({ checked, onChange, label, disabled = false }) => (
  <label
    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer
      text-sm font-medium transition-all duration-150 select-none
      ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      ${
        checked
          ? "border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-500"
          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-secondary"
      }`}
  >
    <input
      type="checkbox"
      className="sr-only"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
    <span
      className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors
        ${checked
          ? "bg-primary-500 text-white"
          : "border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface"
        }`}
    >
      {checked && <FiCheck size={9} strokeWidth={3} />}
    </span>
    {label}
  </label>
);


// ── Componente principal ──────────────────────────────────────────────────────
const CompanyForm = ({ initialData = {}, onCancel, onSubmit, type }) => {
  const { user } = useAuth();
  const data = initialData || {};

  const parseEmails = (emailStr) => {
    if (!emailStr) return [];
    return emailStr.split(",").map((e) => e.trim()).filter(Boolean);
  };

  const [formData, setFormData] = useState({
    id:               data.id               || "",
    num:              data.num              || "",
    name:             data.name             || "",
    cnpj:             data.cnpj             || "",
    ie:               data.ie              || "",
    email:            data.email            || "",
    phone:            data.phone            || "",
    rule:             data.rule             || "Simples",
    classi:           data.classi           || "Outros",
    uf:               data.uf              || "DF",
    contact:          data.contact          || "",
    contractInit:     data.contractInit     || "",
    openedByUs:       data.openedByUs       || false,
    important_info:   data.important_info   || "",
    obs:              data.obs              || "",
    respFiscalId:     data.respFiscalId     || "",
    respContabilId:   data.respContabilId   || "",
    respDpId:         data.respDpId         || "",
    contactModeId:    data.contactModeId    || "",
    branchNumber:     data.isHeadquarters ? "1" : (data.branchNumber || ""),
    isHeadquarters:   data.isHeadquarters   || false,
  });

  // ── Email tags ────────────────────────────────────────────────────────────
  const [emails, setEmails]         = useState(() => parseEmails(data.email));
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const emailInputRef               = useRef(null);
  const EMAIL_REGEX                 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ── CPF/CNPJ ─────────────────────────────────────────────────────────────
  const initDocDisplay = (raw) => {
    if (!raw) return "";
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 11) return formatCPF(digits);
    if (digits.length === 14) return formatCNPJ(digits);
    return digits;
  };
  const [cnpjDisplay, setCnpjDisplay] = useState(() => initDocDisplay(data.cnpj));
  const [cnpjError, setCnpjError]     = useState("");
  const [cnpjValid, setCnpjValid]     = useState(false);

  // ── Listas ────────────────────────────────────────────────────────────────
  const rules        = ["Simples", "Presumido", "Real", "MEI", "Isenta", "Doméstica"];
  const classificacoes = ["ICMS", "ISS", "ICMS/ISS", "Outros"];
  const ufs = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO",
    "MA","MT","MS","MG","PA","PB","PR","PE","PI",
    "RJ","RN","RS","RO","RR","SC","SP","SE","TO",
  ];

  const [fiscalUsers, setFiscalUsers]   = useState([]);
  const [contabilUsers, setContabilUsers] = useState([]);
  const [dpUsers, setDpUsers]           = useState([]);
  const [contactModes, setContactModes] = useState([]);
  const [showAddContactModeModal, setShowAddContactModeModal] = useState(false);

  // ── Obrigações Acessórias ────────────────────────────────────────────────
  const [companyObligations, setCompanyObligations] = useState([]);
  const [excludedObligations, setExcludedObligations] = useState([]);
  const [allObligations, setAllObligations] = useState([]);
  const [obligationsLoading, setObligationsLoading] = useState(false);
  const [addOblSelect, setAddOblSelect] = useState("");

  // ── Impostos ─────────────────────────────────────────────────────────────
  const [companyTaxes, setCompanyTaxes] = useState([]);
  const [excludedTaxes, setExcludedTaxes] = useState([]);
  const [allTaxes, setAllTaxes] = useState([]);
  const [taxesLoading, setTaxesLoading] = useState(false);
  const [addTaxSelect, setAddTaxSelect] = useState("");

  const fetchCompanyObligations = async () => {
    if (!data?.id) return;
    setObligationsLoading(true);
    try {
      const res = await api.get(`/obligation/company/${data.id}`);
      setCompanyObligations(res.data.filter((o) => !o.isManuallyExcluded));
      setExcludedObligations(res.data.filter((o) => o.isManuallyExcluded));
    } catch {
      // silencioso
    } finally {
      setObligationsLoading(false);
    }
  };

  const fetchAllObligations = async () => {
    try {
      const res = await api.get("/obligation/all");
      setAllObligations(res.data);
    } catch {}
  };

  const fetchCompanyTaxes = async () => {
    if (!data?.id) return;
    setTaxesLoading(true);
    try {
      const res = await api.get(`/tax/company/${data.id}`);
      setCompanyTaxes(res.data.filter((t) => !t.isManuallyExcluded && t.statusId));
      setExcludedTaxes(res.data.filter((t) => t.isManuallyExcluded));
    } catch {
      // silencioso
    } finally {
      setTaxesLoading(false);
    }
  };

  const fetchAllTaxes = async () => {
    try {
      const res = await api.get("/tax/all");
      setAllTaxes(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchContactModes();
    if (type === "edit") {
      fetchUsersByDepartment("Fiscal",  setFiscalUsers);
      fetchUsersByDepartment("Contábil", setContabilUsers);
      fetchUsersByDepartment("Pessoal", setDpUsers);
      fetchCompanyObligations();
      fetchCompanyTaxes();
      if (user?.role === "admin") {
        fetchAllObligations();
        fetchAllTaxes();
      }
    }
  }, [type]);

  const fetchContactModes = async () => {
    try {
      const res = await api.get("/company/contact-modes");
      setContactModes(res.data);
    } catch (err) {
      console.error("Erro ao buscar formas de envio:", err);
    }
  };

  const fetchUsersByDepartment = async (department, setUsers) => {
    try {
      const res = await api.get(`/department/${department}`);
      setUsers(res.data);
    } catch (err) {
      console.error(`Erro ao buscar usuários do departamento ${department}:`, err);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: inputType === "checkbox" ? checked : value }));
  };

  // Matriz → Filial 1 automático
  const handleIsHeadquartersChange = (e) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      isHeadquarters: checked,
      branchNumber: checked ? "1" : "",
    }));
  };

  const handleAddContactMode = async (name) => {
    try {
      const res = await api.post("/company/contact-modes", { name });
      fetchContactModes();
      setFormData((prev) => ({ ...prev, contactModeId: res.data.contactMode.id }));
      setShowAddContactModeModal(false);
    } catch (err) {
      console.error("Erro ao adicionar nova forma de envio:", err);
    }
  };

  // CPF/CNPJ
  const handleCnpjChange = (e) => {
    const masked = applyDocumentMask(e.target.value);
    const digits = e.target.value.replace(/\D/g, "").slice(0, 14);
    setCnpjDisplay(masked);
    setCnpjError("");
    setCnpjValid(false);
    setFormData((prev) => ({ ...prev, cnpj: digits }));
  };

  const handleCnpjBlur = () => {
    const digits = formData.cnpj;
    if (!digits) return;
    const docType = getDocumentType(digits);
    if (!docType) {
      setCnpjError("Digite 11 dígitos (CPF) ou 14 dígitos (CNPJ)");
      setCnpjValid(false);
    } else if (!validateDocument(digits)) {
      setCnpjError(`${docType} inválido`);
      setCnpjValid(false);
    } else {
      setCnpjError("");
      setCnpjValid(true);
    }
  };

  // Emails
  const tryAddEmail = (value) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return false;
    if (!EMAIL_REGEX.test(trimmed)) { setEmailError("E-mail inválido"); return false; }
    if (emails.includes(trimmed)) { setEmailInput(""); setEmailError(""); return true; }
    setEmails((prev) => [...prev, trimmed]);
    setEmailInput("");
    setEmailError("");
    emailInputRef.current?.focus();
    return true;
  };

  const removeEmail = (index) => setEmails((prev) => prev.filter((_, i) => i !== index));

  const handleEmailInputChange = (e) => {
    const val = e.target.value;
    if ((val.endsWith(" ") || val.endsWith(",")) && val.trim()) {
      tryAddEmail(val);
    } else {
      setEmailInput(val);
      if (emailError) setEmailError("");
    }
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); tryAddEmail(emailInput); }
    if (e.key === "Backspace" && emailInput === "" && emails.length > 0) removeEmail(emails.length - 1);
  };

  // Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateDocument(formData.cnpj)) { handleCnpjBlur(); return; }

    let finalEmails = [...emails];
    if (emailInput.trim()) {
      const trimmed = emailInput.trim().toLowerCase();
      if (!EMAIL_REGEX.test(trimmed)) { setEmailError("E-mail inválido — corrija ou remova antes de salvar"); return; }
      if (!finalEmails.includes(trimmed)) { finalEmails = [...finalEmails, trimmed]; setEmails(finalEmails); setEmailInput(""); }
    }
    if (finalEmails.length === 0) { setEmailError("Adicione ao menos um e-mail"); return; }

    onSubmit({
      ...formData,
      email:          finalEmails.join(","),
      respFiscalId:   formData.respFiscalId   || null,
      respContabilId: formData.respContabilId || null,
      respDpId:       formData.respDpId       || null,
      contactModeId:  formData.contactModeId  || null,
      contact:        formData.contact        || null,
      contractInit:   formData.contractInit   || null,
      important_info: formData.important_info || "",
      obs:            formData.obs            || "",
      branchNumber:   formData.branchNumber   || null,
    });
  };

  // ── Handler toggle obrigação manual ────────────────────────────────────────
  const handleToggleObligation = async (obligationId, action) => {
    try {
      await api.post(`/obligation/company/${data.id}/toggle`, { obligationId, action });
      await fetchCompanyObligations();
    } catch (err) {
      console.error("Erro ao alternar obrigação:", err);
    }
  };

  const handleAddObligation = async () => {
    if (!addOblSelect) return;
    await handleToggleObligation(parseInt(addOblSelect, 10), "add");
    setAddOblSelect("");
  };

  // ── Handler toggle imposto manual ───────────────────────────────────────────
  const handleToggleTax = async (taxId, action) => {
    try {
      await api.post(`/tax/company/${data.id}/toggle`, { taxId, action });
      await fetchCompanyTaxes();
    } catch (err) {
      console.error("Erro ao alternar imposto:", err);
    }
  };

  const handleAddTax = async () => {
    if (!addTaxSelect) return;
    await handleToggleTax(parseInt(addTaxSelect, 10), "add");
    setAddTaxSelect("");
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-5">
          {type === "add" ? "Nova Empresa" : "Editar Empresa"}
        </h2>

        {/* ─────────────────────────────────────────────────────────────────
            Seção 1 · Identificação
        ───────────────────────────────────────────────────────────────── */}
        <SectionDivider label="Identificação" />
        <div className="grid grid-cols-12 gap-3 mb-2">

          {/* Nº */}
          <div className="col-span-1 min-w-0">
            <label className="label-base">
              Nº <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="num"
              className="input-base"
              value={formData.num}
              onChange={handleChange}
              required
              disabled={type === "edit" && user?.role !== "admin"}
            />
          </div>

          {/* Filial */}
          <div className="col-span-2 min-w-0">
            <label className="label-base">Filial</label>
            <input
              type="text"
              name="branchNumber"
              className="input-base"
              value={formData.isHeadquarters ? "1" : (formData.branchNumber || "")}
              onChange={handleChange}
              disabled={formData.isHeadquarters}
              placeholder="Ex: 2, 3…"
            />
          </div>

          {/* Razão Social */}
          <div className="col-span-5 min-w-0">
            <label className="label-base">
              Razão Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              className="input-base"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* CPF / CNPJ */}
          <div className="col-span-4 min-w-0">
            <label className="label-base">
              {getDocumentType(formData.cnpj) || "CPF / CNPJ"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={cnpjDisplay}
                onChange={handleCnpjChange}
                onBlur={handleCnpjBlur}
                required
                maxLength={18}
                disabled={type === "edit" && user?.role !== "admin"}
                placeholder="000.000.000-00 / 00.000.000/0000-00"
                className={`input-base pr-7 ${
                  cnpjError
                    ? "border-red-500 focus:ring-red-500/40 focus:border-red-500"
                    : cnpjValid
                    ? "border-emerald-500 focus:ring-emerald-500/40 focus:border-emerald-500"
                    : ""
                }`}
              />
              {(cnpjError || cnpjValid) && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {cnpjError
                    ? <FiAlertCircle size={14} className="text-red-500" />
                    : <FiCheckCircle size={14} className="text-emerald-500" />
                  }
                </span>
              )}
            </div>
            {cnpjError && (
              <small className="text-xs text-red-500 mt-0.5 block">{cnpjError}</small>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            Seção 2 · Enquadramento Fiscal
        ───────────────────────────────────────────────────────────────── */}
        <SectionDivider label="Enquadramento Fiscal" />
        <div className="grid grid-cols-4 gap-3 mb-2">
          <div>
            <label className="label-base">Inscrição Estadual</label>
            <input
              type="text"
              name="ie"
              className="input-base"
              value={formData.ie}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className="label-base">
              Regime <span className="text-red-500">*</span>
            </label>
            <select name="rule" className="input-base" value={formData.rule} onChange={handleChange} required>
              {rules.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">
              Classificação <span className="text-red-500">*</span>
            </label>
            <select name="classi" className="input-base" value={formData.classi} onChange={handleChange} required>
              {classificacoes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">
              UF <span className="text-red-500">*</span>
            </label>
            <select name="uf" className="input-base" value={formData.uf} onChange={handleChange} required>
              {ufs.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            Seção 3 · Contato
        ───────────────────────────────────────────────────────────────── */}
        <SectionDivider label="Contato" />
        <div className="grid grid-cols-4 gap-3 mb-2">

          {/* E-mail (tag input) */}
          <div className="col-span-3">
            <label className="label-base">
              E-mail <span className="text-red-500">*</span>
            </label>
            <div
              className={`min-h-[40px] w-full border rounded-xl px-2 py-1.5
                bg-gray-50 border-gray-200 dark:bg-dark-surface dark:border-dark-border
                focus-within:ring-2 focus-within:ring-primary-500/40 focus-within:border-primary-500
                transition-all duration-150 flex flex-wrap gap-1.5 items-center`}
            >
              {emails.map((email, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-primary-100 text-primary-700
                    dark:bg-primary-900/30 dark:text-primary-300
                    text-xs font-medium px-2 py-0.5 rounded-full max-w-[220px]"
                >
                  <FiMail size={10} className="flex-shrink-0" />
                  <span className="truncate" title={email}>{email}</span>
                  <button
                    type="button"
                    onClick={() => removeEmail(idx)}
                    className="flex-shrink-0 hover:text-red-500 transition-colors ml-0.5"
                    title="Remover e-mail"
                  >
                    <FiX size={10} />
                  </button>
                </span>
              ))}
              <input
                ref={emailInputRef}
                type="text"
                value={emailInput}
                onChange={handleEmailInputChange}
                onKeyDown={handleEmailKeyDown}
                placeholder={emails.length === 0 ? "Digite o e-mail e pressione Enter ou Espaço" : "Adicionar mais…"}
                className="flex-1 min-w-[180px] bg-transparent text-sm text-gray-800 dark:text-dark-text
                  placeholder-gray-400 dark:placeholder-gray-500 outline-none py-0.5 px-1"
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              {emailError ? (
                <small className="flex items-center gap-1 text-xs text-red-500">
                  <FiAlertCircle size={11} /> {emailError}
                </small>
              ) : (
                <small className="text-xs text-gray-400 dark:text-gray-500">
                  <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-dark-card rounded text-[10px]">Enter</kbd>
                  {" · "}
                  <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-dark-card rounded text-[10px]">Espaço</kbd>
                  {" · "}
                  <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-dark-card rounded text-[10px]">,</kbd>
                  {" para adicionar · "}
                  <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-dark-card rounded text-[10px]">⌫</kbd>
                  {" para remover o último"}
                </small>
              )}
              <button
                type="button"
                onClick={() => tryAddEmail(emailInput)}
                disabled={!emailInput.trim()}
                className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400
                  hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-2 shrink-0"
              >
                <FiPlus size={12} /> Adicionar
              </button>
            </div>
          </div>

          {/* Telefone */}
          <div className="col-span-1">
            <label className="label-base">Telefone</label>
            <input
              type="tel"
              name="phone"
              className="input-base"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            Seção 4 · Administrativo
        ───────────────────────────────────────────────────────────────── */}
        <SectionDivider label="Administrativo" />
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="label-base">Contato na Empresa</label>
            <input
              type="text"
              name="contact"
              className="input-base"
              value={formData.contact || ""}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className="label-base">Início do Contrato</label>
            <input
              type="date"
              name="contractInit"
              className="input-base"
              value={formData.contractInit || ""}
              onChange={handleChange}
            />
          </div>
          {type === "edit" && (
            <div>
              <label className="label-base flex items-center justify-between">
                <span>Forma de Envio</span>
                <button
                  type="button"
                  onClick={() => setShowAddContactModeModal(true)}
                  className="text-[10px] text-primary-600 dark:text-primary-400 hover:underline font-normal normal-case tracking-normal"
                >
                  + Nova forma
                </button>
              </label>
              <select
                name="contactModeId"
                className="input-base"
                value={formData.contactModeId || ""}
                onChange={handleChange}
              >
                <option value="">Opcional</option>
                {contactModes.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            Checkboxes · Configurações
        ───────────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-4">
          <TogglePill
            checked={formData.isHeadquarters}
            onChange={handleIsHeadquartersChange}
            label="Empresa Matriz"
          />
          {type === "add" && (
            <TogglePill
              checked={formData.openedByUs}
              onChange={(e) => setFormData((prev) => ({ ...prev, openedByUs: e.target.checked }))}
              label="Aberta pela Contelb"
            />
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            Seção 5 · Responsáveis (somente edição)
        ───────────────────────────────────────────────────────────────── */}
        {type === "edit" && (
          <>
            <SectionDivider label="Responsáveis" />
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="label-base">Responsável Fiscal</label>
                <select name="respFiscalId" className="input-base" value={formData.respFiscalId || ""} onChange={handleChange}>
                  <option value="">Nenhum</option>
                  {fiscalUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">Responsável Contábil</label>
                <select name="respContabilId" className="input-base" value={formData.respContabilId || ""} onChange={handleChange}>
                  <option value="">Nenhum</option>
                  {contabilUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">Responsável DP</label>
                <select name="respDpId" className="input-base" value={formData.respDpId || ""} onChange={handleChange}>
                  <option value="">Nenhum</option>
                  {dpUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            Seção 6 · Obrigações Acessórias (somente edição)
        ───────────────────────────────────────────────────────────────── */}
        {type === "edit" && (
          <>
            <SectionDivider label="Obrigações Acessórias" />
            {obligationsLoading ? (
              <p className="text-xs text-gray-400 mb-4">Carregando obrigações...</p>
            ) : companyObligations.length === 0 ? (
              <p className="text-xs text-gray-400 mb-4">
                Nenhuma obrigação aplicável a esta empresa no período atual.
              </p>
            ) : (
              <div className="mb-4 space-y-1.5">
                {companyObligations.map((obl) => (
                  <div
                    key={obl.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FiClipboard size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800 dark:text-dark-text truncate">{obl.name}</span>
                      {obl.isManuallyAssigned && (
                        <span className="badge badge-amber text-[10px]">Manual</span>
                      )}
                      {obl.status === "disabled" && (
                        <span className="badge badge-gray text-[10px]">Desabilitada</span>
                      )}
                      {obl.status === "completed" && (
                        <span className="badge badge-green text-[10px]">Concluída</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {obl.deadlineFormatted && (
                        <span className="text-[11px] text-gray-400">até {obl.deadlineFormatted}</span>
                      )}
                      {user?.role === "admin" && obl.isManuallyAssigned && (
                        <button
                          type="button"
                          onClick={() => handleToggleObligation(obl.id, "remove")}
                          className="btn-ghost !p-1 text-red-400 hover:text-red-600"
                          title="Remover obrigação manual"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      )}
                      {user?.role === "admin" && !obl.isManuallyAssigned && (
                        <button
                          type="button"
                          onClick={() => handleToggleObligation(obl.id, "exclude")}
                          className="btn-ghost !p-1 text-orange-400 hover:text-orange-600"
                          title="Excluir desta empresa (exceção)"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {/* Obrigações excluídas manualmente — exibir apenas para admins */}
                {user?.role === "admin" && excludedObligations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-dark-border">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">Excluídas desta empresa</p>
                    {excludedObligations.map((obl) => (
                      <div
                        key={`excl-${obl.id}`}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card opacity-60"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FiClipboard size={13} className="text-gray-300 flex-shrink-0" />
                          <span className="text-sm text-gray-400 dark:text-dark-text-secondary truncate line-through">{obl.name}</span>
                          <span className="badge badge-gray text-[10px]">Excluída</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleObligation(obl.id, "include")}
                          className="btn-ghost !p-1 !px-2 text-xs text-emerald-600 hover:text-emerald-700"
                          title="Re-incluir esta obrigação"
                        >
                          Incluir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Adicionar obrigação manual (admin only) */}
            {user?.role === "admin" && allObligations.length > 0 && (
              <div className="flex gap-2 mb-4">
                <select
                  value={addOblSelect}
                  onChange={(e) => setAddOblSelect(e.target.value)}
                  className="input-base flex-1"
                >
                  <option value="">+ Adicionar obrigação manualmente...</option>
                  {allObligations
                    .filter((o) => !companyObligations.some((co) => co.id === o.id))
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        [{o.department}] {o.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddObligation}
                  disabled={!addOblSelect}
                  className="btn-primary disabled:opacity-40"
                >
                  <FiPlus size={14} />
                  Adicionar
                </button>
              </div>
            )}
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            Seção 7 · Impostos (somente edição)
        ───────────────────────────────────────────────────────────────── */}
        {type === "edit" && (
          <>
            <SectionDivider label="Impostos" />
            {taxesLoading ? (
              <p className="text-xs text-gray-400 mb-4">Carregando impostos...</p>
            ) : companyTaxes.length === 0 ? (
              <p className="text-xs text-gray-400 mb-4">
                Nenhum imposto aplicável a esta empresa no período atual.
              </p>
            ) : (
              <div className="mb-4 space-y-1.5">
                {companyTaxes.map((tax) => (
                  <div
                    key={tax.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-gray-800 dark:text-dark-text truncate">{tax.name}</span>
                      {tax.isManuallyAssigned && (
                        <span className="badge badge-amber text-[10px]">Manual</span>
                      )}
                      {tax.status === "completed" && (
                        <span className="badge badge-green text-[10px]">Apurado</span>
                      )}
                    </div>
                    {user?.role === "admin" && (
                      <div className="flex-shrink-0">
                        {tax.isManuallyAssigned ? (
                          <button
                            type="button"
                            onClick={() => handleToggleTax(tax.id, "remove")}
                            className="btn-ghost !p-1 text-red-400 hover:text-red-600"
                            title="Remover imposto manual"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleTax(tax.id, "exclude")}
                            className="btn-ghost !p-1 text-orange-400 hover:text-orange-600"
                            title="Excluir desta empresa"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {/* Impostos excluídos — admin only */}
                {user?.role === "admin" && excludedTaxes.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-dark-border">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">Excluídos desta empresa</p>
                    {excludedTaxes.map((tax) => (
                      <div
                        key={`excl-tax-${tax.id}`}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card opacity-60"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-gray-400 dark:text-dark-text-secondary truncate line-through">{tax.name}</span>
                          <span className="badge badge-gray text-[10px]">Excluído</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleTax(tax.id, "include")}
                          className="btn-ghost !p-1 !px-2 text-xs text-emerald-600 hover:text-emerald-700"
                          title="Re-incluir este imposto"
                        >
                          Incluir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Adicionar imposto manual (admin only) */}
            {user?.role === "admin" && allTaxes.length > 0 && (
              <div className="flex gap-2 mb-4">
                <select
                  value={addTaxSelect}
                  onChange={(e) => setAddTaxSelect(e.target.value)}
                  className="input-base flex-1"
                >
                  <option value="">+ Adicionar imposto manualmente...</option>
                  {allTaxes
                    .filter((t) => !companyTaxes.some((ct) => ct.id === t.id))
                    .map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddTax}
                  disabled={!addTaxSelect}
                  className="btn-primary disabled:opacity-40"
                >
                  <FiPlus size={14} />
                  Adicionar
                </button>
              </div>
            )}
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            Seção 8 · Observações
        ───────────────────────────────────────────────────────────────── */}
        <SectionDivider label="Observações" />
        <div className={`grid gap-3 mb-4 ${type === "add" ? "grid-cols-2" : "grid-cols-1"}`}>
          {type === "add" && (
            <div>
              <label className="label-base">Informações Importantes</label>
              <textarea
                name="important_info"
                className="input-base min-h-[60px] resize-none"
                value={formData.important_info}
                onChange={handleChange}
                placeholder="Informações relevantes sobre a empresa…"
              />
            </div>
          )}
          <div>
            <label className="label-base">Observações Gerais</label>
            <textarea
              name="obs"
              className="input-base min-h-[60px] resize-none"
              value={formData.obs}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            Rodapé
        ───────────────────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-dark-border">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            Salvar
          </button>
        </div>
      </form>

      {showAddContactModeModal && (
        <AddContactModeModal
          onClose={() => setShowAddContactModeModal(false)}
          onSave={handleAddContactMode}
        />
      )}
    </>
  );
};

export default CompanyForm;
