import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { supabase, isConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { recommendGear, type GearRecommendation } from "@/lib/gear.functions";
import { demoCart, getDemoGearRecommendation } from "@/lib/demoData";

export const Route = createFileRoute("/_authenticated/gear")({
  beforeLoad: () => {
    throw redirect({ to: "/shop", search: { tab: "gear" } });
  },
  head: () => ({
    meta: [
      { title: "AI gear recommendations — MotoCompanion" },
      {
        name: "description",
        content:
          "Tell MotoCompanion your bike, riding style and experience and get a matched helmet, jacket, gloves, guards and boots.",
      },
      { property: "og:title", content: "AI riding gear recommendations" },
      {
        property: "og:description",
        content: "Personalised helmet, jacket, gloves, guards and boots picks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GearPage,
});

const BIKE_TYPES = ["Commuter", "Sport", "Cruiser", "Adventure", "Scooter"];
const RIDING_TYPES = ["City commuting", "Weekend touring", "Track days", "Off-road", "Long distance"];
const LEVELS = ["Beginner", "Intermediate", "Experienced"];
const rupees = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

export function GearTabContent() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const getRecommendation = useServerFn(recommendGear);

  const [bikeType, setBikeType] = useState(BIKE_TYPES[0]!);
  const [ridingType, setRidingType] = useState(RIDING_TYPES[0]!);
  const [experienceLevel, setExperienceLevel] = useState(LEVELS[0]!);
  const [result, setResult] = useState<GearRecommendation | null>(null);

  const prefs = useQuery({
    queryKey: ["gear-preferences"],
    enabled: isConfigured,
    queryFn: async () => {
      const { data, error } = await supabase.from("gear_preferences").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (prefs.data) {
      setBikeType(prefs.data.bike_type);
      setRidingType(prefs.data.riding_type);
      setExperienceLevel(prefs.data.experience_level);
    }
  }, [prefs.data]);

  const run = useMutation({
    mutationFn: async () => {
      if (!isConfigured) {
        return getDemoGearRecommendation({ bikeType, ridingType, experienceLevel });
      }
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("gear_preferences").upsert(
        {
          user_id: userId,
          bike_type: bikeType,
          riding_type: ridingType,
          experience_level: experienceLevel,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      return getRecommendation({ data: { bikeType, ridingType, experienceLevel } });
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["gear-preferences"] });
    },
  });

  const addToCart = useMutation({
    mutationFn: async (productId: string) => {
      if (!isConfigured) {
        demoCart.addProduct(productId);
        return;
      }
      if (!userId) throw new Error("Not signed in");
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("product_id", productId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: userId, product_id: productId, quantity: 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-detail"] });
    },
  });

  const select = (
    label: string,
    value: string,
    options: string[],
    onChange: (v: string) => void,
  ) => (
    <label className="block">
      <span className="text-[13px] font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="grid max-w-5xl gap-5 lg:grid-cols-[300px_1fr]">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Your riding profile</h2>
          </div>
          <div className="mt-4 space-y-3">
            {select("Bike type", bikeType, BIKE_TYPES, setBikeType)}
            {select("Riding type", ridingType, RIDING_TYPES, setRidingType)}
            {select("Experience level", experienceLevel, LEVELS, setExperienceLevel)}
            <button
              type="button"
              onClick={() => run.mutate()}
              disabled={run.isPending}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground disabled:opacity-60"
            >
              {run.isPending ? "Matching gear…" : "Recommend my gear"}
            </button>
            {run.isError ? (
              <p className="text-[13px] text-destructive">
                Couldn&apos;t build recommendations. Please try again.
              </p>
            ) : null}
          </div>
        </section>

        <section>
          {!result ? (
            <p className="text-[13px] text-muted-foreground">
              Pick your profile and we&apos;ll match a helmet, jacket, gloves, guards, boots and any
              other kit you need.
            </p>
          ) : (
            <>
              <p className="text-[13px] text-muted-foreground">{result.summary}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {result.picks.map((pick) => {
                  const product = result.products.find((p) => p.id === pick.productId);
                  if (!product) return null;
                  return (
                    <article
                      key={pick.productId}
                      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          className="h-36 w-full object-cover"
                        />
                      ) : null}
                      <div className="flex flex-1 flex-col p-4">
                        <p className="text-[11px] uppercase tracking-wider text-primary">
                          {product.category}
                        </p>
                        <h3 className="mt-1 text-sm font-bold tracking-tight">{product.name}</h3>
                        <p className="mt-2 flex-1 text-[12px] text-muted-foreground">
                          {pick.reason}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-base font-bold">{rupees(product.price_inr)}</span>
                          <button
                            type="button"
                            onClick={() => addToCart.mutate(product.id)}
                            className="rounded-lg border border-primary px-3 py-1.5 text-[12px] font-semibold text-primary"
                          >
                            Add to cart
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
  );
}

function GearPage() {
  return (
    <AppShell
      title="AI gear recommendations"
      subtitle="Your bike, riding style and experience decide the safety kit we suggest."
    >
      <GearTabContent />
    </AppShell>
  );
}
