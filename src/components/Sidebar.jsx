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
  FiBarChart2, // Importar novo ícone para dashboard
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
    },
    {
      name: "Contatos",
      path: "/contacts",
      icon: <FiUsers size={24} />,
      colorClass: "text-white",
      hoverBgClass: "hover:bg-logo-dark-blue",
    },
    // NOVO ITEM DE MENU
    {
      name: "Dashboard Fiscal",
      path: "/fiscal-dashboard",
      icon: <FiBarChart2 size={24} />, // Ícone de gráfico
      colorClass: "text-white",
      hoverBgClass: "hover:bg-logo-dark-blue",
      roles: ["fiscal", "admin"], // Apenas para Fiscal (departamento) e Admin (role)
    },
    {
      name: "Nova Empresa",
      action: () => handleAddCompanyClick(),
      icon: <FiPlus size={24} />,
      colorClass: "text-accent-green",
      hoverBgClass: "hover:bg-accent-green-light",
    },
  ];

  // Se o usuário for administrador, adicionamos itens extras
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
        name: "Enviar Suspensas",
        action: handleSendSuspendedCompanies,
        icon: <FiMail size={24} />,
        colorClass: "text-white",
        hoverBgClass: "hover:bg-logo-dark-blue",
      }
    );
  }

  const handleMenuItemClick = (item) => {
    // Verifica a permissão antes de navegar
    if (item.roles && user) {
      let hasPermission = false;
      if (item.roles.includes(user.role)) {
        // Verifica se a role do usuário está na lista
        hasPermission = true;
      }
      if (item.roles.includes("fiscal") && user.department === "Fiscal") {
        // Verifica se é fiscal
        hasPermission = true;
      }

      if (!hasPermission) {
        toast.error("Você não tem permissão para acessar esta página.");
        return;
      }
    }

    if (item.path) {
      router.push(item.path);
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <div>
      {/* Sidebar */}
      <div
        className={`h-screen bg-logo-light-blue dark:bg-dark-card ${
          isExpanded ? "w-64" : "w-20"
        } transition-all duration-200 ease-in-out flex flex-col shadow-md fixed top-0 left-0 z-50`}
      >
        {/* Logo e botão de toggle */}
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
        {/* Itens do menu */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="mt-4 flex flex-col items-center">
            {menuItems.map((item) => {
              // Filtrar itens de menu por role/departamento se necessário
              const shouldShowItem =
                !item.roles ||
                (user &&
                  (item.roles.includes(user.role) ||
                    (user.department === "Fiscal" &&
                      item.roles.includes("fiscal"))));

              if (!shouldShowItem) return null;

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
          {/* Perfil e Logout */}
          <div className="mb-4 flex flex-col items-center">
            {/* Perfil */}
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
            {/* Logout */}
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
