import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bike,
  Bot,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Route as RouteIcon2,
  Satellite,
  ShieldAlert,
  ShoppingBag,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase, isConfigured } from "@/integrations/supabase/client";
import { mockAuth } from "@/lib/mockAuth";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/match", label: "Find a Rider", icon: Bike },
  { to: "/ai-companion", label: "AI Companion", icon: Bot },
  { to: "/satellite", label: "Satellite", icon: Satellite },
  { to: "/community", label: "Community", icon: Users },
  { to: "/shop", label: "Shop & Gear", icon: ShoppingBag },
  { to: "/safety", label: "Safety & SOS", icon: ShieldAlert },
  { to: "/rides", label: "My Rides", icon: RouteIcon2 },
  { to: "/profile", label: "My Profile", icon: User },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { theme, toggleTheme } = useTheme();
  const { displayName } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const isDark = theme === "dark";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    if (!isConfigured) {
      mockAuth.logout();
      navigate({ to: "/auth", replace: true });
      return;
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const navLinkClass = (to: string) => {
    const active = pathname === to || pathname.startsWith(`${to}/`);
    return cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors",
      active
        ? "bg-primary font-semibold text-primary-foreground"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
    );
  };

  const nav = (
    <nav className="flex flex-col gap-1">
      {LINKS.map((l) => (
        <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className={navLinkClass(l.to)}>
          <l.icon className="h-4 w-4 shrink-0" />
          <span className="lg:inline">{l.label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background pb-[calc(60px+env(safe-area-inset-bottom))] text-foreground theme-fade lg:pb-0">
      <div className="mx-auto flex max-w-[1240px]">
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-border px-4 py-5 md:flex">
          {!isConfigured ? (
            <div className="mb-4 rounded-[14px] border border-primary/20 bg-primary/10 px-3 py-2 text-[11px] text-primary">
              Demo Mode — any email & password works
            </div>
          ) : null}
          <Link to="/" className="mb-6 flex items-center gap-2.5 px-1">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Bike className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">
              Moto<span className="text-primary">Companion</span>
            </span>
          </Link>
          {nav}
          <div className="mt-auto flex flex-col gap-2 pt-6">
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="truncate text-[12px] text-muted-foreground">{displayName}</span>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="grid h-7 w-7 place-items-center rounded-md hover:bg-secondary"
              >
                {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:text-primary"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="animate-page-in">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              {subtitle ? (
                <p className="mt-1.5 max-w-2xl text-[13px] text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="hidden h-9 w-9 items-center justify-center rounded-md border border-border md:grid lg:hidden"
              >
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border md:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[60px] border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {LINKS.map((l) => {
          const active = pathname === l.to || pathname.startsWith(`${l.to}/`);
          return (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <l.icon className={cn("h-5 w-5", active && "text-primary")} />
              <span className="max-w-[72px] truncate">{l.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      <div
        className={cn("fixed inset-0 z-60 md:hidden", open ? "" : "pointer-events-none")}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/70 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          className={cn(
            "absolute inset-y-0 right-0 flex w-[84%] max-w-xs flex-col gap-5 border-l border-border bg-background p-5 transition-transform duration-300",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold">
              Moto<span className="text-primary">Companion</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {nav}
          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
