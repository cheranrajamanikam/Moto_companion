import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useState, useEffect } from "react";
import { userService } from "@/services/userService";
import { BikeGarage } from "@/components/matching/BikeGarage";
import { Bike as BikeIcon } from 'lucide-react';

export const Route = createFileRoute("/_authenticated/bikes")({
  beforeLoad: () => {
    throw redirect({ to: "/profile", search: { tab: "bikes" } });
  },
  head: () => ({
    meta: [{ title: "My Bike Garage — MotoCompanion" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppShell title="My Bike Garage">
      <BikesTabContent />
    </AppShell>
  );
}

export function BikesTabContent() {
  const [user, setUser] = useState(userService.getCurrentUser());

  const refreshUser = () => {
    setUser(userService.getCurrentUser());
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 uppercase tracking-wider bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20 mb-2">
              <BikeIcon className="w-3.5 h-3.5" />
              Garage Management
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100">Motorcycle Garage</h1>
            <p className="text-xs text-slate-400 mt-1">
              Add, edit, or set primary bike for engine CC compatibility matching.
            </p>
          </div>
        </div>

        <BikeGarage
          userId={user.userId}
          bikes={user.bikes}
          isOwner={true}
          onBikesChange={refreshUser}
        />
      </div>
    </div>
  );
};
