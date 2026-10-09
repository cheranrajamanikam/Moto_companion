import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { userService } from "@/services/userService";
import { PreferenceSelector } from "@/components/matching/PreferenceSelector";
import type { UserProfile } from "@/types/rider";
import { Sliders, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute("/_authenticated/preferences")({
  beforeLoad: () => {
    throw redirect({ to: "/profile", search: { tab: "preferences" } });
  },
  head: () => ({
    meta: [{ title: "Ride Preferences — MotoCompanion" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppShell title="Ride Preferences">
      <PreferencesTabContent />
    </AppShell>
  );
}

export function PreferencesTabContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile>(userService.getCurrentUser());
  const [partnerPrefs, setPartnerPrefs] = useState<string[]>(user.partnerPreferences || []);
  const [ridePrefs, setRidePrefs] = useState<string[]>(user.ridePreferences || []);
  const [partnerDesc, setPartnerDesc] = useState<string>(user.partnerDescription || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = userService.updateCurrentUser({
      partnerPreferences: partnerPrefs,
      ridePreferences: ridePrefs,
      partnerDescription: partnerDesc,
    });
    setUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
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
              <Sliders className="w-6 h-6 text-orange-400" />
              <h1 className="text-2xl font-bold text-slate-100">Ride Partner Preferences</h1>
            </div>
            <p className="text-xs text-slate-400">
              Customize what qualities you look for in riding partners and what style of rides you enjoy.
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Ride partner preferences updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
        <PreferenceSelector
          selectedPartnerPreferences={partnerPrefs}
          selectedRidePreferences={ridePrefs}
          partnerDescription={partnerDesc}
          onChangePartnerPreferences={setPartnerPrefs}
          onChangeRidePreferences={setRidePrefs}
          onChangePartnerDescription={setPartnerDesc}
        />

        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition-all"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
