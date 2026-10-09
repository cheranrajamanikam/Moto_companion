import React from 'react';
import { SearchX, Bike, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionLabel?: string;
  onAction?: () => void;
  iconType?: 'search' | 'bikes' | 'requests' | 'inbox';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No suitable matches found',
  description = 'Try increasing your distance or CC range filters to expand your ride partner search.',
  actionText,
  actionLabel,
  onAction,
  iconType = 'search',
}) => {
  const btnLabel = actionLabel || actionText;
  const getIcon = () => {
    switch (iconType) {
      case 'bikes':
        return <Bike className="w-12 h-12 text-orange-400/80" />;
      case 'requests':
        return <Inbox className="w-12 h-12 text-amber-400/80" />;
      default:
        return <SearchX className="w-12 h-12 text-slate-500" />;
    }
  };

  return (
    <div className="glass-card rounded-2xl p-10 border border-slate-800 text-center max-w-md mx-auto my-6 space-y-4">
      <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
        {getIcon()}
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-200">{title}</h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>
      </div>

      {btnLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
        >
          {btnLabel}
        </button>
      )}
    </div>
  );
};
