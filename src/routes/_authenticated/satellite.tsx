import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import {
  SatelliteIntelligenceErrorBoundary,
  SatelliteIntelligencePage,
} from "@/features/satellite-intelligence";

export const Route = createFileRoute("/_authenticated/satellite")({
  head: () => ({
    meta: [{ title: "Satellite Intelligence — MotoCompanion" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  return (
    <AppShell
      title="Satellite Intelligence"
      subtitle="Live terrain map, route hazards and OSINT scoring — available after you sign in."
    >
      <SatelliteIntelligenceErrorBoundary>
        <SatelliteIntelligencePage
          corridorKey="blr-ckm"
          onNavigateToCockpit={() => navigate({ to: "/ai-companion" })}
          onNavigateToCommunity={() => navigate({ to: "/community" })}
          onNavigate={(path) => {
            if (path.includes("community")) navigate({ to: "/community" });
            else if (path.includes("ai")) navigate({ to: "/ai-companion" });
            else if (path.includes("safety")) navigate({ to: "/safety" });
            else if (path.includes("match")) navigate({ to: "/match" });
          }}
        />
      </SatelliteIntelligenceErrorBoundary>
    </AppShell>
  );
}
