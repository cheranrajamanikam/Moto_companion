import React from 'react';
import type { Badge as BadgeType } from "@/types/rider";
import { ShieldCheck, Star, Award, Compass, ThumbsUp, Bike } from 'lucide-react';

interface BadgeProps {
  badge: BadgeType;
  size?: 'sm' | 'md';
}

const ICON_MAP: Record<string, any> = {
  ShieldCheck,
  Star,
  Award,
  Compass,
  ThumbsUp,
  Bike,
};

export const RiderBadge: React.FC<BadgeProps> = ({ badge, size = 'md' }) => {
  const IconComponent = ICON_MAP[badge.icon] || ShieldCheck;

  const colorStyles: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  };

  const styleClass = colorStyles[badge.color] || colorStyles['orange'];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md ${styleClass}`}
      title={badge.description}
    >
      <IconComponent className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{badge.title}</span>
    </div>
  );
};
