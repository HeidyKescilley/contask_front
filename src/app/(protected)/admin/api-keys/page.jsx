"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../hooks/useAuth";
import api from "../../../../utils/api";
import { toast } from "react-toastify";
import {
  FiKey,
  FiPlus,
  FiTrash2,
  FiCopy,
  FiCheck,
  FiLoader,
  FiAlertTriangle,
} from "react-icons/fi";

const ApiKeysPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null); // { id, key }
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.id !== 1) {
      router.replace("/home");
      return;
    }
    fetchKeys();
  }, [user, authLoading, router]);

  const fetchKeys = () => {
    setLoading(true);
    api
      .get("/api-keys")
      .then((res) => setKeys(res.data))
      .catch(() => toast.error("Erro ao carregar chaves."))
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error("Informe um nome para a chave.");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post("/api-keys", { name: newKeyName.trim() });
      setRevealedKey({ id: res.data.id, key: res.data.key });
      setNewKeyName("");
      fetchKeys();
      toast.success("Chave gerada! Copie-a agora — ela não será exibida novamente.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao gerar chave.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRevoke = async (id) => {
    if (!confirm("Revogar esta chave? Ela não poderá mais ser usada.")) return;
    setRevoking(id);
    try {
      await api.delete(`/api-keys/${id}`);
      toast.success("Chave revogada.");
      if (revealedKey?.id === id) setRevealedKey(null);
      fetchKeys();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao revogar chave.");
    } finally {
      setRevoking(null);
    }
  };

  const maskKey = (id) => {
    if (revealedKey?.id === id) return revealedKey.key;
    return null;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading || (loading && keys.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="animate-spin text-primary-400" size={28} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <FiKey size={22} className="text-primary-400" />
        <h1 className="text-xl font-bold text-gray-100">API Keys</h1>
      </div>

      {/* Formulário de criação */}
      <form onSubmit={handleCreate} className="bg-sidebar-bg border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300">Gerar nova chave</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Nome da chave (ex: Script DAS, Bot Simples)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
              text-sm text-gray-200 placeholder-gray-500 outline-none
              focus:border-primary-500/60 transition-colors"
          />
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600
              text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
          >
            {creating ? <FiLoader className="animate-spin" size={15} /> : <FiPlus size={15} />}
            Gerar
          </button>
        </div>
      </form>

      {/* Alerta com a chave recém-gerada */}
      {revealedKey && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-yellow-400">
            <FiAlertTriangle size={16} />
            <span className="text-sm font-semibold">
              Copie sua chave agora — ela não será exibida novamente.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-black/30 rounded-xl px-4 py-2.5 text-xs text-green-300 font-mono break-all">
              {revealedKey.key}
            </code>
            <button
              onClick={handleCopy}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
              title="Copiar"
            >
              {copied ? <FiCheck size={16} className="text-green-400" /> : <FiCopy size={16} />}
            </button>
          </div>
          <button
            onClick={() => setRevealedKey(null)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Tabela de chaves */}
      <div className="bg-sidebar-bg border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Criada em</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Último uso</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {keys.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                  Nenhuma chave gerada ainda.
                </td>
              </tr>
            )}
            {keys.map((k) => (
              <tr key={k.id} className="hover:bg-white/2 transition-colors">
                <td className="px-5 py-3.5 text-gray-200 font-medium">{k.name}</td>
                <td className="px-5 py-3.5 text-gray-400">{formatDate(k.createdAt)}</td>
                <td className="px-5 py-3.5 text-gray-400">{formatDate(k.lastUsedAt)}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      ${k.active
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400"
                      }`}
                  >
                    {k.active ? "Ativa" : "Revogada"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  {k.active && (
                    <button
                      onClick={() => handleRevoke(k.id)}
                      disabled={revoking === k.id}
                      className="p-2 rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-500/10
                        transition-colors disabled:opacity-40"
                      title="Revogar chave"
                    >
                      {revoking === k.id
                        ? <FiLoader className="animate-spin" size={15} />
                        : <FiTrash2 size={15} />
                      }
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApiKeysPage;
