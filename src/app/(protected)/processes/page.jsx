"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "../../../utils/api";
import { toast } from "react-toastify";
import {
  FiPlus, FiList, FiColumns, FiGrid, FiSearch, FiCheckSquare, FiSettings,
  FiPlayCircle, FiPauseCircle, FiClock, FiCheckCircle,
} from "react-icons/fi";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ProcessFormModal from "../../../components/process/ProcessFormModal";
import {
  StatusBadge, ResponsibleBadge, ProgressBar, deptBadge, formatDate, ORIGIN_LABEL,
} from "../../../components/process/processUtils";
import { useAuth } from "../../../hooks/useAuth";

const VIEWS = [
  { id: "list", label: "Lista", icon: FiList },
  { id: "board", label: "Quadro por passo", icon: FiColumns },
  { id: "templates", label: "Por padrão", icon: FiGrid },
];

const STATUS_FILTERS = [
  { id: "active", label: "Ativos" },
  { id: "in_progress", label: "Em andamento" },
  { id: "paused", label: "Pausados" },
  { id: "completed", label: "Concluídos" },
  { id: "canceled", label: "Cancelados" },
  { id: "all", label: "Todos" },
];

const chip = (active) =>
  `px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
    active
      ? "bg-primary-500 text-white border-primary-500"
      : "border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-primary-300"
  }`;

const matchesStatus = (inst, filter) => {
  if (filter === "all") return true;
  if (filter === "active") return inst.status === "in_progress" || inst.status === "paused";
  return inst.status === filter;
};

// Situação resumida: quem está com a bola
const WaitingInfo = ({ inst }) => {
  if (inst.status === "paused") {
    return (
      <span className="text-[11px] text-amber-600 dark:text-amber-400" title={inst.pauseReason || ""}>
        {ORIGIN_LABEL[inst.pauseOrigin]}
        {inst.pauseReason ? ` — ${inst.pauseReason}` : ""}
      </span>
    );
  }
  return null;
};

const ProcessesPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const [templates, setTemplates] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formTemplateId, setFormTemplateId] = useState(null);

  const [view, setView] = useState("list");
  const [deptFilter, setDeptFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("active");
  const [templateFilter, setTemplateFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tplRes, instRes] = await Promise.all([
        api.get("/process/templates"),
        api.get("/process/instances"),
      ]);
      setTemplates(tplRes.data.templates || []);
      setInstances(instRes.data.instances || []);
    } catch {
      toast.error("Erro ao carregar os processos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);

  const departments = useMemo(
    () => [...new Set([...templates.map((t) => t.department), ...instances.map((i) => i.department)])].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [templates, instances],
  );

  // Filtros (departamento só é filtrável pelo admin; para os demais a API já restringe)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return instances.filter((i) => {
      if (isAdmin && deptFilter !== "Todos" && i.department !== deptFilter) return false;
      if (templateFilter && i.templateId !== Number(templateFilter)) return false;
      if (!matchesStatus(i, statusFilter)) return false;
      if (q) {
        const hay = `${i.name} ${i.clientName || ""} ${i.clientDoc || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [instances, isAdmin, deptFilter, templateFilter, statusFilter, search]);

  const scopeInstances = useMemo(
    () => instances.filter((i) => !isAdmin || deptFilter === "Todos" || i.department === deptFilter),
    [instances, isAdmin, deptFilter],
  );
  const kpis = useMemo(() => ({
    inProgress: scopeInstances.filter((i) => i.status === "in_progress").length,
    waitingClient: scopeInstances.filter((i) => i.status === "in_progress" && i.currentStep?.responsible === "client").length,
    paused: scopeInstances.filter((i) => i.status === "paused").length,
    completed: scopeInstances.filter((i) => i.status === "completed").length,
  }), [scopeInstances]);

  const visibleTemplates = useMemo(
    () => templates.filter((t) => !isAdmin || deptFilter === "Todos" || t.department === deptFilter),
    [templates, isAdmin, deptFilter],
  );

  const openProcess = (id) => router.push(`/processes/${id}`);
  const openStart = (templateId = null) => { setFormTemplateId(templateId); setShowForm(true); };

  // ── Lista ──
  const renderRow = (inst) => (
    <tr key={inst.id} className="table-row cursor-pointer" onClick={() => openProcess(inst.id)}>
      <td className="table-cell">
        <p className="font-medium text-gray-800 dark:text-dark-text">{inst.name}</p>
        {inst.clientName && <p className="text-xs text-gray-500 dark:text-dark-text-secondary">{inst.clientName}</p>}
      </td>
      <td className="table-cell text-xs text-gray-600 dark:text-dark-text-secondary">{inst.templateName || "—"}</td>
      <td className="table-cell">
        {inst.currentStep ? (
          <div className="space-y-1">
            <p className="text-xs text-gray-700 dark:text-dark-text">
              <span className="text-gray-400">{inst.currentStep.position}.</span> {inst.currentStep.title}
            </p>
            <ResponsibleBadge responsible={inst.currentStep.responsible} />
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="table-cell"><ProgressBar done={inst.progress.done} total={inst.progress.total} /></td>
      <td className="table-cell">
        <div className="space-y-1">
          <StatusBadge status={inst.status} />
          <div><WaitingInfo inst={inst} /></div>
        </div>
      </td>
      <td className="table-cell text-xs text-gray-500 dark:text-dark-text-secondary">{inst.responsibleUser?.name || "—"}</td>
      <td className="table-cell text-xs text-gray-500 dark:text-dark-text-secondary whitespace-nowrap">{formatDate(inst.dueDate)}</td>
      <td className="table-cell text-xs text-gray-500 dark:text-dark-text-secondary whitespace-nowrap">{formatDate(inst.updatedAt)}</td>
    </tr>
  );

  const renderTable = (rows) => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="table-header">Processo</th>
            <th className="table-header">Padrão</th>
            <th className="table-header">Passo atual</th>
            <th className="table-header">Progresso</th>
            <th className="table-header">Status</th>
            <th className="table-header">Responsável</th>
            <th className="table-header">Prazo</th>
            <th className="table-header">Atualizado</th>
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );

  const renderList = () => {
    if (filtered.length === 0) {
      return <div className="card py-12 text-center text-sm text-gray-400">Nenhum processo encontrado.</div>;
    }
    // Admin sem filtro de departamento: uma seção por departamento
    if (isAdmin && deptFilter === "Todos") {
      const groups = {};
      filtered.forEach((i) => (groups[i.department] ||= []).push(i));
      return (
        <div className="space-y-4">
          {Object.keys(groups).sort((a, b) => a.localeCompare(b, "pt-BR")).map((dept) => (
            <div key={dept} className="card p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-light-border dark:border-dark-border">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${deptBadge(dept)}`}>{dept}</span>
                <span className="text-xs text-gray-400">{groups[dept].length} processo(s)</span>
              </div>
              {renderTable(groups[dept])}
            </div>
          ))}
        </div>
      );
    }
    return <div className="card p-0 overflow-hidden">{renderTable(filtered)}</div>;
  };

  // ── Quadro por passo ──
  const renderBoard = () => {
    const template = templates.find((t) => t.id === Number(templateFilter));
    if (!template) {
      return (
        <div className="card py-12 text-center text-sm text-gray-400">
          Escolha um padrão no filtro acima para ver o quadro dos passos.
        </div>
      );
    }
    const columns = template.steps.map((s) => ({ key: s.title, title: s.title, responsible: s.responsible, items: [] }));
    const extra = { key: "__extra", title: "Passos personalizados", responsible: null, items: [] };
    const done = { key: "__done", title: "Concluídos", responsible: null, items: [] };
    filtered.forEach((inst) => {
      if (inst.status === "completed") return done.items.push(inst);
      const col = columns.find((c) => c.key === inst.currentStep?.title);
      (col || extra).items.push(inst);
    });
    const allCols = [...columns, ...(extra.items.length ? [extra] : []), done];
    return (
      <div className="flex gap-3 overflow-x-auto pb-3">
        {allCols.map((col, idx) => (
          <div key={col.key + idx} className="w-64 flex-shrink-0 rounded-2xl bg-light-surface-alt dark:bg-dark-surface p-2.5">
            <div className="mb-2 px-1">
              <p className="text-xs font-bold text-gray-700 dark:text-dark-text leading-snug">
                {col.key.startsWith("__") ? "" : `${idx + 1}. `}{col.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {col.responsible && <ResponsibleBadge responsible={col.responsible} />}
                <span className="text-[11px] text-gray-400">{col.items.length}</span>
              </div>
            </div>
            <div className="space-y-2">
              {col.items.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => openProcess(inst.id)}
                  className="w-full text-left card !p-2.5 hover:shadow-card-hover transition-shadow"
                >
                  <p className="text-sm font-medium text-gray-800 dark:text-dark-text leading-snug">{inst.name}</p>
                  {inst.clientName && <p className="text-[11px] text-gray-500 dark:text-dark-text-secondary">{inst.clientName}</p>}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {inst.status !== "in_progress" && <StatusBadge status={inst.status} />}
                    {isAdmin && <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${deptBadge(inst.department)}`}>{inst.department}</span>}
                  </div>
                  <div className="mt-2"><ProgressBar done={inst.progress.done} total={inst.progress.total} /></div>
                </button>
              ))}
              {col.items.length === 0 && <p className="text-[11px] text-gray-400 text-center py-3">Vazio</p>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── Por padrão ──
  const renderTemplates = () => {
    if (visibleTemplates.length === 0) {
      return <div className="card py-12 text-center text-sm text-gray-400">Nenhum padrão disponível.</div>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {visibleTemplates.map((t) => {
          const tplInstances = instances.filter((i) => i.templateId === t.id);
          const active = tplInstances.filter((i) => i.status === "in_progress" || i.status === "paused");
          return (
            <div key={t.id} className="card flex flex-col gap-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-dark-text leading-snug">{t.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${deptBadge(t.department)}`}>{t.department}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-0.5">{t.steps.length} passos</p>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  { k: "in_progress", l: "Andamento", c: "text-blue-600" },
                  { k: "paused", l: "Pausados", c: "text-amber-600" },
                  { k: "completed", l: "Concluídos", c: "text-green-600" },
                  { k: "canceled", l: "Cancelados", c: "text-gray-500" },
                ].map((s) => (
                  <div key={s.k} className="rounded-lg bg-light-surface-alt dark:bg-dark-surface py-1.5">
                    <p className={`text-base font-bold ${s.c}`}>{t.instanceCounts[s.k]}</p>
                    <p className="text-[9px] uppercase tracking-wide text-gray-400">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="flex-1 space-y-1">
                {active.slice(0, 3).map((i) => (
                  <button key={i.id} onClick={() => openProcess(i.id)} className="w-full flex items-center justify-between gap-2 text-left text-xs hover:text-primary-500">
                    <span className="truncate text-gray-700 dark:text-dark-text">{i.name}</span>
                    <span className="text-gray-400 whitespace-nowrap">{i.progress.done}/{i.progress.total}</span>
                  </button>
                ))}
                {active.length > 3 && <p className="text-[11px] text-gray-400">+{active.length - 3} em aberto</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setTemplateFilter(String(t.id)); setView("list"); }} className="btn-ghost flex-1 !py-1.5 text-xs">Ver processos</button>
                <button onClick={() => openStart(t.id)} className="btn-primary flex-1 !py-1.5 text-xs"><FiPlus size={13} /> Iniciar</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const kpiCard = (icon, label, value, color) => (
    <div className="card !p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-gray-800 dark:text-dark-text leading-none">{value}</p>
        <p className="text-[11px] text-gray-500 dark:text-dark-text-secondary mt-1">{label}</p>
      </div>
    </div>
  );

  return (
    <ProtectedRoute requiredPermissions={{ roles: ["admin", "user"] }}>
      <div className="space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FiCheckSquare size={18} className="text-primary-500" />
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-dark-text">Acompanhamento de Processos</h1>
              <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                {isAdmin ? "Todos os departamentos" : `Departamento ${user?.department || ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/processes/templates")} className="btn-ghost text-xs">
              <FiSettings size={13} /> Padrões
            </button>
            <button onClick={() => openStart()} disabled={templates.length === 0} className="btn-primary">
              <FiPlus size={15} /> Iniciar processo
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCard(<FiPlayCircle size={18} />, "Em andamento", kpis.inProgress, "bg-blue-50 text-blue-600 dark:bg-blue-900/20")}
          {kpiCard(<FiClock size={18} />, "Aguardando o cliente", kpis.waitingClient, "bg-orange-50 text-orange-600 dark:bg-orange-900/20")}
          {kpiCard(<FiPauseCircle size={18} />, "Pausados", kpis.paused, "bg-amber-50 text-amber-600 dark:bg-amber-900/20")}
          {kpiCard(<FiCheckCircle size={18} />, "Concluídos", kpis.completed, "bg-green-50 text-green-600 dark:bg-green-900/20")}
        </div>

        {/* Filtros */}
        <div className="card space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
              {VIEWS.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${idx > 0 ? "border-l border-gray-200 dark:border-dark-border" : ""} ${
                    view === v.id
                      ? "bg-primary-500 text-white"
                      : "bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50"
                  }`}
                >
                  <v.icon size={13} /> {v.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por processo ou cliente"
                className="input-base !pl-9 !py-1.5"
              />
            </div>

            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="input-base !w-auto !py-1.5 max-w-xs"
            >
              <option value="">Todos os padrões</option>
              {visibleTemplates.map((t) => <option key={t.id} value={t.id}>{isAdmin ? `${t.name} (${t.department})` : t.name}</option>)}
            </select>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-dark-text-secondary font-medium mr-1">Departamento:</span>
              {["Todos", ...departments].map((d) => (
                <button key={d} onClick={() => setDeptFilter(d)} className={chip(deptFilter === d)}>{d}</button>
              ))}
            </div>
          )}

          {view !== "templates" && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-dark-text-secondary font-medium mr-1">Status:</span>
              {STATUS_FILTERS.map((s) => (
                <button key={s.id} onClick={() => setStatusFilter(s.id)} className={chip(statusFilter === s.id)}>{s.label}</button>
              ))}
              <span className="ml-auto text-xs text-gray-400">{filtered.length} processo(s)</span>
            </div>
          )}
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : view === "list" ? (
          renderList()
        ) : view === "board" ? (
          renderBoard()
        ) : (
          renderTemplates()
        )}
      </div>

      {showForm && (
        <ProcessFormModal
          templates={templates}
          defaultTemplateId={formTemplateId}
          onClose={() => setShowForm(false)}
          onSaved={(inst) => router.push(`/processes/${inst.id}`)}
        />
      )}
    </ProtectedRoute>
  );
};

export default ProcessesPage;
