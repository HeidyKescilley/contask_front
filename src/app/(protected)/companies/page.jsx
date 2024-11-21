// src/app/(protected)/companies/page.jsx
"use client";

import React, { Suspense } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import CompaniesPageContent from "./CompaniesPageContent"; // Import the separated component

const CompaniesPage = () => {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Carregando...</div>}>
        <CompaniesPageContent />
      </Suspense>
    </ProtectedRoute>
  );
};

export default CompaniesPage;
