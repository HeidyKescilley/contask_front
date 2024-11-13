// src/components/Sidebar.jsx
"use client";

import { useAuth } from "../hooks/useAuth";
import { useState, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FiHome,
  FiUser,
  FiLayers,
  FiBriefcase,
  FiPlus,
  FiLogOut,
  FiSend, // Importando o ícone FiBell
} from "react-icons/fi";
import Image from "next/image";
import { CompanyModalContext } from "../context/CompanyModalContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { openAddCompanyModal } = useContext(CompanyModalContext);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddCompanyClick = () => {
    openAddCompanyModal();
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
    // Novo item de menu "Criar Aviso" adicionado aqui
    {
      name: "Criar Aviso",
      path: "/alert",
      icon: <FiSend size={24} />,
      colorClass: "text-white",
      hoverBgClass: "hover:bg-logo-dark-blue",
    },
    // Item "Nova Empresa" existente
    {
      name: "Nova Empresa",
      action: () => handleAddCompanyClick(),
      icon: <FiPlus size={24} />,
      colorClass: "text-accent-green",
      hoverBgClass: "hover:bg-accent-green-light",
    },
  ];

  const handleMenuItemClick = (item) => {
    if (item.path) {
      router.push(item.path);
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`h-screen bg-logo-light-blue dark:bg-dark-card ${
          isExpanded ? "w-64" : "w-20"
        } transition-all duration-200 ease-in-out flex flex-col shadow-md`}
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
            {menuItems.map((item) => (
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
            ))}
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
