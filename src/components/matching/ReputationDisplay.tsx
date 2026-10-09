import React from 'react';
import type { Reputation } from "@/types/rider";
import { Star, Shield, MessageSquare, ThumbsUp } from 'lucide-react';

interface ReputationDisplayProps {
  reputation: Reputation;
  className?: string;
}

export const ReputationDisplay: React.FC<ReputationDisplayProps> = ({
  reputation,
  className = '',
}) => {
  const categories = [
    {
      label: 'Reliability & Punctuality',
      value: reputation.reliability,
      icon: Shield,
      color: 'bg-emerald-500',
    },
    {
      label: 'Communication',
      value: reputation.communication,
      icon: MessageSquare,
      color: 'bg-blue-500',
    },
    {
      label: 'Riding Behaviour & Safety',
      value: reputation.ridingBehaviour,
      icon: ThumbsUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className={`glass-card rounded-2xl p-5 border border-slate-800 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Reputation & Ratings
          </h3>
          <p className="text-xs text-slate-400">Based on {reputation.totalReviews} verified community reviews</p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-extrabold text-amber-400 text-base">
            {reputation.rating.toFixed(1)}
          </span>
          <span className="text-xs text-slate-500 font-medium">/ 5.0</span>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          const pct = (cat.value / 5.0) * 100;
          return (
            <div key={idx} className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  {cat.label}
                </span>
                <span className="font-mono font-bold text-slate-100">{cat.value.toFixed(1)}</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
