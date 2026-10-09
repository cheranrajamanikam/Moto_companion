import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bike, Check, Satellite, ShieldCheck, Users } from "lucide-react";
import heroImg from "@/assets/hero-india-light.jpg";
import { useState } from "react";
import { supabase, isConfigured } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useTheme } from "@/hooks/use-theme";
import { mockAuth } from "@/lib/mockAuth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — MotoCompanion" },
      {
        name: "description",
        content:
          "Sign up for MotoCompanion and start logging rides, joining ride-outs and tracking safe-riding points for free.",
      },
      { property: "og:title", content: "Create your MotoCompanion account" },
      {
        property: "og:description",
        content: "Free rider account — ride-outs, safety tools, leaderboard and gear shop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  useTheme();
  const navigate = useNavigate();
  const demoMode = !isConfigured;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bike, setBike] = useState("");
  const [ridingStyle, setRidingStyle] = useState("Touring");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (demoMode) {
      const { error: mockError } = mockAuth.register({
        email,
        password,
        fullName: name,
        bike,
        ridingStyle,
      });
      setBusy(false);
      if (mockError) {
        setError(mockError);
        return;
      }
      setSuccess(true);
      window.setTimeout(() => {
        navigate({ to: "/dashboard", replace: true });
      }, 1500);
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name, bike, riding_style: ridingStyle },
      },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    setConfirmEmail(true);
  }

  async function handleGoogle() {
    if (demoMode) {
      setError("Google sign-up is unavailable in demo mode. Fill the form below.");
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
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:block">
          <img
            src={heroImg}
            alt="Rider on a motorcycle lit by warm rim light"
            width={1920}
            height={1088}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-black/25" />
          <div className="relative flex h-full min-h-screen flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-primary">
                <Bike className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold uppercase">MotoCompanion</span>
            </div>
            <div>
              <h2 className="text-5xl font-bold uppercase">Your first ride is waiting</h2>
              <ul className="mt-8 space-y-4">
                {[
                  { icon: Satellite, text: "Satellite route intelligence on every ride" },
                  { icon: ShieldCheck, text: "Crash detection and live ride sharing" },
                  { icon: Users, text: "Group rides with 40,000+ riders" },
                  { icon: Check, text: "Community feed, ride-outs and weekly challenges" },
                  { icon: Check, text: "Emergency contacts and one-tap SOS" },
                  { icon: Check, text: "AI gear picks and a rupee-priced gear shop" },
                ].map((f) => (
                  <li key={f.text} className="flex gap-3 text-sm">
                    <f.icon className="h-5 w-5 shrink-0" />
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-white/80">Free rider account.</p>
          </div>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          {demoMode ? (
            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-[13px] text-primary">
              🏍️ Demo Mode — registration works instantly with mock data
            </div>
          ) : null}

          <h1 className="mt-8 text-4xl font-bold uppercase">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Free rider plan. No card required, cancel any time.
          </p>

          {success ? (
            <div className="mt-8 rounded-2xl border border-primary bg-card p-6 theme-fade">
              <p className="font-semibold">Account created!</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Welcome to MotoCompanion. Redirecting to your dashboard…
              </p>
            </div>
          ) : confirmEmail ? (
            <div className="mt-8 rounded-2xl border border-primary bg-card p-6 theme-fade">
              <p className="font-semibold">Check your email</p>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to {email}. Open it to finish setting up your rider
                account, then sign in.
              </p>
              <Link to="/auth" className="mt-4 inline-block text-sm font-medium text-primary">
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              {!demoMode ? (
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="mt-8 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-primary"
                >
                  Continue with Google
                </button>
              ) : null}

              {!demoMode ? (
                <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> or{" "}
                  <span className="h-px flex-1 bg-border" />
                </div>
              ) : null}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-sm font-medium">Full name</span>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rider"
                    className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none theme-fade focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Email</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none theme-fade focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Password</span>
                  <input
                    required
                    minLength={6}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none theme-fade focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Your bike</span>
                  <input
                    type="text"
                    value={bike}
                    onChange={(e) => setBike(e.target.value)}
                    placeholder="Yamaha MT-09, 2022"
                    className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none theme-fade focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Riding style</span>
                  <select
                    value={ridingStyle}
                    onChange={(e) => setRidingStyle(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none theme-fade focus:border-primary focus:ring-2 focus:ring-primary/30"
                  >
                    {["Touring", "Commuting", "Track", "Adventure"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:scale-[1.02] disabled:opacity-60"
                >
                  {busy ? "Creating account…" : "Create free account"}
                </button>
              </form>

              <p className="mt-6 text-sm text-muted-foreground">
                Already riding with us?{" "}
                <Link to="/auth" className="font-medium text-primary">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
