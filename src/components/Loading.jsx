// src/components/Loading.jsx
"use client";

import LoadingSpinner from "./LoadingSpinner";

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg">
      <LoadingSpinner size="lg" />
    </div>
  );
};

export default Loading;
