import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { CommunityChatPage } from "@/features/community-chat/components/CommunityChatPage";
import { CommunityChatErrorBoundary } from "@/features/community-chat/components/CommunityChatErrorBoundary";
import { DEMO_PERSONAS } from "@/features/community-chat/constants/demo-personas";
import "@/features/community-chat/styles/community-chat.css";

export const Route = createFileRoute("/_authenticated/chat")({
  beforeLoad: () => {
    throw redirect({ to: "/community", search: { tab: "chat" } });
  },
  head: () => ({
    meta: [{ title: "Community Chat — MotoCompanion" }],
  }),
  component: ChatRoute,
});

export function ChatTabContent() {
  const navigate = useNavigate();
  const [activePersona] = useState(DEMO_PERSONAS[0]);
  return (
    <CommunityChatErrorBoundary>
      <CommunityChatPage
        initialPersona={activePersona}
        onNavigateToCockpit={() => navigate({ to: "/ai-companion" })}
        onNavigateToModeration={() => navigate({ to: "/community", search: { tab: "chat" } })}
        onOpenRiderProfile={(userId) => navigate({ to: "/profile", search: { userId } })}
      />
    </CommunityChatErrorBoundary>
  );
}

function ChatRoute() {
  return (
    <AppShell title="Community Chat" subtitle="Chat with riders near you">
      <ChatTabContent />
    </AppShell>
  );
}
