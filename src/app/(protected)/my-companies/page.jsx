// src/app/(protected)/my-companies/page.jsx
"use client";

import React, { Suspense } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import MyCompaniesPageContent from "./MyCompaniesPageContent"; // Import the separated component

const MyCompaniesPage = () => {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Carregando...</div>}>
        <MyCompaniesPageContent />
      </Suspense>
    </ProtectedRoute>
  );
};

export default MyCompaniesPage;
