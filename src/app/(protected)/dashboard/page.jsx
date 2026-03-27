// src/app/(protected)/dashboard/page.jsx
"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import ObligationsDashboard from "../../../components/ObligationsDashboard";

const DashboardPage = () => {
  return (
    <ProtectedRoute>
      <div className="card">
        <ObligationsDashboard />
      </div>
    </ProtectedRoute>
  );
};

export default DashboardPage;
