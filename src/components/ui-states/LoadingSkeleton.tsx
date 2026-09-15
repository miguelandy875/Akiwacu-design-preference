import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  type?: 'card' | 'table' | 'counter';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 3, type = 'card' }) => {
  if (type === 'counter') {
    return (
      <div className="animate-pulse p-6 bg-white rounded-xl border border-stone-200 shadow-xs space-y-4">
        <div className="h-4 bg-stone-200 rounded w-1/3"></div>
        <div className="h-10 bg-stone-200 rounded w-2/3"></div>
        <div className="h-4 bg-stone-100 rounded w-1/2"></div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="animate-pulse bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="h-12 bg-stone-100 border-b border-stone-200"></div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border-b border-stone-100 last:border-0">
            <div className="h-4 bg-stone-200 rounded w-1/4"></div>
            <div className="h-4 bg-stone-200 rounded w-1/3"></div>
            <div className="h-4 bg-stone-200 rounded w-1/6 ml-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse p-4 bg-white rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-stone-200 rounded w-1/3"></div>
            <div className="h-3 bg-stone-100 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-stone-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
};
