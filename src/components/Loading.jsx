// src/components/Loading.jsx
"use client";

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-[3px] border-gray-200 dark:border-dark-border"></div>
          <div className="w-12 h-12 rounded-full border-[3px] border-transparent border-t-primary-500 animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-sm text-gray-400 dark:text-dark-text-secondary">
          Carregando...
        </p>
      </div>
    </div>
  );
};

export default Loading;
