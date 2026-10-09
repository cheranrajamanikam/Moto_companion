import React from 'react';

interface LoadingStateProps {
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-800"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-800 rounded w-2/3"></div>
              <div className="h-3 bg-slate-800/60 rounded w-1/2"></div>
            </div>
          </div>
          <div className="h-14 bg-slate-800/80 rounded-xl"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-slate-800 rounded w-1/4"></div>
            <div className="h-6 bg-slate-800 rounded w-1/4"></div>
            <div className="h-6 bg-slate-800 rounded w-1/4"></div>
          </div>
          <div className="h-10 bg-slate-800 rounded-xl"></div>
        </div>
      ))}
    </div>
  );
};
