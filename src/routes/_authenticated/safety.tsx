import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Check,
  CheckCircle2,
  MapPin,
  Phone,
  Radar,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { supabase, isConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_EMERGENCY_CONTACTS } from "@/lib/demoData";

export const Route = createFileRoute("/_authenticated/safety")({
  head: () => ({
    meta: [
      { title: "Emergency SOS & crash detection — MotoCompanion" },
      {
        name: "description",
        content:
          "Start a timed SOS, monitor supported crash signals and manage trusted emergency contacts.",
      },
      { property: "og:title", content: "MotoCompanion emergency safety" },
      {
        property: "og:description",
        content: "Timed SOS, crash detection status and emergency contacts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SafetyPage,
});

const ACTIONS = [
  "Move away from traffic if it is safe",
  "Check yourself and others for injury",
  "Keep your phone unlocked and nearby",
  "Call 112 if immediate help is needed",
];

type MotionPermission = "idle" | "active" | "unsupported" | "denied";

function SafetyPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [sosMessage, setSosMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [motionStatus, setMotionStatus] = useState<MotionPermission>("idle");
  const [checked, setChecked] = useState<number[]>([]);
  const motionTriggered = useRef(false);

  type DemoContact = (typeof DEMO_EMERGENCY_CONTACTS)[number];
  type DemoAlert = {
    id: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
  };
  const [demoContacts, setDemoContacts] = useState<DemoContact[]>(DEMO_EMERGENCY_CONTACTS);
  const [demoAlerts, setDemoAlerts] = useState<DemoAlert[]>([]);

  const contacts = useQuery({
    queryKey: ["emergency-contacts"],
    enabled: isConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const alerts = useQuery({
    queryKey: ["sos-alerts"],
    enabled: isConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sos_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const sendSos = useMutation({
    mutationFn: async () => {
      const position = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
          enableHighAccuracy: true,
          timeout: 8000,
        });
      });
      if (!isConfigured) {
        setDemoAlerts((prev) => [
          {
            id: `demo-alert-${Date.now()}`,
            status: "active",
            latitude: position?.coords.latitude ?? null,
            longitude: position?.coords.longitude ?? null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        return position !== null;
      }
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("sos_alerts").insert({
        user_id: userId,
        latitude: position?.coords.latitude ?? null,
        longitude: position?.coords.longitude ?? null,
        status: "active",
      });
      if (error) throw error;
      return position !== null;
    },
    onSuccess: (hadLocation) => {
      setSosMessage(
        hadLocation
          ? "SOS sent with your live location."
          : "SOS sent. Location access was unavailable.",
      );
      queryClient.invalidateQueries({ queryKey: ["sos-alerts"] });
    },
    onError: () => setSosMessage("The SOS could not be sent. Call 112 if you need immediate help."),
  });
  const sendSosNow = sendSos.mutate;

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      sendSosNow();
      return;
    }
    const timer = window.setTimeout(
      () => setCountdown((value) => (value === null ? null : value - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [countdown, sendSosNow]);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration || motionTriggered.current) return;
    const force = Math.sqrt(
      (acceleration.x ?? 0) ** 2 + (acceleration.y ?? 0) ** 2 + (acceleration.z ?? 0) ** 2,
    );
    if (force > 28) {
      motionTriggered.current = true;
      setCountdown(10);
      setSosMessage("Possible crash detected. Cancel the countdown if you are safe.");
    }
  }, []);

  useEffect(() => {
    if (motionStatus !== "active") return;
    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [handleMotion, motionStatus]);

  async function enableCrashDetection() {
    if (!("DeviceMotionEvent" in window)) {
      setMotionStatus("unsupported");
      return;
    }
    const DeviceMotionWithPermission = DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    try {
      const permission = DeviceMotionWithPermission.requestPermission
        ? await DeviceMotionWithPermission.requestPermission()
        : "granted";
      setMotionStatus(permission === "granted" ? "active" : "denied");
    } catch {
      setMotionStatus("denied");
    }
  }

  const addContact = useMutation({
    mutationFn: async () => {
      if (!isConfigured) {
        setDemoContacts((prev) => [
          ...prev,
          {
            id: `demo-ec-${Date.now()}`,
            user_id: userId ?? "mock-user-001",
            contact_name: name.trim(),
            phone_number: phone.trim(),
            relationship: relationship.trim() || "Emergency contact",
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("emergency_contacts").insert({
        user_id: userId,
        contact_name: name.trim(),
        phone_number: phone.trim(),
        relationship: relationship.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setPhone("");
      setRelationship("");
      queryClient.invalidateQueries({ queryKey: ["emergency-contacts"] });
    },
  });

  const removeContact = useMutation({
    mutationFn: async (id: string) => {
      if (!isConfigured) {
        setDemoContacts((prev) => prev.filter((c) => c.id !== id));
        return;
      }
      const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emergency-contacts"] }),
  });

  const resolveAlert = useMutation({
    mutationFn: async (id: string) => {
      if (!isConfigured) {
        setDemoAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "resolved" } : a)),
        );
        return;
      }
      const { error } = await supabase
        .from("sos_alerts")
        .update({ status: "resolved" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sos-alerts"] }),
  });

  const contactsData = isConfigured ? contacts.data : demoContacts;
  const alertsData = isConfigured ? alerts.data : demoAlerts;

  return (
    <AppShell title="Safety & SOS" subtitle="Emergency tools that stay ready for every ride.">
      <div className="grid max-w-6xl gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-lg border border-destructive/30 bg-card p-6 text-center diagonal-texture sm:p-8">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-destructive">
                <span className="h-2 w-2 rounded-full bg-destructive sos-status-pulse" /> Emergency
                response
              </span>
              <h2 className="mt-3 text-xl">Need immediate help?</h2>
              <p className="mx-auto mt-2 max-w-md text-[13px] text-muted-foreground">
                Press SOS to begin a 5-second countdown. Your location is attached when available.
              </p>
              <div className="mt-7 flex justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  disabled={sendSos.isPending}
                  onClick={() => setCountdown(countdown === null ? 5 : null)}
                  className="sos-button h-36 w-36 flex-col rounded-full border-8 border-destructive/20 text-destructive-foreground shadow-none"
                >
                  {countdown !== null ? (
                    <span className="text-4xl font-bold">{countdown}</span>
                  ) : (
                    <ShieldAlert className="h-10 w-10" />
                  )}
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {countdown !== null
                      ? "Tap to cancel"
                      : sendSos.isPending
                        ? "Sending"
                        : "Send SOS"}
                  </span>
                </Button>
              </div>
              {sosMessage ? (
                <p role="status" className="mt-5 text-[13px] font-medium text-foreground">
                  {sosMessage}
                </p>
              ) : null}
              <p className="mt-3 text-[11px] text-muted-foreground">
                For life-threatening emergencies in India, call 112.
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-secondary text-primary">
                  <Radar className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm uppercase tracking-wider">Crash detection</h2>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Uses supported phone motion signals while this screen is open.
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${motionStatus === "active" ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground"}`}
              >
                {motionStatus === "active" ? "Monitoring" : motionStatus}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
              <p className="text-[12px] text-muted-foreground">
                A strong impact starts a 10-second SOS countdown you can cancel.
              </p>
              <Button
                type="button"
                size="sm"
                variant={motionStatus === "active" ? "outline" : "default"}
                onClick={() =>
                  motionStatus === "active" ? setMotionStatus("idle") : enableCrashDetection()
                }
              >
                <Activity /> {motionStatus === "active" ? "Disable" : "Enable"}
              </Button>
            </div>
            {motionStatus === "unsupported" || motionStatus === "denied" ? (
              <p className="mt-3 text-[12px] text-destructive">
                Motion access is unavailable or was denied on this device.
              </p>
            ) : null}
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm uppercase tracking-wider">SOS actions checklist</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {ACTIONS.map((action, index) => {
                const done = checked.includes(index);
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() =>
                      setChecked((items) =>
                        done ? items.filter((item) => item !== index) : [...items, index],
                      )
                    }
                    className="flex min-h-12 items-center gap-3 rounded-md border border-border bg-background px-3 text-left text-[12px] transition-colors hover:border-primary"
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${done ? "border-success bg-success text-primary-foreground" : "border-border"}`}
                    >
                      {done ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className={done ? "text-muted-foreground line-through" : ""}>
                      {action}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-wider">Emergency contacts</h2>
              <span className="text-[11px] text-muted-foreground">
                {contactsData?.length ?? 0} saved
              </span>
            </div>
            <form
              className="mt-4 grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (name.trim() && phone.trim()) addContact.mutate();
              }}
            >
              <input
                required
                aria-label="Contact name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contact name"
                className="rounded-md border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-primary"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  required
                  type="tel"
                  aria-label="Phone number"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Phone number"
                  className="rounded-md border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-primary"
                />
                <input
                  aria-label="Relationship"
                  value={relationship}
                  onChange={(event) => setRelationship(event.target.value)}
                  placeholder="Relationship"
                  className="rounded-md border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-primary"
                />
              </div>
              <Button type="submit" disabled={addContact.isPending}>
                {addContact.isPending ? "Saving…" : "Add emergency contact"}
              </Button>
            </form>
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {contactsData?.map((contact) => (
                <li key={contact.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{contact.contact_name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {contact.relationship || "Emergency contact"} · {contact.phone_number}
                    </p>
                  </div>
                  <Button
                    asChild
                    size="icon"
                    variant="outline"
                    aria-label={`Call ${contact.contact_name}`}
                  >
                    <a href={`tel:${contact.phone_number}`}>
                      <Phone />
                    </a>
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${contact.contact_name}`}
                    onClick={() => removeContact.mutate(contact.id)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
              {!(isConfigured && contacts.isLoading) && contactsData?.length === 0 ? (
                <li className="py-5 text-center text-[12px] text-muted-foreground">
                  Add someone you trust before your next ride.
                </li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm uppercase tracking-wider">Recent SOS activity</h2>
            <ul className="mt-3 space-y-2">
              {alertsData?.map((alert) => (
                <li key={alert.id} className="rounded-md border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`flex items-center gap-1.5 text-[11px] font-bold uppercase ${alert.status === "active" ? "text-destructive" : "text-success"}`}
                    >
                      {alert.status === "active" ? (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      {alert.status}
                    </span>
                    {alert.status === "active" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => resolveAlert.mutate(alert.id)}
                      >
                        Mark safe
                      </Button>
                    ) : null}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {alert.latitude != null
                      ? `${Number(alert.latitude).toFixed(4)}, ${Number(alert.longitude).toFixed(4)}`
                      : "Location unavailable"}{" "}
                    · {new Date(alert.created_at).toLocaleString("en-IN")}
                  </p>
                </li>
              ))}
              {!(isConfigured && alerts.isLoading) && alertsData?.length === 0 ? (
                <li className="py-3 text-[12px] text-muted-foreground">No SOS alerts recorded.</li>
              ) : null}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
