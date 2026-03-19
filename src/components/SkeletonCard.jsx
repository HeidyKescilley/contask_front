"use client";

const SkeletonCard = ({ count = 4 }) => (
  <div className={`grid grid-cols-2 sm:grid-cols-${count} gap-3`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card py-4 animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-20 bg-gray-200 dark:bg-dark-surface rounded" />
          <div className="h-7 w-14 bg-gray-200 dark:bg-dark-surface rounded" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonCard;
