import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bike, Flag, Medal, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { supabase, isConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_LEADERBOARD } from "@/lib/demoData";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  beforeLoad: () => {
    throw redirect({ to: "/community", search: { tab: "leaderboard" } });
  },
  head: () => ({
    meta: [
      { title: "Weekly safe-riding leaderboard — MotoCompanion" },
      {
        name: "description",
        content: "See this week’s leading MotoCompanion riders, safe rides and challenge points.",
      },
      { property: "og:title", content: "MotoCompanion weekly leaderboard" },
      {
        property: "og:description",
        content: "Weekly safe-riding rankings, points and ride totals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

export function LeaderboardTabContent() {
  const { userId } = useAuth();
  const board = useQuery({
    queryKey: ["leaderboard"],
    enabled: isConfigured,
    initialData: isConfigured ? undefined : DEMO_LEADERBOARD,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_entries")
        .select("*")
        .order("points", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const rows = board.data ?? [];
  const top = rows.slice(0, 3);
  const challenge = rows[0]?.challenge_name ?? "Weekly challenge";
  const week = rows[0]?.week ?? "This week";
  const totalSafeRides = rows.reduce((sum, row) => sum + row.safe_rides, 0);
  const currentRank = rows.findIndex((row) => row.user_id === userId);

  return (
    <div className="max-w-5xl space-y-5">
        <section className="relative overflow-hidden rounded-lg border border-primary/30 bg-surface-2 p-5 grid-texture sm:p-6">
          <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                <Sparkles className="h-3 w-3" /> Live challenge · {week}
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl">{challenge}</h2>
              <p className="mt-2 max-w-lg text-[12px] text-muted-foreground">
                Keep every ride smooth, report hazards, and climb the weekly ranking.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border text-center">
              <div className="bg-card px-5 py-3">
                <p className="text-xl font-bold text-primary">{rows.length}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Riders</p>
              </div>
              <div className="bg-card px-5 py-3">
                <p className="text-xl font-bold text-primary">{totalSafeRides}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Safe rides
                </p>
              </div>
            </div>
          </div>
        </section>

        {top.length > 0 ? (
          <section className="grid gap-3 sm:grid-cols-3">
            {top.map((row, index) => (
              <article
                key={row.id}
                className={`relative overflow-hidden rounded-lg border bg-card p-5 ${index === 0 ? "border-primary" : "border-border"}`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full ${index === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                  >
                    {index === 0 ? <Trophy className="h-5 w-5" /> : <Medal className="h-5 w-5" />}
                  </span>
                  <span className="text-3xl font-bold text-muted-foreground/30">0{index + 1}</span>
                </div>
                <h3 className="mt-4 truncate text-base">{row.rider_name}</h3>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {row.points.toLocaleString("en-IN")}{" "}
                  <span className="text-[10px] uppercase text-muted-foreground">pts</span>
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" /> {row.safe_rides} safe rides
                </p>
              </article>
            ))}
          </section>
        ) : null}

        {currentRank >= 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
            <Flag className="h-4 w-4 text-primary" />
            <p className="text-[12px]">
              <strong>You’re #{currentRank + 1}</strong> this week with{" "}
              {rows[currentRank]?.points.toLocaleString("en-IN")} points.
            </p>
          </div>
        ) : null}

        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="grid grid-cols-[40px_1fr_72px_64px] gap-2 border-b border-border bg-secondary/50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>Rank</span>
            <span>Rider</span>
            <span className="text-right">Points</span>
            <span className="text-right">Rides</span>
          </div>
          {isConfigured && board.isLoading ? (
            <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
              Loading the weekly standings…
            </p>
          ) : null}
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={`grid grid-cols-[40px_1fr_72px_64px] items-center gap-2 border-b border-border px-4 py-3.5 text-sm last:border-0 ${row.user_id === userId ? "bg-primary/10" : ""}`}
            >
              <span className="font-bold text-muted-foreground">{index + 1}</span>
              <span className="flex min-w-0 items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary">
                  <Bike className="h-3.5 w-3.5" />
                </span>
                <span className="truncate font-semibold">
                  {row.rider_name}
                  {row.user_id === userId ? (
                    <small className="ml-2 text-[9px] uppercase text-primary">You</small>
                  ) : null}
                </span>
              </span>
              <span className="text-right font-bold text-primary">
                {row.points.toLocaleString("en-IN")}
              </span>
              <span className="text-right text-muted-foreground">{row.safe_rides}</span>
            </div>
          ))}
          {!(isConfigured && board.isLoading) && rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
              No scores have been recorded this week.
            </p>
          ) : null}
        </section>
      </div>
  );
}

function LeaderboardPage() {
  return (
    <AppShell
      title="Weekly leaderboard"
      subtitle="Earn points through smooth, responsible riding and completed safe rides."
    >
      <LeaderboardTabContent />
    </AppShell>
  );
}
