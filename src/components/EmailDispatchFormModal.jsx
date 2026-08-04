// src/components/EmailDispatchFormModal.jsx
"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { FiX, FiSave, FiUpload } from "react-icons/fi";
import api from "../utils/api";
import { toast } from "react-toastify";
import CompanySelector from "./CompanySelector";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const VARIABLES = [
  { token: "RAZAO_SOCIAL", label: "Razão Social" },
  { token: "MES_PASSADO", label: "Mês passado" },
  { token: "MES_ATUAL", label: "Mês atual" },
];

function formatMonthYear(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${month}/${date.getFullYear()}`;
}

function getSampleVars() {
  const now = new Date();
  return {
    RAZAO_SOCIAL: "Empresa Exemplo Ltda",
    MES_ATUAL: formatMonthYear(new Date(now.getFullYear(), now.getMonth(), 1)),
    MES_PASSADO: formatMonthYear(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
  };
}

function substituteForPreview(text) {
  const vars = getSampleVars();
  return (text || "").replace(/\{\{\{(\w+)\}\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match
  );
}

function looksLikeHtml(text) {
  return /<\/?[a-z][\s\S]*?>/i.test(text || "");
}

// O editor rico (Quill) reinterpreta o HTML como um documento próprio (não
// preserva <html>/<head>/estilos/layout de um template importado) — nunca
// produz essas tags sozinho, então a presença delas indica conteúdo importado.
function looksLikeFullHtmlDocument(text) {
  return /<!DOCTYPE\s+html|<html[\s>]/i.test(text || "");
}

function detectVariables(text) {
  const found = new Set();
  const re = /\{\{\{(\w+)\}\}\}/g;
  let m;
  while ((m = re.exec(text || ""))) {
    if (VARIABLES.some((v) => v.token === m[1])) found.add(m[1]);
  }
  return [...found];
}

// Insere {{{TOKEN}}} na posição do cursor de um <input>/<textarea> nativo (via ref).
function insertAtCursor(ref, currentValue, setValue, token) {
  const insertText = `{{{${token}}}}`;
  const el = ref.current;
  if (!el) {
    setValue((currentValue || "") + insertText);
    return;
  }
  const start = el.selectionStart ?? currentValue.length;
  const end = el.selectionEnd ?? currentValue.length;
  const next = (currentValue || "").slice(0, start) + insertText + (currentValue || "").slice(end);
  setValue(next);
  requestAnimationFrame(() => {
    el.focus();
    const pos = start + insertText.length;
    el.setSelectionRange(pos, pos);
  });
}

function VariableButtons({ onInsert }) {
  return (
    <div className="flex flex-wrap gap-1">
      {VARIABLES.map((v) => (
        <button
          key={v.token}
          type="button"
          onClick={() => onInsert(v.token)}
          title={`Inserir {{{${v.token}}}}`}
          className="px-2 py-0.5 rounded-full text-[11px] font-medium border border-gray-200 dark:border-dark-border
            text-gray-500 hover:border-primary-300 hover:text-primary-500 transition-colors"
        >
          + {v.label}
        </button>
      ))}
    </div>
  );
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
].map((label, i) => ({ value: i + 1, label }));

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EmailDispatchFormModal({ dispatch, onClose, onSuccess }) {
  const isEditing = !!dispatch;

  const [name, setName] = useState(dispatch?.name || "");
  const [mode, setMode] = useState(dispatch?.mode || "manual");
  const [scheduleFrequency, setScheduleFrequency] = useState(dispatch?.scheduleFrequency || "monthly");
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(dispatch?.scheduleDayOfWeek ?? 1);
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState(dispatch?.scheduleDayOfMonth ?? 1);
  const [scheduleMonth, setScheduleMonth] = useState(dispatch?.scheduleMonth ?? 1);
  const [scheduleTime, setScheduleTime] = useState(
    dispatch?.scheduleHour != null
      ? `${String(dispatch.scheduleHour).padStart(2, "0")}:${String(dispatch.scheduleMinute ?? 0).padStart(2, "0")}`
      : "08:00"
  );
  const [isActive, setIsActive] = useState(dispatch?.isActive ?? true);

  const [fromEmail, setFromEmail] = useState(dispatch?.fromEmail || "");
  const [fromPassword, setFromPassword] = useState("");
  const [fromName, setFromName] = useState(dispatch?.fromName || "");
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(
    dispatch?.signatureImagePath ? `${API_URL}/signatures/${dispatch.signatureImagePath}` : null
  );

  const [subject, setSubject] = useState(dispatch?.subject || "");
  const [bodyFormat, setBodyFormat] = useState(dispatch?.bodyFormat || "html");
  const [bodyContent, setBodyContent] = useState(dispatch?.bodyContent || "");
  const [htmlSourceMode, setHtmlSourceMode] = useState(
    dispatch?.bodySourceMode || (looksLikeFullHtmlDocument(dispatch?.bodyContent) ? "import" : "editor")
  );

  const [companyIds, setCompanyIds] = useState((dispatch?.companies || []).map((c) => c.id));
  const [loading, setLoading] = useState(false);

  const subjectInputRef = useRef(null);
  const textBodyRef = useRef(null);
  const importTextareaRef = useRef(null);

  const handleSignatureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
  };

  const handleImportHtml = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBodyContent(String(reader.result || ""));
    reader.readAsText(file, "utf-8");
  };

  // Editor rico (Quill) não expõe cursor de forma confiável através do next/dynamic,
  // então a variável é adicionada ao final do conteúdo — o usuário pode reposicionar
  // arrastando o texto normalmente no editor.
  const handleInsertIntoQuill = (token) => {
    setBodyContent((prev) => `${prev || ""} {{{${token}}}}`);
  };

  // Trocar de "Importar arquivo" pra "Editor" joga o HTML dentro do Quill, que
  // reinterpreta tudo no formato dele e perde estilos/layout de um template
  // importado — confirma antes pra evitar perda de formatação sem querer.
  const handleSetHtmlSourceMode = (nextMode) => {
    if (nextMode === "editor" && htmlSourceMode === "import" && looksLikeFullHtmlDocument(bodyContent)) {
      const ok = window.confirm(
        "Trocar para o Editor visual pode reformatar ou perder partes deste HTML importado (cores, caixas, layout). Deseja continuar mesmo assim?"
      );
      if (!ok) return;
    }
    setHtmlSourceMode(nextMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !fromEmail || !fromName || !subject || !bodyContent) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!isEditing && !fromPassword) {
      toast.error("Informe a senha do e-mail de disparo.");
      return;
    }
    if (companyIds.length === 0) {
      toast.error("Selecione ao menos uma empresa destinatária.");
      return;
    }

    const [hourStr, minuteStr] = scheduleTime.split(":");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("mode", mode);
    formData.append("subject", subject);
    formData.append("bodyFormat", bodyFormat);
    formData.append("bodyContent", bodyContent);
    formData.append("bodySourceMode", htmlSourceMode);
    formData.append("fromEmail", fromEmail);
    formData.append("fromName", fromName);
    formData.append("isActive", String(isActive));
    if (fromPassword) formData.append("fromPassword", fromPassword);
    if (signatureFile) formData.append("signatureImage", signatureFile);
    formData.append("companyIds", JSON.stringify(companyIds));

    if (mode === "automatic") {
      formData.append("scheduleFrequency", scheduleFrequency);
      formData.append("scheduleHour", hourStr);
      formData.append("scheduleMinute", minuteStr);
      if (scheduleFrequency === "weekly") {
        formData.append("scheduleDayOfWeek", String(scheduleDayOfWeek));
      }
      if (scheduleFrequency === "monthly" || scheduleFrequency === "yearly") {
        formData.append("scheduleDayOfMonth", String(scheduleDayOfMonth));
      }
      if (scheduleFrequency === "yearly") {
        formData.append("scheduleMonth", String(scheduleMonth));
      }
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.patch(`/email-dispatch/${dispatch.id}`, formData);
        toast.success("Automação atualizada com sucesso!");
      } else {
        await api.post("/email-dispatch/create", formData);
        toast.success("Automação criada com sucesso!");
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar automação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-3xl relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600
            hover:bg-gray-100 dark:hover:bg-dark-card-hover dark:hover:text-dark-text transition-colors"
        >
          <FiX size={20} />
        </button>

        <h2 className="text-xl font-bold mb-1">
          {isEditing ? "Editar Automação de E-mail" : "Nova Automação de E-mail"}
        </h2>
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
          {isEditing
            ? "Salvar esta edição exigirá uma nova aprovação de um administrador antes que a automação volte a rodar."
            : "Após criada, esta automação precisará ser aprovada por um administrador antes de rodar (manual ou automaticamente)."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome */}
          <div>
            <label className="label-base">Nome do processo</label>
            <input
              type="text"
              className="input-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex: "Solicitação mensal de extratos bancários"'
              required
            />
          </div>

          {/* Modo e agendamento */}
          <div className="border border-gray-100 dark:border-dark-border rounded-xl p-3 space-y-3">
            <div>
              <label className="label-base mb-2">Modo de disparo</label>
              <div className="flex border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden max-w-xs">
                {[["manual", "Manual"], ["automatic", "Automático"]].map(([val, lbl], i) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMode(val)}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${mode === val ? "bg-primary-500 text-white" : "bg-white dark:bg-dark-surface text-gray-600 hover:bg-gray-50"} ${i > 0 ? "border-l border-gray-200 dark:border-dark-border" : ""}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {mode === "automatic" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label-base">Periodicidade</label>
                  <select
                    className="input-base"
                    value={scheduleFrequency}
                    onChange={(e) => setScheduleFrequency(e.target.value)}
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>

                {scheduleFrequency === "weekly" && (
                  <div>
                    <label className="label-base">Dia da semana</label>
                    <select
                      className="input-base"
                      value={scheduleDayOfWeek}
                      onChange={(e) => setScheduleDayOfWeek(Number(e.target.value))}
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {scheduleFrequency === "yearly" && (
                  <div>
                    <label className="label-base">Mês</label>
                    <select
                      className="input-base"
                      value={scheduleMonth}
                      onChange={(e) => setScheduleMonth(Number(e.target.value))}
                    >
                      {MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(scheduleFrequency === "monthly" || scheduleFrequency === "yearly") && (
                  <div>
                    <label className="label-base">Dia do mês</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      className="input-base"
                      value={scheduleDayOfMonth}
                      onChange={(e) => setScheduleDayOfMonth(Number(e.target.value))}
                    />
                  </div>
                )}

                <div>
                  <label className="label-base">Horário</label>
                  <input
                    type="time"
                    className="input-base"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {isEditing && (
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text-secondary cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Automação ativa {mode === "automatic" ? "(desmarque para pausar o agendamento)" : ""}
              </label>
            )}
          </div>

          {/* Remetente */}
          <div className="border border-gray-100 dark:border-dark-border rounded-xl p-3 space-y-3">
            <p className="label-base !mb-0">Remetente</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">E-mail de disparo</label>
                <input
                  type="email"
                  className="input-base"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="conta@contelb.com.br"
                  required
                />
              </div>
              <div>
                <label className="label-base">Senha do e-mail</label>
                <input
                  type="password"
                  className="input-base"
                  value={fromPassword}
                  onChange={(e) => setFromPassword(e.target.value)}
                  placeholder={isEditing ? "Deixe em branco para manter a senha atual" : ""}
                  required={!isEditing}
                />
              </div>
              <div>
                <label className="label-base">Nome exibido ao destinatário</label>
                <input
                  type="text"
                  className="input-base"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Ex: Contask Contabilidade"
                  required
                />
              </div>
              <div>
                <label className="label-base">Imagem de assinatura</label>
                <label className="btn-ghost text-xs cursor-pointer inline-flex w-fit">
                  <FiUpload size={13} />
                  Escolher imagem
                  <input type="file" accept="image/*" onChange={handleSignatureChange} className="hidden" />
                </label>
                {signaturePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={signaturePreview} alt="Assinatura" className="mt-2 max-h-16 rounded border border-gray-200 dark:border-dark-border" />
                )}
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="border border-gray-100 dark:border-dark-border rounded-xl p-3 space-y-3">
            <p className="label-base !mb-0">Conteúdo do e-mail</p>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label-base !mb-0">Assunto</label>
                <VariableButtons onInsert={(token) => insertAtCursor(subjectInputRef, subject, setSubject, token)} />
              </div>
              <input
                ref={subjectInputRef}
                type="text"
                className="input-base"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-base mb-2">Formato do corpo</label>
              <div className="flex border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden max-w-xs">
                {[["html", "HTML"], ["text", "Texto simples"]].map(([val, lbl], i) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBodyFormat(val)}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${bodyFormat === val ? "bg-primary-500 text-white" : "bg-white dark:bg-dark-surface text-gray-600 hover:bg-gray-50"} ${i > 0 ? "border-l border-gray-200 dark:border-dark-border" : ""}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              {bodyFormat === "text" && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                  O rastreio de abertura só funciona em e-mails HTML — texto simples não carrega o pixel de confirmação.
                </p>
              )}
            </div>

            {bodyFormat === "html" && (
              <div>
                <label className="label-base mb-2">Origem do HTML</label>
                <div className="flex border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden max-w-xs">
                  {[["editor", "Editor"], ["import", "Importar arquivo"]].map(([val, lbl], i) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSetHtmlSourceMode(val)}
                      className={`flex-1 py-1.5 text-xs font-medium transition-colors ${htmlSourceMode === val ? "bg-primary-500 text-white" : "bg-white dark:bg-dark-surface text-gray-600 hover:bg-gray-50"} ${i > 0 ? "border-l border-gray-200 dark:border-dark-border" : ""}`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="label-base">Corpo do e-mail</label>

              {bodyFormat === "html" && htmlSourceMode === "editor" && (
                <>
                  <div className="flex justify-end mb-1.5">
                    <VariableButtons onInsert={handleInsertIntoQuill} />
                  </div>
                  <ReactQuill
                    value={bodyContent}
                    onChange={setBodyContent}
                    className="bg-white dark:bg-dark-surface rounded-xl overflow-hidden"
                  />
                </>
              )}

              {bodyFormat === "html" && htmlSourceMode === "import" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="btn-ghost text-xs cursor-pointer inline-flex w-fit">
                      <FiUpload size={13} />
                      Escolher arquivo .html
                      <input type="file" accept=".html,text/html" onChange={handleImportHtml} className="hidden" />
                    </label>
                    <VariableButtons onInsert={(token) => insertAtCursor(importTextareaRef, bodyContent, setBodyContent, token)} />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-dark-text-secondary">
                    {detectVariables(bodyContent).length > 0
                      ? `Variáveis detectadas: ${detectVariables(bodyContent).map((t) => VARIABLES.find((v) => v.token === t)?.label).join(", ")}`
                      : bodyContent
                        ? "Nenhuma variável reconhecida encontrada no conteúdo."
                        : "Escolha um arquivo .html para importar."}
                  </p>
                  <textarea
                    ref={importTextareaRef}
                    value={bodyContent}
                    onChange={(e) => setBodyContent(e.target.value)}
                    spellCheck={false}
                    placeholder="Importe um arquivo .html ou cole o HTML aqui…"
                    className="input-base font-mono text-[11px] min-h-[140px]"
                  />
                  <div>
                    <p className="label-base mb-1">Pré-visualização (valores de exemplo)</p>
                    <iframe
                      srcDoc={substituteForPreview(bodyContent)}
                      sandbox=""
                      title="Pré-visualização do e-mail"
                      className="w-full h-64 border border-gray-200 dark:border-dark-border rounded-xl bg-white"
                    />
                  </div>
                </div>
              )}

              {bodyFormat === "text" && (
                <>
                  <div className="flex justify-end mb-1.5">
                    <VariableButtons onInsert={(token) => insertAtCursor(textBodyRef, bodyContent, setBodyContent, token)} />
                  </div>
                  <textarea
                    ref={textBodyRef}
                    className="input-base min-h-[150px]"
                    value={bodyContent}
                    onChange={(e) => setBodyContent(e.target.value)}
                  />
                  {looksLikeHtml(bodyContent) && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                      Este texto parece conter marcação HTML (tags como &lt;div&gt;, &lt;p&gt;…). Em &ldquo;Texto simples&rdquo; ele será
                      enviado exatamente como está escrito, sem virar formatação — se a intenção é um e-mail formatado,
                      troque o formato para &ldquo;HTML&rdquo; acima.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Empresas destinatárias */}
          <div className="border border-gray-100 dark:border-dark-border rounded-xl p-3 space-y-3">
            <p className="label-base !mb-0">Empresas destinatárias</p>
            <CompanySelector selectedIds={companyIds} onChange={setCompanyIds} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-dark-border">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary text-sm disabled:opacity-50">
              {loading
                ? <span className="inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <FiSave size={14} />}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
