import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

const supabaseUrl =
  import.meta.env["VITE_SUPABASE_URL"] ||
  process.env["SUPABASE_URL"] ||
  "https://placeholder.supabase.co";

const supabaseAnonKey =
  import.meta.env["VITE_SUPABASE_ANON_KEY"] ||
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
  process.env["SUPABASE_PUBLISHABLE_KEY"] ||
  "placeholder-key";

export const isConfigured = Boolean(
  (import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"]) &&
    (import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"]) !==
      "your_supabase_project_url" &&
    (import.meta.env["VITE_SUPABASE_ANON_KEY"] ||
      import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
      process.env["SUPABASE_PUBLISHABLE_KEY"]) &&
    (import.meta.env["VITE_SUPABASE_ANON_KEY"] ||
      import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
      process.env["SUPABASE_PUBLISHABLE_KEY"]) !== "your_supabase_anon_key",
);

function createMockSupabaseClient(): SupabaseClient<Database> {
  const emptyResult = { data: [] as never[], error: null };
  const singleResult = { data: null, error: null };

  const chain = () => ({
    select: () => chain(),
    insert: () => chain(),
    update: () => chain(),
    upsert: () => chain(),
    delete: () => chain(),
    eq: () => chain(),
    order: () => chain(),
    limit: () => chain(),
    maybeSingle: async () => singleResult,
    single: async () => singleResult,
    then: (resolve: (value: typeof emptyResult) => void) => resolve(emptyResult),
  });

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({
        data: { session: null, user: null },
        error: { message: "Supabase is not configured" },
      }),
      signUp: async () => ({
        data: { session: null, user: null },
        error: { message: "Supabase is not configured" },
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => undefined } },
      }),
    },
    from: () => chain(),
  } as unknown as SupabaseClient<Database>;
}

function createRealSupabaseClient() {
  try {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: createSupabaseFetch(supabaseAnonKey),
      },
      auth: {
        storage: brokeredPreviewStorage(),
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (error) {
    console.warn("[Supabase] Failed to create client, using mock:", error);
    return createMockSupabaseClient();
  }
}

let _supabase: SupabaseClient<Database> | undefined;

function getClient(): SupabaseClient<Database> {
  if (!_supabase) {
    _supabase = isConfigured ? createRealSupabaseClient() : createMockSupabaseClient();
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
