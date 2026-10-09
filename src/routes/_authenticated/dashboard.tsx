import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { userService } from "@/services/userService";
import { matchingService } from "@/services/matchingService";
import { requestService } from "@/services/requestService";
import { MatchCard } from "@/components/matching/MatchCard";
import { MatchExplanation } from "@/components/matching/MatchExplanation";
import { RideRequestModal } from "@/components/matching/RideRequestModal";
import { RideSummary } from "@/components/matching/RideSummary";
import { KYCStatusBadge } from "@/components/matching/KYCStatusBadge";
import type { MatchResult, UserProfile, RideRequest } from "@/types/rider";
import {
  Users,
  Bike,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  Sliders,
  Inbox,
  Compass,
  Satellite,
} from 'lucide-react';

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — MotoCompanion" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppShell title="Dashboard">
      <PageInner />
    </AppShell>
  );
}

function PageInner() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile>(userService.getCurrentUser());
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RideRequest[]>([]);
  const [selectedMatchForExplain, setSelectedMatchForExplain] = useState<MatchResult | null>(null);
  const [selectedMatchForConnect, setSelectedMatchForConnect] = useState<MatchResult | null>(null);

  useEffect(() => {
    const currentUser = userService.getCurrentUser();
    setUser(currentUser);

    // Fetch top recommended matches
    const recs = matchingService.getMatches({ role: 'rider', sortBy: 'BEST_MATCH' }).slice(0, 4);
    setMatches(recs);

    // Fetch pending requests
    const reqs = requestService.getRideRequests(currentUser.userId).filter((r) => r.status === 'PENDING');
    setPendingRequests(reqs);
  }, []);

  const primaryBike = user.bikes.find((b) => b.isPrimary) || user.bikes[0];

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    let score = 30; // base profile
    if (user.kycStatus === 'VERIFIED') score += 25;
    if (user.bikes.length > 0) score += 25;
    if (user.partnerPreferences.length > 0) score += 20;
    return Math.min(100, score);
  };

  const completionPct = calculateCompletion();

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting & Quick Stats */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👋</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                Hello, {user.name.split(' ')[0]}
              </h1>
              <KYCStatusBadge status={user.kycStatus} />
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Find the right person to ride with — matched on CC compatibility, partner qualities, location, and reputation.
            </p>

            {/* Partner Qualities Pills Summary */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-orange-400" />
                Looking for:
              </span>
              {user.partnerPreferences.slice(0, 4).map((pref, i) => (
                <span
                  key={i}
                  className="bg-slate-900/90 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-800 capitalize font-medium"
                >
                  {pref.replace('-', ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => navigate({ to: "/match" })}
              className="w-full sm:w-auto px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Users className="w-4 h-4" />
              Find Rider
            </button>
            <button
              onClick={() => navigate({ to: "/match", search: { mode: "pillion" } })}
              className="w-full sm:w-auto px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-2xl border border-slate-800 flex items-center justify-center gap-2 transition-all"
            >
              <Bike className="w-4 h-4 text-orange-400" />
              Find Pillion
            </button>
          </div>
        </div>

        {/* Profile Completion & Primary Bike Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          {/* Completion Bar */}
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Profile Completion</span>
              <span className="font-extrabold text-orange-400">{completionPct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                style={{ width: `${completionPct}%` }}
              ></div>
            </div>
          </div>

          {/* Primary Bike */}
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Primary Garage Bike
              </span>
              <div className="font-bold text-slate-200 text-xs mt-0.5">
                {primaryBike ? `${primaryBike.brand} ${primaryBike.model}` : 'No Bike Registered'}
              </div>
            </div>
            {primaryBike && (
              <span className="font-mono text-xs font-bold text-amber-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {primaryBike.engineCC} CC
              </span>
            )}
          </div>

          {/* KYC Status Card */}
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                KYC Identity Verification
              </span>
              <div className="mt-0.5">
                <KYCStatusBadge status={user.kycStatus} />
              </div>
            </div>
            <button
              onClick={() => navigate({ to: "/profile", search: { tab: "kyc" } })}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-0.5"
            >
              Manage
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate({ to: "/satellite" })}
        className="flex w-full items-center justify-between gap-4 rounded-[14px] border border-primary/40 bg-primary/10 p-4 text-left transition-colors hover:bg-primary/15"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Satellite className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">Satellite Alert — NH275 Coorg route</p>
            <p className="text-xs text-muted-foreground">
              Waterlogging detected at km 78. Open the live terrain map to analyse the corridor.
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold text-primary">Open map</span>
      </button>

      {/* Pending Requests Alert banner if any */}
      {pendingRequests.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-200">
                You have {pendingRequests.length} pending ride request(s)
              </span>
              <p className="text-slate-400">Review requests from riders wanting to connect</p>
            </div>
          </div>
          <button
            onClick={() => navigate({ to: "/profile", search: { tab: "requests" } })}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors shrink-0"
          >
            Review Requests
          </button>
        </div>
      )}

      {/* Recommended Matches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              Recommended Ride Matches
            </h2>
            <p className="text-xs text-slate-400">Top compatible riders near {user.city}</p>
          </div>
          <button
            onClick={() => navigate({ to: "/match" })}
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 hover:underline"
          >
            View All Matches
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {matches.map((match) => (
            <MatchCard
              key={match.matchId}
              match={match}
              onViewProfile={(id) => navigate({ to: "/profile", search: { userId: String(id) } })}
              onConnect={(m) => setSelectedMatchForConnect(m)}
              onExplain={(m) => setSelectedMatchForExplain(m)}
            />
          ))}
        </div>
      </div>

      {/* Recent Rides Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              Recent Ride History
            </h2>
            <p className="text-xs text-slate-400">Completed group and solo rides</p>
          </div>
          <button
            onClick={() => navigate({ to: "/rides" })}
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 hover:underline"
          >
            View All Rides
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.recentRides.map((ride) => (
            <RideSummary key={ride.rideId} ride={ride} />
          ))}
        </div>
      </div>

      {/* Modals */}
      <MatchExplanation
        isOpen={!!selectedMatchForExplain}
        match={selectedMatchForExplain}
        onClose={() => setSelectedMatchForExplain(null)}
        onConnect={(m) => setSelectedMatchForConnect(m)}
      />

      <RideRequestModal
        isOpen={!!selectedMatchForConnect}
        match={selectedMatchForConnect}
        targetUser={null}
        onClose={() => setSelectedMatchForConnect(null)}
      />
    </div>
  );
};
