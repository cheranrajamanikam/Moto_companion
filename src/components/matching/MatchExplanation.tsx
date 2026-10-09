import React from 'react';
import type { MatchResult } from "@/types/rider";
import { UserAvatar } from './UserAvatar';
import { X, CheckCircle2, Sparkles, Gauge, Compass, ShieldCheck } from 'lucide-react';

interface MatchExplanationProps {
  isOpen: boolean;
  match: MatchResult | null;
  onClose: () => void;
  onConnect?: (match: MatchResult) => void;
}

export const MatchExplanation: React.FC<MatchExplanationProps> = ({
  isOpen,
  match,
  onClose,
  onConnect,
}) => {
  if (!isOpen || !match) return null;

  const { matchedUser, matchScore, matchReasons, ccCompatibility, preferenceCompatibility, rideCompatibility } = match;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#121827] border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
          <UserAvatar
            src={matchedUser.avatar}
            name={matchedUser.name}
            size="lg"
            isVerified={matchedUser.kycStatus === 'VERIFIED'}
          />
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 uppercase tracking-wider bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20 mb-1">
              <Sparkles className="w-3 h-3" />
              Compatibility Breakdown
            </div>
            <h2 className="text-xl font-bold text-slate-100">{matchedUser.name}</h2>
            <p className="text-xs text-slate-400">
              {matchedUser.city} • {matchedUser.experienceLevel} Rider
            </p>
          </div>
        </div>

        {/* Big Overall Match Score Ring/Card */}
        <div className="bg-gradient-to-r from-slate-900 via-orange-950/30 to-slate-900 rounded-2xl p-4 border border-orange-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Overall Compatibility
            </span>
            <div className="text-3xl font-extrabold text-white orange-gradient-text mt-0.5">
              {matchScore}% MATCH
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-xl text-white shadow-lg orange-glow">
            {matchScore}%
          </div>
        </div>

        {/* Dynamic Match Reasons list from matchReasons[] */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Why This Is A Good Match
          </h3>

          <div className="space-y-2 bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
            {matchReasons && matchReasons.length > 0 ? (
              matchReasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="leading-relaxed">{reason}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">High baseline compatibility across ride preferences.</p>
            )}
          </div>
        </div>

        {/* Multi-Factor Progress Bars */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-orange-400" />
              Engine CC Power Class
            </span>
            <span className="font-semibold text-slate-200">{ccCompatibility}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${ccCompatibility}%` }}></div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Ride Type & Route Preferences
            </span>
            <span className="font-semibold text-slate-200">{rideCompatibility}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${rideCompatibility}%` }}></div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Partner Quality Expectations
            </span>
            <span className="font-semibold text-slate-200">{preferenceCompatibility}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${preferenceCompatibility}%` }}></div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          {onConnect && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onConnect(match);
              }}
              className="px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition-all"
            >
              Send Ride Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
