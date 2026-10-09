import React from 'react';
import type { RideRequest } from "@/types/rider";
import { UserAvatar } from './UserAvatar';
import { MapPin, Calendar, Check, X, Clock, Bike, MessageSquare } from 'lucide-react';

interface RideRequestCardProps {
  request: RideRequest;
  currentUserId: string;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
}

export const RideRequestCard: React.FC<RideRequestCardProps> = ({
  request,
  currentUserId,
  onAccept,
  onReject,
}) => {
  const isIncoming = request.receiverId === currentUserId;
  const partnerProfile = isIncoming ? request.sender : request.receiver;

  const statusConfig = {
    PENDING: {
      label: 'Pending Response',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Clock,
    },
    ACCEPTED: {
      label: 'Accepted',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: Check,
    },
    REJECTED: {
      label: 'Declined',
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: X,
    },
    CANCELLED: {
      label: 'Cancelled',
      color: 'bg-slate-800 text-slate-400 border-slate-700',
      icon: X,
    },
  };

  const statusInfo = statusConfig[request.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar src={partnerProfile.avatar} name={partnerProfile.name} size="md" />
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {isIncoming ? 'Incoming Request' : 'Sent Request'}
            </span>
            <h4 className="font-bold text-slate-100 text-sm">{partnerProfile.name}</h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <span>{partnerProfile.city}</span>
              {partnerProfile.primaryBike && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Bike className="w-3 h-3 text-orange-400" />
                    {partnerProfile.primaryBike.model}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {statusInfo.label}
        </span>
      </div>

      {/* Route & Date */}
      <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="font-semibold">{request.startLocation} → {request.destination}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Date: {request.date}</span>
        </div>
      </div>

      {/* Message */}
      {request.message && (
        <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/60 text-xs text-slate-300 flex items-start gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p className="italic font-light">"{request.message}"</p>
        </div>
      )}

      {/* Action Buttons for Incoming Request */}
      {isIncoming && request.status === 'PENDING' && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => onAccept && onAccept(request.requestId)}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Accept Request
          </button>
          <button
            onClick={() => onReject && onReject(request.requestId)}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            Decline
          </button>
        </div>
      )}
    </div>
  );
};
