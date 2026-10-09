import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function DemoBanner() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("mc-demo-banner") === "dismissed") setOpen(false);
    } catch {
      /* ignore */
    }
  }, []);

  if (!open) return null;

  return (
    <div className="theme-fade relative z-50 bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
        <span className="shrink-0 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[11px] font-bold tracking-widest uppercase">
          Demo
        </span>
        <p className="min-w-0 flex-1 truncate text-xs font-medium sm:text-sm">
          Preview build — sample rides, telemetry and riders. No real tracking data is used.
        </p>
        <button
          type="button"
          aria-label="Dismiss demo notice"
          onClick={() => {
            setOpen(false);
            try {
              sessionStorage.setItem("mc-demo-banner", "dismissed");
            } catch {
              /* ignore */
            }
          }}
          className="shrink-0 rounded-md p-1 transition-colors hover:bg-primary-foreground/15"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
