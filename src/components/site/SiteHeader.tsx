import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Bike } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useScrolled } from "@/hooks/use-reveal";

const NAV = [
  { label: "Intelligence", href: "#intelligence" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#steps" },
  { label: "Safety", href: "#safety" },
  { label: "Community", href: "#community" },
  { label: "Riders", href: "#testimonials" },
];

export function SiteHeader() {
  const scrolled = useScrolled(16);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`theme-fade sticky top-0 z-40 border-b ${
        scrolled
          ? "border-border bg-background/85 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Bike className="h-5 w-5" />
          </span>
          <span className="truncate font-display text-lg font-bold tracking-tight">
            Moto<span className="text-primary">Companion</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            to="/register"
            className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:scale-[1.03] sm:inline-flex"
          >
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="theme-fade grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-foreground/40 transition-opacity duration-300"
          style={{ opacity: open ? 1 : 0 }}
        />
        <aside
          className="theme-fade absolute top-0 right-0 h-full w-[82%] max-w-sm border-l border-border bg-background p-5 shadow-2xl transition-transform duration-300 ease-out"
          style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-base font-bold">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-6 flex flex-col">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-3.5 text-base font-medium text-foreground/90 transition-colors hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-surface p-3">
            <span className="text-sm font-medium">Appearance</span>
            <ThemeToggle />
          </div>
          <Link
            to="/register"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
          >
            Get Started
          </Link>
        </aside>
      </div>
    </header>
  );
}
