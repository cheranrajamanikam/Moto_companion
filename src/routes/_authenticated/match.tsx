import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { MatchPageContent } from "@/components/matching/MatchPageContent";

export const Route = createFileRoute("/_authenticated/match")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "pillion" ? ("pillion" as const) : ("rider" as const),
  }),
  head: () => ({
    meta: [{ title: "Find a Rider — MotoCompanion" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <AppShell title="Find a Rider" subtitle="CC-matched riding partners within ±150cc of your bike.">
      <MatchPageContent
        role={mode}
        onRoleChange={(role) =>
          navigate({ to: "/match", search: { mode: role === "pillion" ? "pillion" : undefined } })
        }
      />
    </AppShell>
  );
}
