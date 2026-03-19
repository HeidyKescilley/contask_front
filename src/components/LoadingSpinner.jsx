"use client";

const sizeMap = {
  sm: { spinner: "w-4 h-4", border: "border-2", wrapper: "inline-flex", text: false },
  md: { spinner: "w-8 h-8", border: "border-[3px]", wrapper: "flex flex-col items-center justify-center gap-3 py-6", text: true },
  lg: { spinner: "w-10 h-10", border: "border-[3px]", wrapper: "flex flex-col items-center justify-center gap-3 min-h-[200px]", text: true },
};

const LoadingSpinner = ({ size = "md", text }) => {
  const s = sizeMap[size] || sizeMap.md;
  const showText = s.text && text !== false;
  const label = typeof text === "string" ? text : "Carregando...";

  return (
    <div className={s.wrapper}>
      <div className="relative">
        <div className={`${s.spinner} rounded-full ${s.border} border-gray-200 dark:border-dark-border`} />
        <div className={`${s.spinner} rounded-full ${s.border} border-transparent border-t-primary-500 animate-spin absolute top-0 left-0`} />
      </div>
      {showText && (
        <p className="text-sm text-gray-400 dark:text-dark-text-secondary">{label}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
