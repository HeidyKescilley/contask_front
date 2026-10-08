// src/app/(protected)/automations/dar/page.jsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FiArrowLeft, FiPlay, FiDownload, FiSearch } from "react-icons/fi";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import api from "../../../../utils/api";

const SITUACOES = ["ATIVA", "SUSPENSA", "BAIXADA", "DISTRATO"];
const REGIMES = ["Simples", "Presumido", "Real", "MEI", "Isenta", "Doméstica"];

const STATUS_BADGE = {
  "Na fila": "badge-gray",
  Processando: "badge-blue",
  "PDF gerado": "badge-green",
  Erro: "badge-red",
};

const onlyDigits = (s) => String(s || "").replace(/\D/g, "");
const fmtCnpj = (v) => {
  const d = onlyDigits(v);
  return d.length === 14
    ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
    : v || "";
};

function baixarBlob(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DarPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [situacao, setSituacao] = useState(["ATIVA"]);
  const [regime, setRegime] = useState([]);
  const [uf, setUf] = useState("");
  const [selected, setSelected] = useState({}); // companyId -> valor (string)
  const [valorGeral, setValorGeral] = useState("");
  const [job, setJob] = useState(null);
  const [starting, setStarting] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    api
      .get("/company/all")
      .then((res) => setCompanies(res.data))
      .catch(() => toast.error("Erro ao carregar empresas."))
      .finally(() => setLoading(false));
    return () => clearTimeout(timer.current);
  }, []);

  const ufs = useMemo(
    () => [...new Set(companies.map((c) => c.uf).filter(Boolean))].sort(),
    [companies],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = onlyDigits(search);
    return companies.filter((c) => {
      if (situacao.length && !situacao.includes(c.status)) return false;
      if (regime.length && !regime.includes(c.rule)) return false;
      if (uf && c.uf !== uf) return false;
      if (!q) return true;
      return (
        (c.name || "").toLowerCase().includes(q) ||
        String(c.num ?? "").toLowerCase().includes(q) ||
        (qDigits && onlyDigits(c.cnpj).includes(qDigits))
      );
    });
  }, [companies, search, situacao, regime, uf]);

  const toggleIn = (list, setList, v) =>
    setList(list.includes(v) ? list.filter((i) => i !== v) : [...list, v]);

  const toggleCompany = (id) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = valorGeral;
      return next;
    });

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => c.id in selected);
  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const next = { ...prev };
      if (allFilteredSelected) filtered.forEach((c) => delete next[c.id]);
      else filtered.forEach((c) => !(c.id in next) && (next[c.id] = valorGeral));
      return next;
    });

  const aplicarValorGeral = () =>
    setSelected((prev) => Object.fromEntries(Object.keys(prev).map((id) => [id, valorGeral])));

  const selectedCompanies = companies.filter((c) => c.id in selected);
  const running = job && job.state !== "done";

  const poll = (jobId) => {
    api
      .get(`/automation/dar/jobs/${jobId}`)
      .then((res) => {
        setJob(res.data);
        if (res.data.state !== "done") timer.current = setTimeout(() => poll(jobId), 2000);
        else toast.success("Geração concluída.");
      })
      .catch(() => {
        toast.error("Perdi o acompanhamento da execução (o servidor pode ter reiniciado).");
        setJob(null);
      });
  };

  const handleStart = async () => {
    const semValor = selectedCompanies.filter((c) => !String(selected[c.id] || "").trim());
    if (semValor.length) {
      return toast.error(`Informe o valor para: ${semValor.map((c) => c.name).join(", ")}`);
    }
    setStarting(true);
    try {
      const res = await api.post("/automation/dar/jobs", {
        items: selectedCompanies.map((c) => ({ companyId: c.id, valor: selected[c.id] })),
      });
      setJob(res.data);
      poll(res.data.id);
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao iniciar a geração.");
    } finally {
      setStarting(false);
    }
  };

  const baixar = async (url, nome) => {
    try {
      const res = await api.get(url, { responseType: "blob" });
      baixarBlob(res.data, nome);
    } catch {
      toast.error("Não foi possível baixar o arquivo.");
    }
  };

  const nomePdf = (it) =>
    `DAR ${it.nome.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 50)} ${it.valor}.pdf`;

  return (
    <ProtectedRoute>
      <button
        onClick={() => router.push("/automations")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-4"
      >
        <FiArrowLeft size={14} /> Automatizações
      </button>

      {/* Seleção de empresas */}
      <div className="card mb-5">
        <h2 className="text-base font-semibold mb-4">1. Selecione as empresas</h2>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-[220px]">
            <label className="label-base">Buscar (nome, número ou CNPJ)</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base !pl-9"
                placeholder="Digite para filtrar..."
              />
            </div>
          </div>
          <div>
            <label className="label-base">UF</label>
            <select value={uf} onChange={(e) => setUf(e.target.value)} className="input-base !w-auto">
              <option value="">Todas</option>
              {ufs.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 mb-4">
          <div>
            <p className="label-base mb-1">Situação</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {SITUACOES.map((s) => (
                <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={situacao.includes(s)}
                    onChange={() => toggleIn(situacao, setSituacao, s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="label-base mb-1">Regime</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {REGIMES.map((r) => (
                <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regime.includes(r)}
                    onChange={() => toggleIn(regime, setRegime, r)}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="md" />
        ) : (
          <>
            <div className="flex items-center justify-between mb-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} />
                Selecionar todas as {filtered.length} filtradas
              </label>
              <span className="text-gray-500">{selectedCompanies.length} selecionada(s)</span>
            </div>
            <div className="max-h-[360px] overflow-y-auto border border-gray-100 dark:border-dark-border rounded-xl divide-y divide-gray-100 dark:divide-dark-border">
              {filtered.length === 0 && (
                <p className="p-4 text-sm text-gray-500">Nenhuma empresa com esses filtros.</p>
              )}
              {filtered.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <input type="checkbox" checked={c.id in selected} onChange={() => toggleCompany(c.id)} />
                  <span className="w-14 text-gray-500">{c.num}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-gray-500 hidden md:inline">{fmtCnpj(c.cnpj)}</span>
                  <span className="text-xs text-gray-500 w-20 text-right">{c.status}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Valores */}
      {selectedCompanies.length > 0 && (
        <div className="card mb-5">
          <h2 className="text-base font-semibold mb-4">2. Informe os valores</h2>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div>
              <label className="label-base">Mesmo valor para todas (ex: 10,11)</label>
              <input
                value={valorGeral}
                onChange={(e) => setValorGeral(e.target.value)}
                className="input-base !w-40"
                placeholder="0,00"
              />
            </div>
            <button onClick={aplicarValorGeral} className="btn-secondary">
              Aplicar a todas
            </button>
          </div>
          <div className="space-y-2">
            {selectedCompanies.map((c) => (
              <div key={c.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 truncate">
                  {c.name} <span className="text-gray-500">- {fmtCnpj(c.cnpj)}</span>
                </span>
                <input
                  value={selected[c.id]}
                  onChange={(e) => setSelected((p) => ({ ...p, [c.id]: e.target.value }))}
                  className="input-base !w-32"
                  placeholder="0,00"
                  disabled={running}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleStart} disabled={starting || running} className="btn-success">
              <FiPlay size={16} />
              {running ? "Gerando..." : `Gerar ${selectedCompanies.length} DAR(s)`}
            </button>
          </div>
        </div>
      )}

      {/* Andamento */}
      {job && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">3. Andamento</h2>
            {job.items.some((i) => i.hasPdf) && (
              <button
                onClick={() => baixar(`/automation/dar/jobs/${job.id}/zip`, "DARs.zip")}
                className="btn-success"
              >
                <FiDownload size={16} /> Baixar todos (.zip)
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            {job.items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="flex-1 truncate">
                  {it.nome} <span className="text-gray-500">- R$ {it.valor}</span>
                </span>
                <span className="text-xs text-gray-500 max-w-[260px] truncate" title={it.detalhe}>
                  {it.detalhe}
                </span>
                <span className={STATUS_BADGE[it.status] || "badge-gray"}>{it.status}</span>
                {it.hasPdf && (
                  <button
                    onClick={() => baixar(`/automation/dar/jobs/${job.id}/items/${it.id}/pdf`, nomePdf(it))}
                    title="Baixar PDF"
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    <FiDownload size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
