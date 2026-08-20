// src/app/(protected)/certificates/page.jsx
"use client";

import React, { Suspense } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import CertificatesPageContent from "./CertificatesPageContent";

const CertificatesPage = () => {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Carregando...</div>}>
        <CertificatesPageContent />
      </Suspense>
    </ProtectedRoute>
  );
};

export default CertificatesPage;
