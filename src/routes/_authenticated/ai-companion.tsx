import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { RiderAIPage } from "@/features/rider-ai/components/RiderAIPage";
import { RiderAIErrorBoundary } from "@/features/rider-ai/components/RiderAIErrorBoundary";
import { getMockRiderAIContext } from "@/features/rider-ai/adapters/mock-context.adapter";

export const Route = createFileRoute("/_authenticated/ai-companion")({
  head: () => ({
    meta: [{ title: "AI Riding Companion — MotoCompanion" }],
  }),
  component: AICompanionRoute,
});

function AICompanionRoute() {
  const navigate = useNavigate();
  const context = getMockRiderAIContext();
  return (
    <AppShell title="AI Riding Companion" subtitle="Your intelligent riding assistant">
      <RiderAIErrorBoundary>
        <RiderAIPage
          rider={context.rider}
          bike={context.bike}
          route={context.route}
          ride={context.ride}
          hazards={context.hazards}
          weather={context.weather}
          onNavigateToRidingMode={() => navigate({ to: "/ai-companion" })}
        />
      </RiderAIErrorBoundary>
    </AppShell>
  );
}
