import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useState, useEffect } from "react";
import { userService } from "@/services/userService";
import { requestService } from "@/services/requestService";
import { RideRequestCard } from "@/components/matching/RideRequestCard";
import { EmptyState } from "@/components/matching/EmptyState";
import type { RideRequest, UserProfile } from "@/types/rider";
import { Inbox, ArrowLeft } from 'lucide-react';
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/ride-requests")({
  beforeLoad: () => {
    throw redirect({ to: "/profile", search: { tab: "requests" } });
  },
  head: () => ({
    meta: [{ title: "Ride Requests — MotoCompanion" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppShell title="Ride Requests">
      <RideRequestsTabContent />
    </AppShell>
  );
}

export function RideRequestsTabContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile>(userService.getCurrentUser());
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  const refreshRequests = () => {
    const currentUser = userService.getCurrentUser();
    setUser(currentUser);
    const allReqs = requestService.getRideRequests(currentUser.userId);
    setRequests(allReqs);
  };

  useEffect(() => {
    refreshRequests();
  }, []);

  const handleAccept = (requestId: string) => {
    requestService.updateRideRequestStatus(requestId, 'ACCEPTED');
    refreshRequests();
  };

  const handleReject = (requestId: string) => {
    requestService.updateRideRequestStatus(requestId, 'REJECTED');
    refreshRequests();
  };

  const incomingRequests = requests.filter((r) => r.receiverId === user.userId);
  const outgoingRequests = requests.filter((r) => r.senderId === user.userId);
  const currentList = activeTab === 'incoming' ? incomingRequests : outgoingRequests;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="w-6 h-6 text-orange-400" />
            <h1 className="text-2xl font-bold text-slate-100">Ride Requests</h1>
          </div>
          <p className="text-xs text-slate-400">
            Manage incoming requests from other riders and track requests you sent.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'incoming' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Incoming Requests ({incomingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'outgoing' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sent Requests ({outgoingRequests.length})
        </button>
      </div>

      {currentList.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} ride requests`}
          description={
            activeTab === 'incoming'
              ? 'When other riders connect with you, their requests will appear here.'
              : 'Requests you send to potential ride partners will be tracked here.'
          }
          actionLabel="Find Ride Partners"
          onAction={() => navigate({ to: "/match" })}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((req) => (
            <RideRequestCard
              key={req.requestId}
              request={req}
              currentUserId={user.userId}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
};
