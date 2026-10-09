import React from 'react';
import type { RideSummary as RideSummaryType } from "@/types/rider";
import { UserAvatar } from './UserAvatar';
import { MapPin, Calendar, Star, Compass, ArrowRight } from 'lucide-react';
import { useNavigate } from "@tanstack/react-router";

interface RideSummaryProps {
  ride: RideSummaryType;
}

export const RideSummary: React.FC<RideSummaryProps> = ({ ride }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate({ to: "/rides", search: { highlight: String(ride.rideId) } })}
      className="glass-card glass-card-hover rounded-2xl p-4 border border-slate-800 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {ride.date}
          </span>
          <span className="font-mono text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
            {ride.distanceKm} km
          </span>
        </div>

        <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5 mb-3">
          <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
          {ride.route}
        </h4>

        <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2.5">
            <UserAvatar src={ride.partnerAvatar} name={ride.partnerName} size="sm" />
            <div>
              <div className="text-xs font-semibold text-slate-200">{ride.partnerName}</div>
              <div className="text-[10px] text-slate-500 capitalize">Partner as {ride.role}</div>
            </div>
          </div>

          {ride.ratingGiven && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {ride.ratingGiven.toFixed(1)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Compass className="w-3.5 h-3.5 text-orange-400" />
          View Route Details & Logs
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-400" />
      </div>
    </div>
  );
};
