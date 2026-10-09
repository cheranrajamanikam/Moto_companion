import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { TabBar } from "@/components/app/TabBar";
import { BikesTabContent } from "@/routes/_authenticated/bikes";
import { KycTabContent } from "@/routes/_authenticated/kyc";
import { NotificationsTabContent } from "@/routes/_authenticated/notifications";
import { PreferencesTabContent } from "@/routes/_authenticated/preferences";
import { RideRequestsTabContent } from "@/routes/_authenticated/ride-requests";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { userService } from "@/services/userService";
import type { UserProfile } from "@/types/rider";
import { UserAvatar } from "@/components/matching/UserAvatar";
import { KYCStatusBadge } from "@/components/matching/KYCStatusBadge";
import { BikeGarage } from "@/components/matching/BikeGarage";
import { ReputationDisplay } from "@/components/matching/ReputationDisplay";
import { RiderBadge } from "@/components/matching/RiderBadge";
import { RideSummary } from "@/components/matching/RideSummary";
import { RideRequestModal } from "@/components/matching/RideRequestModal";
import {
  ArrowLeft,
  MapPin,
  Send,
  Sliders,
  Compass,
  Edit3,
} from 'lucide-react';

const PROFILE_TAB_IDS = ["profile", "bikes", "kyc", "preferences", "notifications", "requests"] as const;
type ProfileTabId = (typeof PROFILE_TAB_IDS)[number];

function parseProfileTab(tab: unknown): ProfileTabId {
  if (typeof tab === "string" && (PROFILE_TAB_IDS as readonly string[]).includes(tab)) {
    return tab as ProfileTabId;
  }
  return "profile";
}

export const Route = createFileRoute("/_authenticated/profile")({
  validateSearch: (search: Record<string, unknown>) => ({
    userId: typeof search.userId === "string" ? search.userId : undefined,
    tab: parseProfileTab(search.tab),
  }),
  head: () => ({
    meta: [{ title: "My Profile — MotoCompanion" }],
  }),
  component: RouteComponent,
});

const PROFILE_TABS = [
  { id: "profile", label: "Profile" },
  { id: "bikes", label: "My Bikes" },
  { id: "kyc", label: "KYC" },
  { id: "preferences", label: "Preferences" },
  { id: "notifications", label: "Notifications" },
  { id: "requests", label: "Ride Requests" },
] as const;

function RouteComponent() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTabId>(tab);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  const setTab = (id: string) => {
    const next = parseProfileTab(id);
    setActiveTab(next);
    navigate({
      to: "/profile",
      search: (prev) => ({
        ...prev,
        tab: next === "profile" ? undefined : next,
      }),
      replace: true,
    });
  };

  return (
    <AppShell title="My Profile" subtitle="Profile, garage, verification and ride requests in one place.">
      <TabBar tabs={PROFILE_TABS} activeTab={activeTab} onChange={setTab} />
      <div className="animate-page-in">
        {activeTab === "profile" ? <ProfileTabContent /> : null}
        {activeTab === "bikes" ? <BikesTabContent /> : null}
        {activeTab === "kyc" ? <KycTabContent /> : null}
        {activeTab === "preferences" ? <PreferencesTabContent /> : null}
        {activeTab === "notifications" ? <NotificationsTabContent /> : null}
        {activeTab === "requests" ? <RideRequestsTabContent /> : null}
      </div>
    </AppShell>
  );
}

export function ProfileTabContent() {
  const { userId } = Route.useSearch();
  const navigate = useNavigate();
  const currentUser = userService.getCurrentUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  useEffect(() => {
    const id = userId || currentUser.userId;
    const user = userService.getUserProfile(id);
    setProfile(user);
  }, [userId]);

  if (!profile) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>User profile not found.</p>
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isSelf = profile.userId === currentUser.userId;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header Profile Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <UserAvatar
              src={profile.avatar}
              name={profile.name}
              size="xl"
              isVerified={profile.kycStatus === 'VERIFIED'}
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-extrabold text-slate-100">{profile.name}</h1>
                <KYCStatusBadge status={profile.kycStatus} />
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {profile.city}
                </span>
                <span>•</span>
                <span className="text-orange-400 font-semibold">{profile.experienceLevel} Rider</span>
                <span>•</span>
                <span>{profile.ridingExperienceYears} years experience</span>
              </div>

              <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">{profile.bio}</p>
            </div>
          </div>

          {/* Action Header Button */}
          <div className="shrink-0">
            {isSelf ? (
              <button
                onClick={() => navigate('/profile/setup')}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4 text-orange-400" />
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => setIsConnectOpen(true)}
                className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Connect & Request Ride
              </button>
            )}
          </div>
        </div>

        {/* User Badges Row */}
        {profile.badges && profile.badges.length > 0 && (
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Earned Community Badges
            </span>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((b) => (
                <RiderBadge key={b.id} badge={b} />
              ))}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-center">
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-xl font-extrabold text-orange-400">{profile.stats.totalRides}</span>
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total Rides</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-xl font-extrabold text-amber-400">{profile.stats.distanceRiddenKm} km</span>
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Distance Covered</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-xl font-extrabold text-emerald-400">{profile.reputation.rating.toFixed(1)}</span>
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Community Rating</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-xl font-extrabold text-purple-400">{profile.bikes.length}</span>
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Garage Bikes</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Garage & Reputation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Bike Garage */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800">
            <BikeGarage
              userId={profile.userId}
              bikes={profile.bikes}
              isOwner={isSelf}
              onBikesChange={() => setProfile(userService.getUserProfile(profile.userId))}
            />
          </div>

          {/* Preferences Breakdown */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-orange-400" />
              Ride Partner & Route Preferences
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-1.5">Value Partner Qualities:</span>
                <div className="flex flex-wrap gap-2">
                  {profile.partnerPreferences.map((p, i) => (
                    <span
                      key={i}
                      className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-xl font-semibold capitalize"
                    >
                      ✓ {p.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1.5">Preferred Ride Types:</span>
                <div className="flex flex-wrap gap-2">
                  {profile.ridePreferences.map((r, i) => (
                    <span
                      key={i}
                      className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-xl font-semibold capitalize"
                    >
                      {r.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {profile.partnerDescription && (
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 italic text-slate-300">
                  "{profile.partnerDescription}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Reputation & Recent Rides */}
        <div className="space-y-6">
          <ReputationDisplay reputation={profile.reputation} />

          {/* Recent Rides List */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              Recent Ride History
            </h3>
            {profile.recentRides.length === 0 ? (
              <p className="text-xs text-slate-500">No public ride history logged yet.</p>
            ) : (
              <div className="space-y-3">
                {profile.recentRides.map((ride) => (
                  <RideSummary key={ride.rideId} ride={ride} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <RideRequestModal
        isOpen={isConnectOpen}
        match={null}
        targetUser={profile}
        onClose={() => setIsConnectOpen(false)}
      />
    </div>
  );
};
