// src/components/PageHeader.jsx
"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import CompetenciaSelector from "./CompetenciaSelector";

// Páginas que exibem o seletor de competência
const COMPETENCIA_PAGES = new Set(["/my-companies", "/dashboard", "/admin/bonus"]);

const PAGE_TITLES = {
  "/home": { title: "Home", subtitle: "Visao geral do sistema" },
  "/my-companies": {
    title: "Minhas Empresas",
    subtitle: "Empresas sob sua responsabilidade",
  },
  "/companies": {
    title: "Empresas",
    subtitle: "Gerenciamento de todas as empresas",
  },
  "/contacts": { title: "Contatos", subtitle: "Modos de contato" },
  "/alert": { title: "Criar Aviso", subtitle: "Enviar avisos para a equipe" },
  "/dashboard": { title: "Dashboard", subtitle: "Indicadores e estatisticas" },
  "/profile": { title: "Meu Perfil", subtitle: "Configuracoes da sua conta" },
  "/admin/users": {
    title: "Gestao de Usuarios",
    subtitle: "Gerenciar contas e permissoes",
  },
  "/admin/team-view": {
    title: "Visao de Equipes",
    subtitle: "Acompanhamento por departamento",
  },
  "/admin/bonus": {
    title: "Calculo de Bonus",
    subtitle: "Bonificacao mensal da equipe",
  },
  "/admin/export": {
    title: "Exportar Dados",
    subtitle: "Gerar relatorios e planilhas",
  },
};

const PageHeader = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const pageInfo = PAGE_TITLES[pathname];

  if (!pageInfo) return null;

  const showCompetencia = COMPETENCIA_PAGES.has(pathname);

  return (
    <div className={`mb-6 ${showCompetencia ? "flex items-start justify-between flex-wrap gap-3" : ""}`}>
      <div>
        <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">
          {pageInfo.title}
        </h1>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
          {pageInfo.subtitle}
        </p>
      </div>
      {showCompetencia && <CompetenciaSelector />}
    </div>
  );
};

export default PageHeader;
