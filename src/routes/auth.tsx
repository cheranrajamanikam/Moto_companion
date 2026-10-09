import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bike, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase, isConfigured } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useTheme } from "@/hooks/use-theme";
import { mockAuth } from "@/lib/mockAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MotoCompanion" },
      {
        name: "description",
        content:
          "Sign in to MotoCompanion to plan rides, join ride-outs, track safe-riding points and shop riding gear.",
      },
      { property: "og:title", content: "Sign in to MotoCompanion" },
      {
        property: "og:description",
        content: "Rides, ride-outs, safety alerts and riding gear in one rider account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  useTheme();
  const navigate = useNavigate();
  const demoMode = !isConfigured;
  const [email, setEmail] = useState(demoMode ? "demo@motocompanion.in" : "");
  const [password, setPassword] = useState(demoMode ? "demo1234" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demoMode) {
      if (mockAuth.isLoggedIn()) {
        navigate({ to: "/dashboard", replace: true });
      }
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate, demoMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (demoMode) {
      const { error: mockError } = mockAuth.login(email, password);
      setBusy(false);
      if (mockError) {
        setError(mockError);
        return;
      }
      navigate({ to: "/dashboard", replace: true });
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleGoogle() {
    if (demoMode) {
      setError("Google sign-in is unavailable in demo mode. Use any email and password.");
      return;
    }
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground theme-fade">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        {demoMode ? (
          <div className="mt-6 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-[13px] text-primary">
            🏍️ Demo Mode — use any email and password to sign in
          </div>
        ) : null}

        <div className="mt-8 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Bike className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Moto<span className="text-primary">Companion</span>
          </span>
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Sign in to reach your feed, ride-outs, gear and safety tools.
        </p>

        {!demoMode ? (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              className="mt-7 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-primary"
            >
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or{" "}
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-[13px] font-medium">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-medium">Password</span>
            <div className="relative mt-1.5">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 pr-10 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error ? <p className="text-[13px] text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-primary">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
