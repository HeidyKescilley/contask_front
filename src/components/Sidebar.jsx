// src/components/Sidebar.jsx
"use client";

import { useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FiHome,
  FiUser,
  FiLayers,
  FiBriefcase,
  FiPlus,
  FiLogOut,
  FiSend,
  FiUsers,
  FiSettings,
  FiBarChart2,
  FiDownload,
  FiAward,
  FiGrid,
  FiDollarSign,
  FiChevronLeft,
  FiZoomIn,
  FiZoomOut,
  FiPauseCircle,
  FiDatabase,
  FiActivity,
  FiMessageSquare,
} from "react-icons/fi";
import Image from "next/image";
import { CompanyModalContext } from "../context/CompanyModalContext";
import { SidebarContext } from "../context/SidebarContext";
import { ZoomContext } from "../context/ZoomContext";
import { useAuth } from "../hooks/useAuth";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { isExpanded, toggleSidebar } = useContext(SidebarContext);
  const { zoom, zoomIn, zoomOut, canZoomIn, canZoomOut } = useContext(ZoomContext);
  const pathname = usePathname();
  const router = useRouter();
  const { openAddCompanyModal } = useContext(CompanyModalContext);

  const menuGroups = [
    {
      label: "Principal",
      items: [
        { name: "Home", path: "/home", icon: <FiHome size={18} /> },
        { name: "Minhas Empresas", path: "/my-companies", icon: <FiBriefcase size={18} /> },
        { name: "Empresas", path: "/companies", icon: <FiLayers size={18} /> },
        { name: "Contatos", path: "/contacts", icon: <FiUsers size={18} /> },
      ],
    },
    {
      label: "Ferramentas",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: <FiBarChart2 size={18} />,
          permissions: { roles: ["admin"], departments: ["Fiscal", "Pessoal"] },
        },
        {
          name: "Criar Aviso",
          path: "/alert",
          icon: <FiSend size={18} />,
          permissions: { roles: ["admin"] },
        },
        {
          name: "Nova Empresa",
          action: openAddCompanyModal,
          icon: <FiPlus size={18} />,
          isAction: true,
        },
      ],
    },
  ];

  if (user && user.role === "admin") {
    const adminItems = [
      { name: "Gestao de Usuarios", path: "/admin/users", icon: <FiSettings size={18} /> },
      { name: "Avisos", path: "/admin/announcements", icon: <FiMessageSquare size={18} /> },
      { name: "Visao de Equipes", path: "/admin/team-view", icon: <FiGrid size={18} /> },
      { name: "Calculo de Bonus", path: "/admin/bonus", icon: <FiAward size={18} /> },
      { name: "Impostos / Obrigações", path: "/admin/taxes", icon: <FiDollarSign size={18} /> },
      { name: "Paralisações", path: "/admin/suspensions", icon: <FiPauseCircle size={18} /> },
      { name: "Exportar Dados", path: "/admin/export", icon: <FiDownload size={18} /> },
      { name: "Verificação DB", path: "/admin/db-verify", icon: <FiDatabase size={18} /> },
    ];
    if ([1, 4].includes(user.id)) {
      adminItems.push({ name: "Monitor de Atividade", path: "/admin/activity-monitor", icon: <FiActivity size={18} /> });
    }
    menuGroups.push({ label: "Administracao", items: adminItems });
  }

  const checkDisplayPermission = (item) => {
    if (!item.permissions || !user) return true;
    const { roles = [], departments = [] } = item.permissions;
    if (roles.length > 0 && roles.includes(user.role)) return true;
    if (departments.length > 0 && departments.includes(user.department)) return true;
    return false;
  };

  const isActive = (path) => pathname === path;

  const renderMenuItem = (item) => {
    if (!checkDisplayPermission(item)) return null;

    const active = item.path && isActive(item.path);
    const isActionItem = item.isAction;

    const baseClasses = `w-full flex items-center gap-3 px-3 py-2 rounded-xl
      transition-all duration-150 group relative
      ${isExpanded ? "" : "justify-center"}`;

    const stateClasses = isActionItem
      ? "text-accent-green hover:bg-accent-green/10"
      : active
      ? "bg-primary-500/15 text-primary-400"
      : "text-gray-400 hover:bg-sidebar-hover hover:text-gray-100";

    const handleClick = () => {
      if (item.path) router.push(item.path);
      else if (item.action) item.action();
    };

    return (
      <button
        key={item.name}
        onClick={handleClick}
        className={`${baseClasses} ${stateClasses}`}
      >
        <div className="min-w-[20px] flex justify-center flex-shrink-0">
          {item.icon}
        </div>
        {isExpanded && (
          <span className="text-sm font-medium truncate leading-none min-w-0 flex-1">{item.name}</span>
        )}
        {!isExpanded && (
          <div className="absolute left-full ml-2.5 px-2.5 py-1.5 bg-gray-900 text-white text-xs
            rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100
            group-hover:visible transition-all duration-150 z-[60] pointer-events-none
            shadow-lg border border-white/10">
            {item.name}
          </div>
        )}
      </button>
    );
  };

  return (
    <div
      className={`h-screen bg-sidebar-bg flex flex-col fixed top-0 left-0 z-50
        border-r border-white/5 shadow-xl
        transition-[width] duration-300 ease-in-out
        ${isExpanded ? "w-64" : "w-[60px]"}`}
    >
      {/* Header */}
      <div
        className={`flex-shrink-0 h-14 flex items-center cursor-pointer
          border-b border-white/8 hover:bg-sidebar-hover transition-colors duration-150
          ${isExpanded ? "px-3" : "justify-center"}`}
        onClick={toggleSidebar}
      >
        <div className="flex items-center min-w-[24px] justify-center flex-shrink-0">
          <Image src="/logo.png" width={24} height={24} alt="Logo" />
        </div>
        {isExpanded && (
          <>
            <span className="ml-2.5 text-base font-bold text-white tracking-tight">
              Contask
            </span>
            <div className="ml-auto text-gray-500">
              <FiChevronLeft size={14} />
            </div>
          </>
        )}
      </div>

      {/* Menu — overflow-hidden quando colapsado para evitar scrollbar */}
      <nav className={`flex-1 py-2 px-1.5 overflow-x-hidden ${isExpanded ? "overflow-y-auto" : "overflow-hidden"}`} style={isExpanded ? { scrollbarWidth: "thin" } : {}}>
        {menuGroups.map((group, groupIndex) => {
          const visibleItems = group.items.filter(checkDisplayPermission);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className={groupIndex > 0 ? "mt-1" : ""}>
              {groupIndex > 0 && (
                <div className="mx-2 my-1.5 border-t border-white/8" />
              )}
              {isExpanded && (
                <p className="px-3 pt-1 pb-1 text-[9px] font-bold uppercase tracking-widest text-gray-600 select-none">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(renderMenuItem)}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Zoom Controls */}
      <div className={`flex-shrink-0 border-t border-white/8 px-1.5 py-1.5
        ${isExpanded ? "flex items-center gap-1" : "flex flex-col items-center gap-1"}`}>
        {isExpanded && (
          <span className="text-[10px] text-gray-600 font-medium ml-2 mr-auto select-none">
            Zoom {zoom}%
          </span>
        )}
        <button
          onClick={zoomOut}
          disabled={!canZoomOut}
          title="Diminuir zoom"
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-sidebar-hover
            transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FiZoomOut size={14} />
        </button>
        <button
          onClick={zoomIn}
          disabled={!canZoomIn}
          title="Aumentar zoom"
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-sidebar-hover
            transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FiZoomIn size={14} />
        </button>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-white/8 px-1.5 py-1.5 space-y-0.5">
        <button
          onClick={() => router.push("/profile")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl
            transition-all duration-150 group relative
            ${isExpanded ? "" : "justify-center"}
            ${isActive("/profile")
              ? "bg-primary-500/15 text-primary-400"
              : "text-gray-400 hover:bg-sidebar-hover hover:text-gray-100"
            }`}
        >
          <div className="min-w-[20px] flex justify-center flex-shrink-0">
            <FiUser size={18} />
          </div>
          {isExpanded && user && (
            <span className="text-sm font-medium truncate leading-none min-w-0 flex-1">{user.name}</span>
          )}
          {!isExpanded && (
            <div className="absolute left-full ml-2.5 px-2.5 py-1.5 bg-gray-900 text-white text-xs
              rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100
              group-hover:visible transition-all duration-150 z-[60] pointer-events-none
              shadow-lg border border-white/10">
              {user?.name || "Perfil"}
            </div>
          )}
        </button>

        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl
            text-red-500/70 hover:bg-red-500/10 hover:text-red-400
            transition-all duration-150 group relative
            ${isExpanded ? "" : "justify-center"}`}
        >
          <div className="min-w-[20px] flex justify-center flex-shrink-0">
            <FiLogOut size={18} />
          </div>
          {isExpanded && <span className="text-sm font-medium leading-none">Sair</span>}
          {!isExpanded && (
            <div className="absolute left-full ml-2.5 px-2.5 py-1.5 bg-gray-900 text-white text-xs
              rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100
              group-hover:visible transition-all duration-150 z-[60] pointer-events-none
              shadow-lg border border-white/10">
              Sair
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
