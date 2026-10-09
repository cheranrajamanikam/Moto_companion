import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { supabase, isConfigured } from "@/integrations/supabase/client";
import { demoCart } from "@/lib/demoData";

export const Route = createFileRoute("/_authenticated/cart")({
  beforeLoad: () => {
    throw redirect({ to: "/shop", search: { tab: "cart" } });
  },
  head: () => ({
    meta: [
      { title: "Your cart — MotoCompanion" },
      {
        name: "description",
        content:
          "Review the riding gear in your MotoCompanion cart, adjust quantities and see your total in rupees.",
      },
      { property: "og:title", content: "Your MotoCompanion cart" },
      { property: "og:description", content: "Riding gear, quantities and totals in rupees." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

const rupees = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

export function CartTabContent({ onBackToShop }: { onBackToShop?: () => void } = {}) {
  const queryClient = useQueryClient();
  const [cartTick, setCartTick] = useState(0);

  const cart = useQuery({
    queryKey: ["cart-detail", cartTick],
    enabled: isConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, product_id, products(id, name, category, price_inr, image_url)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const setQuantity = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (!isConfigured) {
        demoCart.setQuantity(id, quantity);
        setCartTick((t) => t + 1);
        return;
      }
      if (quantity < 1) {
        const { error } = await supabase.from("cart_items").delete().eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-detail"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!isConfigured) {
        demoCart.remove(id);
        setCartTick((t) => t + 1);
        return;
      }
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-detail"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const items = isConfigured
    ? (cart.data ?? [])
    : demoCart.getItems().map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product_id: item.product_id,
        products: item.products,
      }));
  const total = items.reduce(
    (sum, item) => sum + Number(item.products?.price_inr ?? 0) * item.quantity,
    0,
  );

  return (
    <>
      {isConfigured && cart.isLoading ? (
        <p className="text-[13px] text-muted-foreground">Loading cart…</p>
      ) : null}

      {!(isConfigured && cart.isLoading) && items.length === 0 ? (
        <div className="max-w-md rounded-xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">Your cart is empty</p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Browse helmets, jackets, gloves and guards in the gear shop.
          </p>
          {onBackToShop ? (
            <button
              type="button"
              onClick={onBackToShop}
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground"
            >
              Go to shop
            </button>
          ) : (
            <Link
              to="/shop"
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground"
            >
              Go to shop
            </Link>
          )}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="max-w-2xl space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-3"
            >
              {item.products?.image_url ? (
                <img
                  src={item.products.image_url}
                  alt=""
                  loading="lazy"
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.products?.name}</p>
                <p className="text-[12px] text-muted-foreground">
                  {item.products?.category} · {rupees(Number(item.products?.price_inr ?? 0))}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity.mutate({ id: item.id, quantity: item.quantity - 1 })}
                  className="grid h-7 w-7 place-items-center rounded-md border border-border"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity.mutate({ id: item.id, quantity: item.quantity + 1 })}
                  className="grid h-7 w-7 place-items-center rounded-md border border-border"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                aria-label="Remove item"
                onClick={() => remove.mutate(item.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-xl border border-primary bg-card p-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-bold">{rupees(total)}</span>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CartPage() {
  return (
    <AppShell title="Your cart" subtitle="Adjust quantities and check your total before you ride out.">
      <CartTabContent />
    </AppShell>
  );
}
