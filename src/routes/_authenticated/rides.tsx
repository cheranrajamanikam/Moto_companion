import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useState, useEffect } from "react";
import { userService } from "@/services/userService";
import { rideService } from "@/services/rideService";
import { RideSummary } from "@/components/matching/RideSummary";
import { EmptyState } from "@/components/matching/EmptyState";
import type { Ride, UserProfile } from "@/types/rider";
import { History, Calendar, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/rides")({
  head: () => ({
    meta: [{ title: "My Rides — MotoCompanion" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppShell title="My Rides">
      <PageInner />
    </AppShell>
  );
}

function PageInner() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile>(userService.getCurrentUser());
  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => {
    const u = userService.getCurrentUser();
    setUser(u);
    const userRides = rideService.getRideHistory(u.userId);
    setRides(userRides);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <History className="w-6 h-6 text-orange-400" />
              <h1 className="text-2xl font-bold text-slate-100">Ride History & Schedules</h1>
            </div>
            <p className="text-xs text-slate-400">
              View past completed motorcycle runs, upcoming scheduled rides, and partner logs.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate({ to: "/match" })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          Plan New Ride
        </button>
      </div>

      {user.recentRides && user.recentRides.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Recent Completed Rides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.recentRides.map((ride) => (
              <RideSummary key={ride.rideId} ride={ride} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h3 className="text-sm font-bold text-slate-200">All Scheduled & Logged Rides</h3>
        {rides.length === 0 ? (
          <EmptyState
            title="No rides logged yet"
            description="Connect with riders or pillions to schedule your first motorcycle highway run."
            actionLabel="Find Ride Partners"
            onAction={() => navigate({ to: "/match" })}
          />
        ) : (
          <div className="space-y-3">
            {rides.map((r) => (
              <div
                key={r.rideId}
                onClick={() => navigate({ to: "/rides", search: { highlight: String(r.rideId) } })}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-orange-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      {r.status}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{r.route}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {r.date} • {r.time}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-300">{r.distanceKm} km</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Rider & Pillion</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {r.rider.name} {r.pillion ? `& ${r.pillion.name}` : '(Solo Rider)'}
                    </span>
                  </div>
                  <button className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
