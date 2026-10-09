import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useState, useEffect } from "react";
import { userService } from "@/services/userService";
import { notificationService } from "@/services/notificationService";
import { NotificationCard } from "@/components/matching/NotificationCard";
import { EmptyState } from "@/components/matching/EmptyState";
import type { Notification } from "@/types/rider";
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/notifications")({
  beforeLoad: () => {
    throw redirect({ to: "/profile", search: { tab: "notifications" } });
  },
  head: () => ({
    meta: [{ title: "Notifications — MotoCompanion" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppShell title="Notifications">
      <NotificationsTabContent />
    </AppShell>
  );
}

export function NotificationsTabContent() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const currentUser = userService.getCurrentUser();

  const refreshNotifications = () => {
    const list = notificationService.getNotifications(currentUser.userId);
    setNotifications(list);
  };

  useEffect(() => {
    refreshNotifications();
  }, []);

  const handleMarkRead = (id: string) => {
    notificationService.markNotificationRead(id);
    refreshNotifications();
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead(currentUser.userId);
    refreshNotifications();
  };

  const handleNotificationClick = (notif: Notification) => {
    switch (notif.type) {
      case 'MATCH':
        if (notif.relatedId) navigate({ to: "/match", search: { matchId: String(notif.relatedId) } });
        else navigate({ to: "/match" });
        break;
      case 'RIDE_REQUEST':
      case 'REQUEST_ACCEPTED':
      case 'REQUEST_REJECTED':
        navigate({ to: "/profile", search: { tab: "requests" } });
        break;
      case 'KYC':
        navigate({ to: "/profile", search: { tab: "kyc" } });
        break;
      case 'RIDE':
        if (notif.relatedId) navigate({ to: "/rides", search: { highlight: String(notif.relatedId) } });
        else navigate({ to: "/rides" });
        break;
      case 'CHAT':
        navigate({ to: "/community", search: { tab: "chat" } });
        break;
      case 'SOS':
        navigate({ to: "/safety" });
        break;
      case 'COMMUNITY':
        navigate({ to: "/community" });
        break;
      case 'EVENT':
        navigate({ to: "/community", search: { tab: "events" } });
        break;
      case 'SHOP':
        navigate({ to: "/shop", search: { tab: "shop" } });
        break;
      default:
        break;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
              <Bell className="w-6 h-6 text-orange-400" />
              <h1 className="text-2xl font-bold text-slate-100">Notifications</h1>
            </div>
            <p className="text-xs text-slate-400">
              Stay updated on match alerts, ride requests, system notifications, and community events.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="You are all caught up! New match alerts and ride requests will appear here."
          actionLabel="Find Riders"
          onAction={() => navigate({ to: "/match" })}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <NotificationCard
              key={notif.notificationId}
              notification={notif}
              onMarkRead={handleMarkRead}
              onClickAction={handleNotificationClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
