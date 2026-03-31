// src/app/layout.js
"use client";

import "../styles/globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import { CompanyModalProvider } from "../context/CompanyModalContext";
import { CompetenciaProvider } from "../context/CompetenciaContext";
import { SidebarProvider } from "../context/SidebarContext";
import { ThemeProvider, ThemeContext } from "../context/ThemeContext";
import { ZoomProvider } from "../context/ZoomContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useContext } from "react";

const inter = Inter({ subsets: ["latin"] });

function LayoutInner({ children }) {
  const { theme } = useContext(ThemeContext);

  return (
    <html lang="pt-BR" className={theme === "dark" ? "dark" : ""}>
      <body
        className={`${inter.className} bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text`}
      >
        <AuthProvider>
          <CompetenciaProvider>
          <CompanyModalProvider>
            <SidebarProvider>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                theme={theme === "dark" ? "dark" : "light"}
                toastClassName="!rounded-xl !shadow-card"
              />
              {children}
            </SidebarProvider>
          </CompanyModalProvider>
          </CompetenciaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

export default function RootLayout({ children }) {
  return (
    <ZoomProvider>
      <ThemeProvider>
        <LayoutInner>{children}</LayoutInner>
      </ThemeProvider>
    </ZoomProvider>
  );
}
