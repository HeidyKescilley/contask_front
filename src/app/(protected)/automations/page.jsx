// src/app/(protected)/automations/page.jsx
"use client";

import { useRouter } from "next/navigation";
import { FiFileText, FiChevronRight } from "react-icons/fi";
import ProtectedRoute from "../../../components/ProtectedRoute";

// Para adicionar uma nova automatização, inclua um card aqui e crie a página em /automations/<slug>.
const AUTOMATIONS = [
  {
    path: "/automations/dar",
    title: "Geração de DAR (1317)",
    description:
      "Gera o DAR avulso de ICMS Normal na SEFAZ-DF para uma ou várias empresas de uma vez.",
    icon: <FiFileText size={22} />,
  },
];

export default function AutomationsPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {AUTOMATIONS.map((a) => (
          <button
            key={a.path}
            onClick={() => router.push(a.path)}
            className="card text-left hover:shadow-md transition-shadow flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-primary-500/15 text-primary-400">{a.icon}</span>
              <FiChevronRight className="text-gray-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold">{a.title}</h2>
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">
                {a.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </ProtectedRoute>
  );
}
