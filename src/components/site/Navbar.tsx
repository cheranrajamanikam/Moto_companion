import { Link } from "@tanstack/react-router";
import { Bike, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useHideOnScroll } from "@/hooks/use-hide-on-scroll";
import type { Theme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Intelligence", href: "#intelligence" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Safety", href: "#safety" },
  { label: "Community", href: "#community" },
  { label: "Riders", href: "#riders" },
];

function ThemeToggle({
  theme,
  onToggle,
  className,
}: {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex h-8 w-[58px] items-center rounded-full border border-border bg-secondary px-1 theme-fade hover:border-primary",
        className,
      )}
    >
      <span
        className={cn(
          "grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-300",
          isDark ? "translate-x-[26px]" : "translate-x-0",
        )}
      >
        {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

function Wordmark() {
  return (
    <a href="#hero" className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Bike className="h-[18px] w-[18px]" />
      </span>
      <span className="text-lg font-bold tracking-tight">
        Moto<span className="text-primary">Companion</span>
      </span>
    </a>
  );
}

export function Navbar({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const { hidden } = useHideOnScroll();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md theme-fade transition-transform duration-300",
          hidden && !open ? "-translate-y-full" : "translate-y-0",
        )}
      >
        <nav className="mx-auto flex h-[46px] max-w-[1140px] items-center justify-between px-4">
          <Wordmark />

          <div className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[13px] text-muted-foreground transition-colors hover:text-primary"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <Link
              to="/register"
              className="hidden rounded-md bg-primary px-4 py-1.5 text-[13px] font-semibold text-primary-foreground transition-opacity duration-200 hover:opacity-90 sm:inline-flex"
            >
              Get Started
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </nav>
      </header>

      <div
        className={cn("fixed inset-0 z-60 lg:hidden", open ? "" : "pointer-events-none")}
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
            "absolute inset-y-0 right-0 flex w-[84%] max-w-xs flex-col gap-6 border-l border-border bg-background p-6 transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <Wordmark />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-3.5 text-sm text-foreground transition-colors hover:text-primary"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm text-muted-foreground">
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </span>
              <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="rounded-md bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
            >
              Get Started
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
