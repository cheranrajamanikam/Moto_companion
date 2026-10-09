import React from 'react';
import type { MatchResult } from "@/types/rider";
import { UserAvatar } from './UserAvatar';
import { Star, MapPin, Bike, Check, Sparkles, Send, User } from 'lucide-react';

interface MatchCardProps {
  match: MatchResult;
  onViewProfile: (userId: string) => void;
  onConnect: (match: MatchResult) => void;
  onExplain?: (match: MatchResult) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onViewProfile,
  onConnect,
  onExplain,
}) => {
  const { matchedUser, matchScore, distanceKm, matchReasons } = match;
  const primaryBike = matchedUser.bikes.find((b) => b.isPrimary) || matchedUser.bikes[0];

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
      {/* Top Banner Gradient & Score Pill */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            src={matchedUser.avatar}
            name={matchedUser.name}
            size="lg"
            isVerified={matchedUser.kycStatus === 'VERIFIED'}
          />
          <div>
            <h3 className="font-bold text-lg text-slate-100 group-hover:text-orange-400 transition-colors">
              {matchedUser.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {matchedUser.reputation.rating.toFixed(1)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-slate-500" />
                {distanceKm} km away ({matchedUser.city})
              </span>
            </div>
          </div>
        </div>

        {/* Match Percentage Badge */}
        <div className="flex flex-col items-end">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-lg shadow-orange-500/20 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            {matchScore}% MATCH
          </div>
          <button
            onClick={() => onExplain && onExplain(match)}
            className="text-[11px] text-orange-400 hover:text-orange-300 font-medium mt-1 hover:underline flex items-center gap-0.5"
          >
            Why this match?
          </button>
        </div>
      </div>

      {/* Primary Bike Details */}
      {primaryBike ? (
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-200 text-xs">
                {primaryBike.brand} {primaryBike.model}
              </div>
              <div className="text-[11px] text-slate-400">{matchedUser.experienceLevel} Rider</div>
            </div>
          </div>
          <span className="font-mono font-bold text-xs bg-slate-800 text-amber-400 px-2.5 py-1 rounded-md border border-slate-700">
            {primaryBike.engineCC} CC
          </span>
        </div>
      ) : null}

      {/* Partner Qualities Pills */}
      <div className="space-y-2 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {matchedUser.partnerPreferences.slice(0, 3).map((pref, i) => (
            <span
              key={i}
              className="bg-slate-800/80 text-slate-300 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700/60 capitalize"
            >
              {pref.replace('-', ' ')}
            </span>
          ))}
          {matchedUser.ridePreferences.slice(0, 2).map((pref, i) => (
            <span
              key={`r-${i}`}
              className="bg-orange-500/10 text-orange-400 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-orange-500/20 capitalize"
            >
              {pref.replace('-', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Top 2 Dynamic Match Reasons Snippet */}
      {matchReasons && matchReasons.length > 0 && (
        <div className="bg-slate-900/40 rounded-xl p-2.5 border border-slate-800/60 mb-4 space-y-1 text-xs">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
            Top Compatibility Factors
          </span>
          {matchReasons.slice(0, 2).map((reason, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-slate-300 text-[11px]">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Card Actions */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
        <button
          onClick={() => onViewProfile(matchedUser.userId)}
          className="py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5"
        >
          <User className="w-3.5 h-3.5 text-slate-400" />
          View Profile
        </button>
        <button
          onClick={() => onConnect(match)}
          className="py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-orange-500/10 transition-all flex items-center justify-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          Connect
        </button>
      </div>
    </div>
  );
};
