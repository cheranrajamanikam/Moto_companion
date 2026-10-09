import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isConfigured } from "@/integrations/supabase/client";
import { mockAuth, type MockUser } from "@/lib/mockAuth";

export function useAuth() {
  const [user, setUser] = useState<User | MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      const update = () => {
        setUser(mockAuth.getCurrentUser());
        setLoading(false);
      };
      update();
      window.addEventListener("mc-auth-change", update);
      return () => window.removeEventListener("mc-auth-change", update);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setUser(s?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const displayName =
    (user?.user_metadata?.["display_name"] as string | undefined) ??
    (user?.user_metadata?.["full_name"] as string | undefined) ??
    (user as { email?: string } | null)?.email?.split("@")[0] ??
    "Rider";

  return {
    user,
    userId: user?.id ?? null,
    displayName,
    loading,
    isDemo: !isConfigured,
    session: null,
  };
}
