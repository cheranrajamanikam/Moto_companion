import React from 'react';
import type { UserMiniProfile as UserMiniProfileType } from "@/types/rider";
import { UserAvatar } from './UserAvatar';
import { Star, Bike } from 'lucide-react';

interface UserMiniProfileProps {
  user: UserMiniProfileType;
  onClick?: () => void;
  className?: string;
}

export const UserMiniProfile: React.FC<UserMiniProfileProps> = ({
  user,
  onClick,
  className = '',
}) => {
  const isVerified = user.badges?.some((b) => b.id === 'KYC_VERIFIED');

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-orange-500/40 transition-colors ${
        onClick ? 'cursor-pointer hover:bg-slate-800/60' : ''
      } ${className}`}
    >
      <UserAvatar src={user.avatar} name={user.name} size="md" isVerified={isVerified} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="font-semibold text-slate-100 text-sm truncate">{user.name}</h4>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
          <span className="flex items-center gap-0.5 text-amber-400 font-medium">
            <Star className="w-3 h-3 fill-amber-400" />
            {user.reputationScore.toFixed(1)}
          </span>
          <span>•</span>
          <span className="truncate">{user.city}</span>
          {user.primaryBike && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300 truncate">
                <Bike className="w-3 h-3 text-orange-400" />
                {user.primaryBike.model} ({user.primaryBike.engineCC}cc)
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
