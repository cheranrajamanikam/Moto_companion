import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase, isConfigured } from "@/integrations/supabase/client";
import { mockAuth } from "@/lib/mockAuth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (!isConfigured) {
      if (!mockAuth.isLoggedIn()) {
        throw redirect({ to: "/auth" });
      }
      const mockUser = mockAuth.getCurrentUser();
      return { user: mockUser };
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
