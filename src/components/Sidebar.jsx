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
  FiMail,
  FiBarChart2,
  FiDownload,
  FiAward,
} from "react-icons/fi";
import Image from "next/image";
import { CompanyModalContext } from "../context/CompanyModalContext";
import { SidebarContext } from "../context/SidebarContext";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import { toast } from "react-toastify";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { isExpanded, toggleSidebar } = useContext(SidebarContext);
  const pathname = usePathname();
  const router = useRouter();
  const { openAddCompanyModal } = useContext(CompanyModalContext);

  const handleAddCompanyClick = () => {
    openAddCompanyModal();
  };

  const handleSendSuspendedCompanies = async () => {
    const confirmSend = confirm(
      "Deseja realmente enviar manualmente a lista de empresas suspensas?"
    );
    if (confirmSend) {
      try {
        const res = await api.post("/admin/send-suspended-companies");
        toast.success(res.data.message);
      } catch (error) {
        toast.error(error.response?.data?.message || "Erro ao enviar email.");
      }
    }
  };

  const handleMenuItemClick = (item) => {
    if (item.path) {
      router.push(item.path);
    } else if (item.action) {
      item.action();
    }
  };

  // Estrutura de permissões corrigida: roles e departments separados
  const menuItems = [
    {
      name: "Home",
      path: "/home",
      icon: <FiHome size={24} />,
      colorClass: "text-white",
      hoverBgClass: "hover:bg-logo-dark-blue",
    },
    {
      name: "Minhas Empresas",
      path: "/my-companies",
      icon: <FiBriefcase size={24} />,
      colorClass: "text-white",
      hoverBgClass: "hover:bg-logo-dark-blue",
    },
    {
      name: "Empresas",
      path: "/companies",
      icon: <FiLayers size={24} />,
      colorClass: "text-white",
      hoverBgClass: "hover:bg-logo-dark-blue",
    },
    {
      name: "Criar Aviso",
      path: "/alert",
      icon: <FiSend size={24} />,
      colorClass: "text-white",
      hoverBgClass: "hover:bg-logo-dark-blue",
      permissions: { roles: ["admin"] }, // Apenas Admin
    },
    {
      name: "Contatos",
      path: "/contacts",
      icon: <FiUsers size={24} />,
      colorClass: "text-white",
      hoverBgClass: "hover:bg-logo-dark-blue",
    },
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <FiBarChart2 size={24} />,
      colorClass: "text-white",
      hoverBgClass: "hover:bg-logo-dark-blue",
      permissions: { roles: ["admin"], departments: ["Fiscal", "Pessoal"] },
    },
    {
      name: "Nova Empresa",
      action: handleAddCompanyClick,
      icon: <FiPlus size={24} />,
      colorClass: "text-accent-green",
      hoverBgClass: "hover:bg-accent-green-light",
    },
  ];

  if (user && user.role === "admin") {
    menuItems.push(
      {
        name: "Gestão de Usuários",
        path: "/admin/users",
        icon: <FiSettings size={24} />,
        colorClass: "text-white",
        hoverBgClass: "hover:bg-logo-dark-blue",
      },
      {
        // <-- NOVO ITEM DE MENU A SER ADICIONADO
        name: "Cálculo de Bônus",
        path: "/admin/bonus",
        icon: <FiAward size={24} />,
        colorClass: "text-white",
        hoverBgClass: "hover:bg-logo-dark-blue",
      },
      {
        name: "Enviar Suspensas",
        action: handleSendSuspendedCompanies,
        icon: <FiMail size={24} />,
        colorClass: "text-white",
        hoverBgClass: "hover:bg-logo-dark-blue",
      },
      {
        name: "Exportar Dados",
        path: "/admin/export",
        icon: <FiDownload size={24} />, // Ícone para download/exportação
        colorClass: "text-white",
        hoverBgClass: "hover:bg-logo-dark-blue",
      }
    );
  }

  // Função que verifica a permissão para exibir o item de menu
  const checkDisplayPermission = (item) => {
    if (!item.permissions || !user) {
      return true; // Mostra se não tiver restrições ou se o usuário ainda não carregou
    }

    const { roles = [], departments = [] } = item.permissions;

    if (roles.length > 0 && roles.includes(user.role)) return true;
    if (departments.length > 0 && departments.includes(user.department))
      return true;

    return false;
  };

  return (
    <div>
      <div
        className={`h-screen bg-logo-light-blue dark:bg-dark-card ${
          isExpanded ? "w-64" : "w-20"
        } transition-all duration-200 ease-in-out flex flex-col shadow-md fixed top-0 left-0 z-50`}
      >
        <div
          className="p-4 bg-logo-light-blue dark:bg-gray-800 flex items-center justify-center cursor-pointer"
          onClick={toggleSidebar}
        >
          {isExpanded ? (
            <>
              <Image src="/logo.png" width={30} height={30} alt="Logo" />
              <span className="ml-2 text-xl font-bold text-white">Contask</span>
            </>
          ) : (
            <Image src="/logo.png" width={30} height={30} alt="Logo" />
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div className="mt-4 flex flex-col items-center">
            {menuItems.map((item) => {
              // Se o usuário não tiver permissão, o item nem é renderizado.
              if (!checkDisplayPermission(item)) {
                return null;
              }

              return (
                <div
                  key={item.name}
                  className={`w-full ${
                    pathname === item.path
                      ? "bg-logo-dark-blue"
                      : "bg-transparent"
                  }`}
                >
                  <button
                    onClick={() => handleMenuItemClick(item)}
                    className={`w-full flex items-center px-4 py-2 focus:outline-none ${
                      isExpanded ? "justify-start" : "justify-center"
                    } ${item.hoverBgClass}`}
                  >
                    <div className={`${item.colorClass}`}>{item.icon}</div>
                    {isExpanded && (
                      <span className={`ml-2 ${item.colorClass}`}>
                        {item.name}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mb-4 flex flex-col items-center">
            <div
              className={`w-full ${
                pathname === "/profile" ? "bg-logo-dark-blue" : "bg-transparent"
              }`}
            >
              <button
                onClick={() => router.push("/profile")}
                className={`w-full flex items-center px-4 py-2 hover:bg-logo-dark-blue focus:outline-none ${
                  isExpanded ? "justify-start" : "justify-center"
                }`}
              >
                <div className="text-white">
                  <FiUser size={24} />
                </div>
                {isExpanded && user && (
                  <span className="ml-2 text-white">{user.name}</span>
                )}
              </button>
            </div>
            <button
              onClick={logout}
              className={`w-full flex items-center px-4 py-2 text-white bg-accent-red hover:bg-accent-red-light focus:outline-none ${
                isExpanded ? "justify-start" : "justify-center"
              }`}
            >
              <div className="text-white">
                <FiLogOut size={24} />
              </div>
              {isExpanded && <span className="ml-2 text-white">Sair</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
