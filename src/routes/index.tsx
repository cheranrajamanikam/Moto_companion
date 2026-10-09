import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  Bike,
  CloudRain,
  Fuel,
  Gauge,
  Github,
  Instagram,
  MapPin,
  Mountain,
  Quote,
  Radio,
  Route as RouteIcon,
  Satellite,
  ShieldCheck,
  Star,
  Users,
  Wrench,
  Youtube,
} from "lucide-react";
import { DemoBanner } from "@/components/site/DemoBanner";
import { Navbar } from "@/components/site/Navbar";
import { useReveal } from "@/hooks/use-reveal";
import { useTheme } from "@/hooks/use-theme";
import heroRider from "@/assets/hero-rider.jpg";
import communityRiders from "@/assets/community-riders.jpg";
import ctaRoad from "@/assets/cta-road.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MotoCompanion — Ride the best road, not the fastest one" },
      {
        name: "description",
        content:
          "MotoCompanion reads terrain from orbit, weather along your line and hazards called out by riders ahead — then hands you a route worth the fuel.",
      },
      { property: "og:title", content: "MotoCompanion — Ride the best road, not the fastest one" },
      {
        property: "og:description",
        content:
          "Satellite terrain scoring, rider weather, crash detection and group ride sync in one companion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const INTEL_POINTS = [
  {
    icon: Mountain,
    title: "Corner & gradient scoring",
    body: "Every segment rated on curve rhythm, elevation change and sightlines.",
  },
  {
    icon: CloudRain,
    title: "Radar-matched timing",
    body: "Departure windows that keep you ahead of the weather front.",
  },
  {
    icon: Satellite,
    title: "Offline satellite tiles",
    body: "Cached terrain so guidance survives dead zones in the mountains.",
  },
];

const FEATURES = [
  {
    icon: RouteIcon,
    title: "Curve-aware route planning",
    body: "Ask for twisty, scenic or fast and MotoCompanion builds the route from corner density, gradient and surface quality — not car directions.",
  },
  {
    icon: CloudRain,
    title: "Weather on your line",
    body: "Rain cells, crosswind and temperature drops are forecast along your route timeline, not just for your destination city.",
  },
  {
    icon: Gauge,
    title: "Ride telemetry",
    body: "Lean angle, braking zones, average moving speed and elevation gain recorded automatically from the moment you set off.",
  },
  {
    icon: Wrench,
    title: "Garage & service log",
    body: "Chain, tyres, oil and brake pads tracked against real kilometres so nothing gets serviced too late.",
  },
  {
    icon: Fuel,
    title: "Fuel and range guard",
    body: "Live range ring on the map with the last usable fuel stop flagged before you commit to an empty stretch.",
  },
  {
    icon: Users,
    title: "Group ride sync",
    body: "See every rider in your group live, with regroup pings when the pack strings out on the pass.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Add your bike",
    body: "Model, tyre setup and service history — MotoCompanion tunes range and route difficulty around your machine.",
  },
  {
    step: "02",
    title: "Pick a mood, not a destination",
    body: "Twisty Ghat morning, chai-stop loop, 600 km highway day. Satellite terrain data turns it into a real route in seconds.",
  },
  {
    step: "03",
    title: "Ride with guidance",
    body: "Turn prompts, hazard calls and weather changes come through your intercom without ever leaving your lane.",
  },
  {
    step: "04",
    title: "Review and share",
    body: "Every ride is logged with a map, stats and photo spots — post it to your crew in one tap.",
  },
];

const SAFETY = [
  {
    icon: ShieldCheck,
    title: "Crash detection",
    body: "Abnormal impact and stillness trigger a countdown, then alert your emergency contacts with a precise location.",
  },
  {
    icon: Radio,
    title: "Live ride sharing",
    body: "A private link lets someone at home follow your progress and ETA for the whole ride.",
  },
  {
    icon: Bell,
    title: "Hazard callouts",
    body: "Unmarked speed breakers, gravel patches, diesel spills and blind-crest warnings reported by riders ahead of you on the same road.",
  },
  {
    icon: MapPin,
    title: "Nearest help",
    body: "One tap surfaces the closest fuel, hospital and motorcycle-capable recovery service.",
  },
];

const COMMUNITY_CARDS = [
  { title: "Weekly ride-outs", body: "1,900+ open rides posted every month" },
  { title: "Shared routes", body: "Fork any published loop into your own plan" },
  { title: "Road reports", body: "Rider-verified surface and closure updates" },
  { title: "Rider badges", body: "Kilometres, passes and countries logged" },
];

const TESTIMONIALS = [
  {
    quote:
      "It routed me over a Ghat pass near Amboli I'd ignored for six years of riding Maharashtra. Best 90 kilometres of my season.",
    name: "Ananya Deshpande",
    role: "Royal Enfield Himalayan · 41,000 km logged",
  },
  {
    quote:
      "The monsoon rain alert gave me eleven minutes of warning on the Konkan coast. I was under a dhaba roof with dry gloves when it hit.",
    name: "Rohit Menon",
    role: "KTM 390 Adventure · weekend tourer",
  },
  {
    quote:
      "Group sync ended the endless 'kahan ho' stops on our Leh run. We just ride now and regroup when the app says so.",
    name: "Priya Nair",
    role: "Ride leader, Nilgiri Riders Collective",
  },
];

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: ["Route planner", "Satellite intelligence", "Ride telemetry", "Garage & service log"],
  },
  { title: "Riders", links: ["Community rides", "Safety hub", "Rider stories", "Gear reviews"] },
  { title: "Company", links: ["About", "Careers", "Press kit", "Contact"] },
];

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-bold tracking-[0.18em] text-primary uppercase">{children}</p>
  );
}

function Landing() {
  const { theme, toggleTheme } = useTheme();
  useReveal();

  return (
    <div className="min-h-screen bg-background text-foreground theme-fade">
      <DemoBanner />
      <Navbar theme={theme} onToggleTheme={toggleTheme} />

      <main className="pt-[46px]">
        {/* HERO */}
        <section id="hero" className="relative overflow-hidden">
          <img
            src={heroRider}
            alt="Motorcyclist in helmet lit by warm light at night"
            width={1920}
            height={1088}
            className="absolute inset-0 h-full w-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black via-black/85 to-black/30" />
          <div className="diagonal-texture absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-[1140px] px-4 py-24 sm:py-32">
            <div className="reveal max-w-2xl" data-reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-on-image uppercase backdrop-blur-sm">
                <Bike className="h-3.5 w-3.5" /> Built for Indian roads
              </span>
              <h1 className="mt-7 text-5xl leading-[1.06] text-on-image sm:text-6xl">
                Ride the best road,
                <span className="block text-primary">not the fastest one.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-on-image-muted">
                From Ghat hairpins to Leh passes and monsoon coastal runs, MotoCompanion reads
                terrain from orbit, weather along your line and hazards called out by riders ahead —
                then hands you a route worth the fuel.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity duration-200 hover:opacity-90"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="/auth"
                  className="inline-flex items-center rounded-md border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-on-image backdrop-blur-sm transition-colors duration-200 hover:bg-white/20"
                >
                  Sign in for the live map
                </a>
              </div>

              <div className="mt-12 w-full max-w-sm rounded-xl border border-white/10 bg-black/55 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold tracking-[0.16em] text-on-image-muted uppercase">
                    Today&apos;s match
                  </p>
                  <span className="live-pulse inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
                  </span>
                </div>
                <p className="mt-2.5 text-lg font-bold text-on-image">
                  Tamhini Ghat loop · 142 km
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  {[
                    { v: "148", l: "Corners" },
                    { v: "1,240 m", l: "Climb" },
                    { v: "5 h", l: "Dry window" },
                  ].map((s) => (
                    <div
                      key={s.l}
                      className="rounded-lg border border-white/8 bg-white/6 px-3 py-2.5 text-center"
                    >
                      <p className="text-sm font-bold text-primary">{s.v}</p>
                      <p className="mt-0.5 text-[10px] tracking-[0.12em] text-on-image-muted uppercase">
                        {s.l}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SATELLITE INTELLIGENCE */}
        <section
          id="intelligence"
          className="diagonal-texture relative bg-surface-2 py-20 theme-fade sm:py-24"
        >
          <div className="relative mx-auto grid max-w-[1140px] items-center gap-12 px-4 lg:grid-cols-2">
            <div className="reveal" data-reveal>
              <Eyebrow>Satellite intelligence</Eyebrow>
              <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">
                Orbit-grade terrain data,
                <br className="hidden sm:block" /> translated into riding language
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
                We fuse elevation models, road curvature, surface classification and live weather
                radar into a single score for every stretch of tarmac. You just see which road is
                worth taking today.
              </p>
              <ul className="mt-8 space-y-5">
                {INTEL_POINTS.map((p) => (
                  <li key={p.title} className="flex gap-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                      <p.icon className="h-[18px] w-[18px]" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{p.title}</span>
                      <span className="mt-0.5 block text-[13px] text-muted-foreground">
                        {p.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="reveal relative" data-reveal>
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-12 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Satellite className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold">Live satellite map is for riders</h3>
                <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">
                  Sign in to open the interactive NH275 / Coorg terrain map, hazard pins and route
                  safety score. It is not shown on the public landing page.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/auth"
                    className="rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground"
                  >
                    Sign in to open map
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-lg border border-border px-4 py-2.5 text-[13px] font-semibold"
                  >
                    Create a free account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="grid-texture bg-background py-20 theme-fade sm:py-24">
          <div className="mx-auto max-w-[1140px] px-4">
            <div className="reveal max-w-xl" data-reveal>
              <Eyebrow>Features</Eyebrow>
              <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">
                Everything a rider actually needs, in one companion
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Built with riders on long tours, wet commutes and Sunday mountain runs.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article
                  key={f.title}
                  data-reveal
                  className="reveal group rounded-xl border border-border bg-card p-6 theme-fade hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/12 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="mt-5 text-base">{f.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="diagonal-texture bg-surface-2 py-20 theme-fade sm:py-24"
        >
          <div className="mx-auto max-w-[1140px] px-4">
            <div className="reveal" data-reveal>
              <Eyebrow>How it works</Eyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl">From parked to riding in four steps</h2>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <div
                  key={s.step}
                  data-reveal
                  className="reveal rounded-xl border border-border bg-card p-6 theme-fade hover:-translate-y-1 hover:border-primary/50"
                >
                  <span className="text-3xl font-bold text-primary/45">{s.step}</span>
                  <h3 className="mt-4 text-base">{s.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SAFETY */}
        <section id="safety" className="grid-texture bg-background py-20 theme-fade sm:py-24">
          <div className="mx-auto grid max-w-[1140px] items-center gap-12 px-4 lg:grid-cols-2">
            <div className="reveal" data-reveal>
              <Eyebrow>Safety</Eyebrow>
              <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">
                Someone is always watching the road with you
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                Riding solo shouldn&apos;t mean riding unwatched. MotoCompanion keeps a quiet safety
                net running in the background of every trip.
              </p>
              <div className="mt-8 rounded-xl border border-success/35 bg-success/10 px-5 py-4">
                <p className="text-[10px] font-bold tracking-[0.16em] text-success uppercase">
                  Live status
                </p>
                <p className="mt-1.5 text-[13px]">
                  Ride shared with 2 contacts · Crash detection armed · Storm cell 34 km ahead
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {SAFETY.map((s) => (
                <div
                  key={s.title}
                  data-reveal
                  className="reveal rounded-xl border border-border bg-card p-6 theme-fade hover:-translate-y-1 hover:border-primary/50"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/12 text-primary">
                    <s.icon className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="mt-4 text-base">{s.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMMUNITY */}
        <section id="community" className="diagonal-texture bg-surface-2 py-20 theme-fade sm:py-24">
          <div className="mx-auto grid max-w-[1140px] items-center gap-12 px-4 lg:grid-cols-2">
            <div className="reveal" data-reveal>
              <img
                src={communityRiders}
                alt="Group of motorcyclists at a mountain viewpoint at sunset"
                loading="lazy"
                width={1200}
                height={800}
                className="w-full rounded-xl border border-border object-cover"
              />
            </div>
            <div className="reveal" data-reveal>
              <Eyebrow>Community</Eyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl">Find the crew that rides like you do</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Join local ride-outs, publish your favourite loops and pick up road knowledge from
                riders who cover the same passes every weekend.
              </p>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {COMMUNITY_CARDS.map((c) => (
                  <div
                    key={c.title}
                    className="rounded-xl border border-border bg-card p-4 theme-fade hover:border-primary/50"
                  >
                    <p className="text-sm font-semibold">{c.title}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* RIDERS / TESTIMONIALS */}
        <section id="riders" className="grid-texture bg-background py-20 theme-fade sm:py-24">
          <div className="mx-auto max-w-[1140px] px-4">
            <div className="reveal" data-reveal>
              <Eyebrow>Riders</Eyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl">What riders say after a season with us</h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.name}
                  data-reveal
                  className="reveal rounded-xl border border-border bg-card p-6 theme-fade hover:-translate-y-1 hover:border-primary/50"
                >
                  <Quote className="h-6 w-6 text-primary/70" />
                  <blockquote className="mt-4 text-[13px] leading-relaxed">{t.quote}</blockquote>
                  <div className="mt-5 flex gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <figcaption className="mt-5 border-t border-border pt-4">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{t.role}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden">
          <img
            src={ctaRoad}
            alt="Motorcyclist on a mountain pass at dusk"
            loading="lazy"
            width={1920}
            height={912}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/72" />
          <div className="relative mx-auto max-w-2xl px-4 py-24 text-center sm:py-28">
            <h2 className="reveal text-4xl leading-tight text-on-image sm:text-5xl" data-reveal>
              Your next great road is already mapped
            </h2>
            <p className="reveal mt-5 text-sm text-on-image-muted" data-reveal>
              Create your rider profile, add your bike and let MotoCompanion plan the ride you&apos;ll
              still talk about next winter.
            </p>
            <div className="reveal mt-8 flex flex-wrap justify-center gap-3" data-reveal>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center rounded-md border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-on-image backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Explore features
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative overflow-hidden border-t border-border">
        <img
          src={communityRiders}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={1200}
          height={800}
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-black/85" />
        <div className="relative mx-auto max-w-[1140px] px-4 py-14">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Bike className="h-[18px] w-[18px]" />
                </span>
                <span className="text-lg font-bold text-on-image">
                  Moto<span className="text-primary">Companion</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-on-image-muted">
                The riding companion that plans the road, reads the sky and keeps someone watching
                over every kilometre you cover.
              </p>
              <div className="mt-5 flex gap-2.5">
                {[Instagram, Youtube, Github].map((Icon, i) => (
                  <a
                    key={i}
                    href="#hero"
                    aria-label="Social link"
                    className="grid h-9 w-9 place-items-center rounded-lg border border-white/12 bg-white/6 text-on-image transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-[11px] font-bold tracking-[0.16em] text-on-image uppercase">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#hero"
                        className="text-[13px] text-on-image-muted transition-colors hover:text-primary"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[12px] text-on-image-muted sm:flex-row">
            <p>© {new Date().getFullYear()} MotoCompanion. Demo experience — ride data is simulated.</p>
            <div className="flex gap-5">
              <a href="#hero" className="hover:text-primary">
                Privacy
              </a>
              <a href="#hero" className="hover:text-primary">
                Terms
              </a>
              <Link to="/register" className="font-semibold text-primary">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
