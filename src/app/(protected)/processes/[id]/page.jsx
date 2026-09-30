"use client";

import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import {
  FiArrowLeft, FiCheck, FiPause, FiPlay, FiXCircle, FiEdit2, FiTrash2, FiRotateCcw,
  FiSkipForward, FiList, FiMessageSquare, FiSend, FiAlertTriangle, FiUser, FiCalendar,
} from "react-icons/fi";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import ProcessFormModal from "../../../../components/process/ProcessFormModal";
import ReasonModal from "../../../../components/process/ReasonModal";
import StepsEditor, { toEditableSteps } from "../../../../components/process/StepsEditor";
import {
  StatusBadge, ResponsibleBadge, ProgressBar, deptBadge, formatDate, formatDateTime,
  EVENT_LABEL, ORIGIN_LABEL, errorMessage,
} from "../../../../components/process/processUtils";

const ProcessDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();

  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null); // "edit" | "pause" | "cancel" | "steps"
  const [editSteps, setEditSteps] = useState([]);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/process/instances/${id}`);
      setInstance(data.instance);
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao carregar o processo."));
      router.push("/processes");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  // Executa uma chamada que devolve { instance } e atualiza a tela.
  const run = async (fn, successMsg) => {
    setBusy(true);
    try {
      const { data } = await fn();
      setInstance(data.instance);
      if (successMsg) toast.success(successMsg);
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const stepUrl = (step, action = "") => `/process/instances/${id}/steps/${step.id}${action}`;

  const toggleChecklistItem = (step, index) => {
    const checklist = step.checklist.map((c, i) => (i === index ? { ...c, done: !c.done } : c));
    // Atualização otimista; a resposta da API reconcilia o estado.
    setInstance((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === step.id ? { ...s, checklist } : s)),
    }));
    run(() => api.patch(stepUrl(step), { checklist }));
  };

  const completeStep = async (step) => {
    setBusy(true);
    try {
      const { data } = await api.post(stepUrl(step, "/complete"), {});
      setInstance(data.instance);
      toast.success("Passo concluído.");
    } catch (err) {
      if (err.response?.data?.code === "CHECKLIST_INCOMPLETE") {
        if (confirm(`${err.response.data.message}\n\nConcluir o passo mesmo assim?`)) {
          await run(() => api.post(stepUrl(step, "/complete"), { force: true }), "Passo concluído.");
        }
      } else {
        toast.error(errorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const skipStep = (step) => {
    if (!confirm(`Dispensar o passo "${step.title}"? Ele será marcado como não aplicável.`)) return;
    run(() => api.post(stepUrl(step, "/skip"), {}), "Passo dispensado.");
  };

  const reopenStep = (step) => run(() => api.post(stepUrl(step, "/reopen"), {}), "Passo reaberto.");

  const changeResponsible = (step, responsible) => {
    if (responsible === step.responsible) return;
    run(() => api.patch(stepUrl(step), { responsible }));
  };

  const saveNote = (step, value) => {
    if ((step.note || "") === value.trim()) return;
    run(() => api.patch(stepUrl(step), { note: value }));
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    const ok = await run(() => api.post(`/process/instances/${id}/notes`, { message: note }));
    if (ok) setNote("");
  };

  const openStepsEditor = () => {
    setEditSteps(toEditableSteps(instance.steps));
    setModal("steps");
  };

  const saveSteps = async () => {
    if (editSteps.length === 0) return toast.error("O processo precisa de ao menos um passo.");
    if (editSteps.some((s) => !s.title.trim())) return toast.error("Todos os passos precisam de um título.");
    const ok = await run(
      () => api.put(`/process/instances/${id}/steps`, {
        steps: editSteps.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          responsible: s.responsible,
          checklist: s.checklist,
        })),
      }),
      "Passos atualizados.",
    );
    if (ok) setModal(null);
  };

  const deleteProcess = async () => {
    if (!confirm(`Excluir definitivamente o processo "${instance.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/process/instances/${id}`);
      toast.success("Processo excluído.");
      router.push("/processes");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (loading || !instance) {
    return (
      <ProtectedRoute requiredPermissions={{ roles: ["admin", "user"] }}>
        <LoadingSpinner size="lg" />
      </ProtectedRoute>
    );
  }

  const isPaused = instance.status === "paused";
  const isCanceled = instance.status === "canceled";
  const locked = isPaused || isCanceled;
  const currentStepId = instance.currentStep?.id;

  const stepTone = (step) => {
    if (step.status === "done") return "border-green-200 dark:border-green-900/40";
    if (step.status === "skipped") return "border-gray-200 dark:border-dark-border opacity-70";
    if (step.id === currentStepId && !locked) return "border-primary-500 ring-1 ring-primary-500/30";
    return "border-gray-200 dark:border-dark-border";
  };

  const stepBullet = (step) => {
    if (step.status === "done") return "bg-green-500 text-white";
    if (step.status === "skipped") return "bg-gray-300 dark:bg-dark-border text-gray-600";
    if (step.id === currentStepId) return "bg-primary-500 text-white";
    return "bg-gray-100 dark:bg-dark-surface text-gray-500";
  };

  return (
    <ProtectedRoute requiredPermissions={{ roles: ["admin", "user"] }}>
      <div className="space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start gap-2">
            <button onClick={() => router.push("/processes")} className="btn-ghost !p-1.5 mt-0.5" title="Voltar">
              <FiArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-gray-800 dark:text-dark-text">{instance.name}</h1>
                <StatusBadge status={instance.status} />
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${deptBadge(instance.department)}`}>{instance.department}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-0.5">
                {instance.templateName || "Sem padrão"}
                {instance.clientName ? ` · ${instance.clientName}` : ""}
                {instance.clientDoc ? ` (${instance.clientDoc})` : ""}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-dark-text-secondary flex-wrap">
                <span className="inline-flex items-center gap-1"><FiUser size={12} /> {instance.responsibleUser?.name || "Sem responsável"}</span>
                <span className="inline-flex items-center gap-1"><FiCalendar size={12} /> Prazo: {formatDate(instance.dueDate)}</span>
                <span>Iniciado em {formatDate(instance.createdAt)}</span>
                {instance.completedAt && <span>Concluído em {formatDate(instance.completedAt)}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setModal("edit")} className="btn-ghost text-xs"><FiEdit2 size={13} /> Dados</button>
            <button onClick={openStepsEditor} className="btn-ghost text-xs"><FiList size={13} /> Editar passos</button>
            {instance.status === "in_progress" && (
              <button onClick={() => setModal("pause")} className="btn-outline text-xs text-amber-600 border-amber-300">
                <FiPause size={13} /> Pausar
              </button>
            )}
            {(isPaused || isCanceled) && (
              <button
                onClick={() => run(() => api.post(`/process/instances/${id}/resume`, {}), isCanceled ? "Processo reativado." : "Processo retomado.")}
                disabled={busy}
                className="btn-primary text-xs"
              >
                <FiPlay size={13} /> {isCanceled ? "Reativar" : "Retomar"}
              </button>
            )}
            {(instance.status === "in_progress" || isPaused) && (
              <button onClick={() => setModal("cancel")} className="btn-ghost text-xs text-red-500"><FiXCircle size={13} /> Cancelar</button>
            )}
            <button onClick={deleteProcess} className="btn-ghost !p-2 text-red-500" title="Excluir processo"><FiTrash2 size={14} /></button>
          </div>
        </div>

        {/* Banner de pausa */}
        {isPaused && (
          <div className="rounded-2xl border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/10 p-3 flex items-start gap-3">
            <FiAlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Processo pausado — {ORIGIN_LABEL[instance.pauseOrigin]}
              </p>
              <p className="text-amber-700/90 dark:text-amber-300/80">{instance.pauseReason}</p>
              <p className="text-xs text-amber-600/80 mt-0.5">Desde {formatDateTime(instance.pausedAt)}</p>
            </div>
          </div>
        )}

        {/* Progresso */}
        <div className="card !p-3 flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[220px]"><ProgressBar done={instance.progress.done} total={instance.progress.total} /></div>
          {instance.currentStep && !isCanceled && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 dark:text-dark-text-secondary">Passo atual:</span>
              <span className="font-semibold text-gray-800 dark:text-dark-text">{instance.currentStep.position}. {instance.currentStep.title}</span>
              <ResponsibleBadge responsible={instance.currentStep.responsible} />
            </div>
          )}
        </div>
        {instance.notes && (
          <div className="card !p-3 text-sm text-gray-700 dark:text-dark-text whitespace-pre-line">{instance.notes}</div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          {/* Passos */}
          <div className="xl:col-span-2 space-y-2.5">
            {instance.steps.map((step) => {
              const isCurrent = step.id === currentStepId;
              const pending = step.status === "pending";
              const checklistDone = step.checklist.filter((c) => c.done).length;
              return (
                <div key={step.id} className={`card !p-3.5 border ${stepTone(step)}`}>
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${stepBullet(step)}`}>
                      {step.status === "done" ? <FiCheck size={14} /> : step.status === "skipped" ? <FiSkipForward size={12} /> : step.position}
                    </span>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold text-gray-800 dark:text-dark-text ${step.status === "skipped" ? "line-through" : ""}`}>{step.title}</p>
                        {isCurrent && !locked && <span className="text-[10px] font-bold uppercase text-primary-600 dark:text-primary-300">Passo atual</span>}
                        {step.status === "skipped" && <span className="text-[10px] font-bold uppercase text-gray-500">Dispensado</span>}
                        <select
                          value={step.responsible}
                          onChange={(e) => changeResponsible(step, e.target.value)}
                          disabled={busy || isCanceled}
                          title="Responsável pelo passo"
                          className="text-[11px] rounded-full border border-gray-200 dark:border-dark-border bg-transparent px-2 py-0.5 text-gray-600 dark:text-dark-text-secondary"
                        >
                          <option value="office">Escritório</option>
                          <option value="client">Aguarda cliente</option>
                        </select>
                      </div>

                      {step.description && <p className="text-xs text-gray-500 dark:text-dark-text-secondary whitespace-pre-line">{step.description}</p>}

                      {step.checklist.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[11px] text-gray-400">Checklist {checklistDone}/{step.checklist.length}</p>
                          {step.checklist.map((item, idx) => (
                            <label key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-dark-text cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.done}
                                disabled={busy || isCanceled}
                                onChange={() => toggleChecklistItem(step, idx)}
                                className="mt-0.5"
                              />
                              <span className={item.done ? "line-through text-gray-400" : ""}>{item.text}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      <textarea
                        defaultValue={step.note || ""}
                        key={`${step.id}-${step.note || ""}`}
                        onBlur={(e) => saveNote(step, e.target.value)}
                        disabled={isCanceled}
                        rows={1}
                        placeholder="Anotação do passo (opcional)"
                        className="input-base !py-1.5 !text-xs resize-y"
                      />

                      {!pending && step.completedAt && (
                        <p className="text-[11px] text-gray-400">
                          {step.status === "skipped" ? "Dispensado" : "Concluído"} em {formatDateTime(step.completedAt)}
                          {step.completedBy ? ` por ${step.completedBy.name}` : ""}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {pending && (
                          <>
                            <button onClick={() => completeStep(step)} disabled={busy || locked} className="btn-success !py-1 !px-2.5 text-xs">
                              <FiCheck size={13} /> Concluir passo
                            </button>
                            <button onClick={() => skipStep(step)} disabled={busy || locked} className="btn-ghost !py-1 !px-2.5 text-xs">
                              <FiSkipForward size={12} /> Dispensar
                            </button>
                          </>
                        )}
                        {!pending && !isCanceled && (
                          <button onClick={() => reopenStep(step)} disabled={busy} className="btn-ghost !py-1 !px-2.5 text-xs">
                            <FiRotateCcw size={12} /> Reabrir
                          </button>
                        )}
                        {pending && locked && !isCanceled && (
                          <span className="text-[11px] text-amber-600">Retome o processo para concluir passos.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Histórico */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <FiMessageSquare size={15} className="text-primary-500" />
              <h2 className="text-sm font-bold text-gray-800 dark:text-dark-text">Histórico e anotações</h2>
            </div>
            <form onSubmit={addNote} className="flex gap-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Registrar uma anotação"
                className="input-base !py-1.5"
              />
              <button type="submit" disabled={busy || !note.trim()} className="btn-primary !px-3" title="Adicionar anotação">
                <FiSend size={14} />
              </button>
            </form>
            <ol className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {instance.events.map((ev) => (
                <li key={ev.id} className="text-xs border-l-2 border-primary-500/40 pl-3">
                  <p className="font-semibold text-gray-700 dark:text-dark-text">
                    {EVENT_LABEL[ev.type] || ev.type}
                    {ev.type === "paused" && ev.meta?.origin ? ` · ${ev.meta.origin === "client" ? "cliente" : "escritório"}` : ""}
                  </p>
                  {ev.message && <p className="text-gray-600 dark:text-dark-text-secondary whitespace-pre-line">{ev.message}</p>}
                  <p className="text-[11px] text-gray-400">
                    {formatDateTime(ev.createdAt)}{ev.user ? ` · ${ev.user.name}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {modal === "edit" && (
        <ProcessFormModal instance={instance} onClose={() => setModal(null)} onSaved={setInstance} />
      )}
      {modal === "pause" && (
        <ReasonModal
          title="Pausar processo"
          description="O processo fica parado neste passo até ser retomado. Registre o motivo e de quem é a responsabilidade."
          confirmLabel="Pausar processo"
          askOrigin
          onClose={() => setModal(null)}
          onConfirm={({ reason, origin }) =>
            run(() => api.post(`/process/instances/${id}/pause`, { reason, origin }), "Processo pausado.")
          }
        />
      )}
      {modal === "cancel" && (
        <ReasonModal
          title="Cancelar processo"
          description="O processo será marcado como cancelado e pode ser reativado depois."
          confirmLabel="Cancelar processo"
          danger
          onClose={() => setModal(null)}
          onConfirm={({ reason }) =>
            run(() => api.post(`/process/instances/${id}/cancel`, { reason }), "Processo cancelado.")
          }
        />
      )}
      {modal === "steps" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-800 dark:text-dark-text mb-1">Editar passos do processo</h2>
            <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-3">
              As alterações valem apenas para este processo; o padrão original não é modificado.
            </p>
            <StepsEditor steps={editSteps} onChange={setEditSteps} />
            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setModal(null)} className="btn-ghost">Cancelar</button>
              <button onClick={saveSteps} disabled={busy} className="btn-primary"><FiCheck size={15} /> Salvar passos</button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default ProcessDetailPage;
