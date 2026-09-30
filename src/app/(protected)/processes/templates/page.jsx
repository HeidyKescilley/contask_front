"use client";

import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import {
  FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiChevronDown, FiChevronRight, FiPlay, FiRotateCcw, FiLayers,
} from "react-icons/fi";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import TemplateFormModal from "../../../../components/process/TemplateFormModal";
import ProcessFormModal from "../../../../components/process/ProcessFormModal";
import { ResponsibleBadge, deptBadge, errorMessage } from "../../../../components/process/processUtils";
import { useAuth } from "../../../../hooks/useAuth";

const TemplatesPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [editTarget, setEditTarget] = useState(undefined); // undefined = fechado, null = novo
  const [startTemplate, setStartTemplate] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tplRes, depRes] = await Promise.all([
        api.get("/process/templates", { params: { includeArchived: showArchived } }),
        api.get("/process/departments"),
      ]);
      setTemplates(tplRes.data.templates || []);
      setDepartments(depRes.data.departments || []);
    } catch {
      toast.error("Erro ao carregar os padrões.");
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);

  const grouped = useMemo(() => {
    const groups = {};
    templates.forEach((t) => (groups[t.department] ||= []).push(t));
    return Object.keys(groups).sort((a, b) => a.localeCompare(b, "pt-BR")).map((d) => [d, groups[d]]);
  }, [templates]);

  const handleDelete = async (t) => {
    const total = Object.values(t.instanceCounts).reduce((a, b) => a + b, 0);
    const willArchive = t.isSystem || total > 0;
    const msg = willArchive
      ? `Arquivar o padrão "${t.name}"? Ele deixa de aparecer para novos processos, mas os processos existentes são mantidos.`
      : `Excluir o padrão "${t.name}"?`;
    if (!confirm(msg)) return;
    try {
      const { data } = await api.delete(`/process/templates/${t.id}`);
      toast.success(data.message);
      fetchAll();
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao excluir."));
    }
  };

  const handleRestore = async (t) => {
    try {
      await api.put(`/process/templates/${t.id}`, { active: true });
      toast.success("Padrão restaurado.");
      fetchAll();
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao restaurar."));
    }
  };

  return (
    <ProtectedRoute requiredPermissions={{ roles: ["admin", "user"] }}>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/processes")} className="btn-ghost !p-1.5" title="Voltar">
              <FiArrowLeft size={16} />
            </button>
            <FiLayers size={18} className="text-primary-500" />
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-dark-text">Padrões de Processo</h1>
              <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                Modelos de passo a passo usados para iniciar novos processos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-dark-text-secondary cursor-pointer">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Mostrar arquivados
            </label>
            <button onClick={() => setEditTarget(null)} className="btn-primary">
              <FiPlus size={15} /> Novo padrão
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : grouped.length === 0 ? (
          <div className="card py-12 text-center text-sm text-gray-400">Nenhum padrão cadastrado.</div>
        ) : (
          grouped.map(([dept, list]) => (
            <div key={dept} className="space-y-2">
              {isAdmin && (
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${deptBadge(dept)}`}>{dept}</span>
              )}
              {list.map((t) => {
                const open = !!expanded[t.id];
                const activeCount = t.instanceCounts.in_progress + t.instanceCounts.paused;
                return (
                  <div key={t.id} className={`card !p-0 overflow-hidden ${t.active ? "" : "opacity-60"}`}>
                    <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
                      <button
                        onClick={() => setExpanded((p) => ({ ...p, [t.id]: !open }))}
                        className="text-gray-400 hover:text-gray-600"
                        title={open ? "Recolher passos" : "Ver passos"}
                      >
                        {open ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                      </button>
                      <div className="flex-1 min-w-[220px]">
                        <p className="text-sm font-semibold text-gray-800 dark:text-dark-text">
                          {t.name}
                          {!t.active && <span className="ml-2 text-[10px] uppercase text-gray-500">arquivado</span>}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                          {t.steps.length} passos · {activeCount} em aberto · {t.instanceCounts.completed} concluído(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {t.active ? (
                          <>
                            <button onClick={() => setStartTemplate(t)} className="btn-ghost !py-1.5 text-xs"><FiPlay size={12} /> Iniciar</button>
                            <button onClick={() => setEditTarget(t)} className="btn-ghost !py-1.5 text-xs"><FiEdit2 size={12} /> Editar</button>
                            <button onClick={() => handleDelete(t)} className="btn-ghost !p-1.5 text-red-500" title={t.isSystem || activeCount ? "Arquivar" : "Excluir"}><FiTrash2 size={14} /></button>
                          </>
                        ) : (
                          <button onClick={() => handleRestore(t)} className="btn-ghost !py-1.5 text-xs"><FiRotateCcw size={12} /> Restaurar</button>
                        )}
                      </div>
                    </div>

                    {open && (
                      <div className="border-t border-light-border dark:border-dark-border px-4 py-3 space-y-2 bg-light-surface-alt/50 dark:bg-dark-surface/40">
                        {t.description && <p className="text-xs text-gray-600 dark:text-dark-text-secondary whitespace-pre-line">{t.description}</p>}
                        <ol className="space-y-1.5">
                          {t.steps.map((s) => (
                            <li key={s.id} className="text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-5 h-5 rounded-full bg-primary-500/15 text-primary-600 dark:text-primary-300 font-bold flex items-center justify-center text-[10px]">{s.position}</span>
                                <span className="font-medium text-gray-800 dark:text-dark-text">{s.title}</span>
                                <ResponsibleBadge responsible={s.responsible} />
                                {s.checklist.length > 0 && <span className="text-gray-400">{s.checklist.length} item(ns) no checklist</span>}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {editTarget !== undefined && (
        <TemplateFormModal
          template={editTarget}
          departments={departments}
          isAdmin={isAdmin}
          onClose={() => setEditTarget(undefined)}
          onSaved={fetchAll}
        />
      )}
      {startTemplate && (
        <ProcessFormModal
          templates={[startTemplate]}
          defaultTemplateId={startTemplate.id}
          onClose={() => setStartTemplate(null)}
          onSaved={(inst) => router.push(`/processes/${inst.id}`)}
        />
      )}
    </ProtectedRoute>
  );
};

export default TemplatesPage;
