import { useState } from "react";
import { AlertTriangle, CheckCircle2, Satellite } from "lucide-react";

export function SatelliteRoutePage() {
  const [from, setFrom] = useState("Bengaluru");
  const [to, setTo] = useState("Coorg");
  const [analysed, setAnalysed] = useState(true);

  return (
    <div className="animate-page-in space-y-6">
      <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-card p-4 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm">
          <span className="text-muted-foreground">From</span>
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="flex-1 text-sm">
          <span className="text-muted-foreground">To</span>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <button
          type="button"
          onClick={() => setAnalysed(true)}
          className="btn-gradient rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
        >
          Analyse Route
        </button>
      </div>

      <div className="relative overflow-hidden rounded-[14px] border border-border">
        <div
          className="relative min-h-[320px] bg-[#0a120a]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 20%, #1a3020 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, #152818 0%, transparent 45%), linear-gradient(180deg, #0d0d0d 0%, #121812 100%)",
          }}
        >
          <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-semibold">
            <span className="live-pulse h-2 w-2 rounded-full bg-success" />
            <Satellite className="h-3.5 w-3.5 text-primary" />
            Live Satellite
          </div>

          {analysed ? (
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 320" preserveAspectRatio="none">
              <path
                d="M 80 260 Q 200 120 320 180 T 520 100 T 720 140"
                fill="none"
                stroke="#FF6B00"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="200" cy="200" r="10" fill="#4ADE80" />
              <circle cx="420" cy="130" r="10" fill="#FFB800" />
              <circle cx="620" cy="150" r="10" fill="#EF4444" />
            </svg>
          ) : null}

          <div className="absolute bottom-3 left-3 text-xs text-muted-foreground">
            NH275 · {from} → {to}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="card-lift rounded-[14px] border border-border bg-card p-5 text-center">
          <p className="text-sm font-semibold">Route Safety Score</p>
          <div className="relative mx-auto mt-4 grid h-28 w-28 place-items-center rounded-full border-4 border-primary/30">
            <span className="text-3xl font-bold text-primary">72</span>
            <span className="absolute -bottom-1 text-[10px] text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-4 space-y-2 text-left text-xs">
            {[
              { label: "Road Condition", value: "Good", color: "text-success" },
              { label: "Weather Risk", value: "Moderate", color: "text-[#FFB800]" },
              { label: "Traffic Density", value: "Low", color: "text-success" },
              { label: "Satellite Hazards", value: "2 Found", color: "text-destructive" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={`font-semibold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <HazardCard
            title="Road Work Detected at km 45"
            time="detected 12 minutes ago"
            severity="Low"
            icon="yellow"
          />
          <HazardCard
            title="Waterlogging Detected at km 78"
            time="detected 4 minutes ago"
            severity="Moderate"
            icon="red"
          />
          <div className="flex items-center gap-2 rounded-[14px] border border-border bg-card p-4 text-sm">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Safe zone confirmed for first 40 km of NH275 ghat approach.
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Powered by OSINT satellite intelligence — updated every 15 minutes
      </p>
    </div>
  );
}

function HazardCard({
  title,
  time,
  severity,
  icon,
}: {
  title: string;
  time: string;
  severity: string;
  icon: "yellow" | "red";
}) {
  return (
    <div className="card-lift rounded-[14px] border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-5 w-5 shrink-0 ${icon === "red" ? "text-destructive" : "text-[#FFB800]"}`} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{time}</p>
          <span
            className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              severity === "Low" ? "bg-[#FFB800]/20 text-[#FFB800]" : "bg-destructive/20 text-destructive"
            }`}
          >
            Severity {severity}
          </span>
        </div>
        <button type="button" className="btn-gradient shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white">
          Suggest Alternate Route
        </button>
      </div>
    </div>
  );
}
