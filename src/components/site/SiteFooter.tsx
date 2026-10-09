import { Link } from "@tanstack/react-router";
import { Bike, Instagram, Youtube, Github } from "lucide-react";
import communityImg from "@/assets/community-ride.jpg";

const COLUMNS = [
  {
    title: "Product",
    links: ["Route planner", "Satellite intelligence", "Ride telemetry", "Garage & service log"],
  },
  { title: "Riders", links: ["Community rides", "Safety hub", "Rider stories", "Gear reviews"] },
  { title: "Company", links: ["About", "Careers", "Press kit", "Contact"] },
];

export function SiteFooter() {
  return (
    <footer className="theme-fade relative overflow-hidden border-t border-border bg-surface">
      <img
        src={communityImg}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={1600}
        height={1008}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12]"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Bike className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-bold">
                Moto<span className="text-primary">Companion</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              The riding companion that plans the road, reads the sky and keeps someone watching
              over every kilometre you cover.
            </p>
            <div className="mt-5 flex gap-2">
              {[Instagram, Youtube, Github].map((Icon, i) => (
                <span
                  key={i}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background/70 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold tracking-widest text-foreground uppercase">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <span className="cursor-default text-sm text-muted-foreground transition-colors hover:text-primary">
                      {l}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MotoCompanion. Demo experience — ride data is simulated.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Privacy</span>
            <span>Terms</span>
            <Link to="/register" className="font-semibold text-primary">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
