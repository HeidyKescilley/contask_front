// src/components/Navbar.jsx
"use client";

import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <Link href="/">
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              CONTASK
            </span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {!user ? (
            <>
              <Link href="/login">
                <span className="text-gray-800 dark:text-white">Login</span>
              </Link>
              <Link href="/register">
                <span className="text-gray-800 dark:text-white">Registro</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/home">
                <span className="text-gray-800 dark:text-white">Home</span>
              </Link>
              <Link href="/my-companies">
                <span className="text-gray-800 dark:text-white">
                  Minhas Empresas
                </span>
              </Link>
              <Link href="/companies">
                <span className="text-gray-800 dark:text-white">Empresas</span>
              </Link>
              <Link href="/alert">
                <span className="text-gray-800 dark:text-white">
                  Criar Aviso
                </span>
              </Link>
              <Link href="/profile">
                <span className="text-gray-800 dark:text-white">
                  {user.name}
                </span>
              </Link>
              <button
                onClick={logout}
                className="text-gray-800 dark:text-white focus:outline-none"
              >
                Sair
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
