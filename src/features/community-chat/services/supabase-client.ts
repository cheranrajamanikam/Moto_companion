import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export { supabase as supabaseClient } from "@/integrations/supabase/client";

export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey && url.startsWith("http"));
}

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase credentials missing. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined when using the supabase chat backend.",
    );
  }
  return supabase;
}

export function setSupabaseClient(_client: SupabaseClient | null): void {
  // Unified client; no-op for tests that inject mocks via adapter constructor.
}
