import React, { useState } from 'react';
import type { UserProfile, MatchResult } from "@/types/rider";
import { UserAvatar } from './UserAvatar';
import { requestService } from "@/services/requestService";
import { X, Send, Calendar, MapPin, Bike, CheckCircle2, User } from 'lucide-react';

interface RideRequestModalProps {
  isOpen: boolean;
  match: MatchResult | null;
  targetUser: UserProfile | null;
  onClose: () => void;
  onRequestSent?: () => void;
}

export const RideRequestModal: React.FC<RideRequestModalProps> = ({
  isOpen,
  match,
  targetUser,
  onClose,
  onRequestSent,
}) => {
  const recipient = match ? match.matchedUser : targetUser;

  const [role, setRole] = useState<'rider' | 'pillion'>(match ? match.matchRole : 'pillion');
  const [startLocation, setStartLocation] = useState('Bengaluru (Indiranagar)');
  const [destination, setDestination] = useState('Mysuru Expressway (Nandi Hills)');
  const [date, setDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] ?? ''
  );
  const [message, setMessage] = useState(
    "Hi, I'd like to join your ride. Looking forward to a great safe morning highway run!"
  );
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !recipient) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    setTimeout(() => {
      requestService.sendRideRequest({
        receiverId: recipient.userId,
        role,
        startLocation,
        destination,
        date,
        message,
      });

      setIsSending(false);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onRequestSent) onRequestSent();
      }, 1200);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#121827] border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Ride Request Sent!</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Your request was sent to {recipient.name}. You will receive a notification when they accept.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <UserAvatar
                src={recipient.avatar}
                name={recipient.name}
                size="md"
                isVerified={recipient.kycStatus === 'VERIFIED'}
              />
              <div>
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                  Connect & Ride
                </span>
                <h3 className="text-lg font-bold text-slate-100">Connect with {recipient.name}?</h3>
                <p className="text-xs text-slate-400">
                  {recipient.city} • {recipient.experienceLevel} Rider
                </p>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Role for This Ride</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('pillion')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    role === 'pillion'
                      ? 'bg-orange-500/15 border-orange-500 text-orange-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Join as Pillion
                </button>
                <button
                  type="button"
                  onClick={() => setRole('rider')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    role === 'rider'
                      ? 'bg-orange-500/15 border-orange-500 text-orange-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  Ride Together (Co-Rider)
                </button>
              </div>
            </div>

            {/* Route & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Starting Point</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-orange-400" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ride Date</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Optional Message</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                placeholder="Introduce yourself or propose ride timings..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition-all"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
