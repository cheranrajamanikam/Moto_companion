import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { supabase, isConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_EVENTS } from "@/lib/demoData";

export const Route = createFileRoute("/_authenticated/events")({
  beforeLoad: () => {
    throw redirect({ to: "/community", search: { tab: "events" } });
  },
  head: () => ({
    meta: [
      { title: "Ride-outs & events — MotoCompanion" },
      {
        name: "description",
        content: "Browse upcoming MotoCompanion ride-outs, safety clinics and tours, and join in.",
      },
      { property: "og:title", content: "MotoCompanion ride-outs and events" },
      { property: "og:description", content: "Upcoming ride-outs, clinics and tours for riders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

export function EventsTabContent() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [demoJoined, setDemoJoined] = useState<string[]>([]);

  const events = useQuery({
    queryKey: ["events"],
    enabled: isConfigured,
    queryFn: async () => {
      const [list, participants] = await Promise.all([
        supabase.from("events").select("*").order("event_date", { ascending: true }),
        supabase.from("event_participants").select("event_id, user_id"),
      ]);
      if (list.error) throw list.error;
      return { events: list.data ?? [], participants: participants.data ?? [] };
    },
  });

  const toggleJoin = useMutation({
    mutationFn: async ({ eventId, joined }: { eventId: string; joined: boolean }) => {
      if (!isConfigured) {
        setDemoJoined((prev) =>
          joined ? prev.filter((id) => id !== eventId) : [...prev, eventId],
        );
        return;
      }
      if (!userId) throw new Error("Not signed in");
      if (joined) {
        const { error } = await supabase
          .from("event_participants")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_participants")
          .insert({ event_id: eventId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const eventList = isConfigured ? (events.data?.events ?? []) : DEMO_EVENTS;
  const participants = isConfigured ? (events.data?.participants ?? []) : [];

  return (
    <>
      {isConfigured && events.isLoading ? (
        <p className="text-[13px] text-muted-foreground">Loading events…</p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        {eventList.map((ev) => {
          const going = isConfigured
            ? participants.filter((p) => p.event_id === ev.id)
            : demoJoined.includes(ev.id)
              ? [{ event_id: ev.id, user_id: userId ?? "mock-user-001" }]
              : [];
          const joined = isConfigured
            ? going.some((p) => p.user_id === userId)
            : demoJoined.includes(ev.id);
          return (
            <article
              key={ev.id}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              {ev.image_url ? (
                <img
                  src={ev.image_url}
                  alt=""
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
              ) : null}
              <div className="p-4">
                <h2 className="text-base font-bold tracking-tight">{ev.title}</h2>
                <p className="mt-2 text-[13px] text-muted-foreground">{ev.description}</p>
                <ul className="mt-3 space-y-1.5 text-[12px] text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    {new Date(ev.event_date).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {ev.location}
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {going.length} joined
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => toggleJoin.mutate({ eventId: ev.id, joined })}
                  className={`mt-4 w-full rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                    joined
                      ? "border border-primary text-primary"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {joined ? "Leave ride" : "Join ride"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function EventsPage() {
  return (
    <AppShell title="Ride-outs & events" subtitle="Join a ride, a clinic or a weekend tour.">
      <EventsTabContent />
    </AppShell>
  );
}
