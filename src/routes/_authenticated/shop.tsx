import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, PackageOpen, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { TabBar } from "@/components/app/TabBar";
import { Button } from "@/components/ui/button";
import { CartTabContent } from "@/routes/_authenticated/cart";
import { GearTabContent } from "@/routes/_authenticated/gear";
import { supabase, isConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_PRODUCTS, demoCart } from "@/lib/demoData";

const SHOP_TABS = [
  { id: "shop", label: "Shop" },
  { id: "gear", label: "Gear AI" },
  { id: "cart", label: "Cart" },
] as const;

type ShopTabId = (typeof SHOP_TABS)[number]["id"];

function parseShopTab(tab: unknown): ShopTabId {
  if (tab === "gear" || tab === "cart" || tab === "shop") return tab;
  return "shop";
}

export const Route = createFileRoute("/_authenticated/shop")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: parseShopTab(search.tab),
  }),
  head: () => ({
    meta: [
      { title: "Shop & Gear — MotoCompanion" },
      {
        name: "description",
        content:
          "Shop motorcycle helmets, jackets, gloves, guards and boots in rupees, with personalised AI gear guidance.",
      },
      { property: "og:title", content: "MotoCompanion riding gear shop" },
      {
        property: "og:description",
        content: "Protective riding gear in INR with personalised recommendations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

const rupees = (value: number) => `₹${Number(value).toLocaleString("en-IN")}`;

function ShopPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ShopTabId>(tab);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  const setTab = (id: string) => {
    const next = parseShopTab(id);
    setActiveTab(next);
    navigate({
      to: "/shop",
      search: next === "shop" ? {} : { tab: next },
      replace: true,
    });
  };

  return (
    <AppShell
      title="Shop & Gear"
      subtitle="Certified protection for Indian roads, weather and riding conditions."
    >
      <TabBar tabs={SHOP_TABS} activeTab={activeTab} onChange={setTab} />
      <div className="animate-page-in">
        {activeTab === "shop" ? <ShopTabContent onOpenCart={() => setTab("cart")} onOpenGear={() => setTab("gear")} /> : null}
        {activeTab === "gear" ? <GearTabContent /> : null}
        {activeTab === "cart" ? <CartTabContent onBackToShop={() => setTab("shop")} /> : null}
      </div>
    </AppShell>
  );
}

export function ShopTabContent({
  onOpenCart,
  onOpenGear,
}: {
  onOpenCart: () => void;
  onOpenGear: () => void;
}) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("All");
  const [addedId, setAddedId] = useState<string | null>(null);
  const [cartTick, setCartTick] = useState(0);

  const products = useQuery({
    queryKey: ["products"],
    enabled: isConfigured,
    initialData: isConfigured ? undefined : DEMO_PRODUCTS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("category")
        .order("price_inr");
      if (error) throw error;
      return data ?? [];
    },
  });
  const cart = useQuery({
    queryKey: ["cart", cartTick],
    enabled: isConfigured,
    queryFn: async () => {
      const { data, error } = await supabase.from("cart_items").select("product_id, quantity");
      if (error) throw error;
      return data ?? [];
    },
  });
  const addToCart = useMutation({
    mutationFn: async (productId: string) => {
      if (!isConfigured) {
        demoCart.addProduct(productId);
        setCartTick((t) => t + 1);
        return productId;
      }
      if (!userId) throw new Error("Not signed in");
      const existing = cart.data?.find((item) => item.product_id === productId);
      const result = existing
        ? await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + 1 })
            .eq("user_id", userId)
            .eq("product_id", productId)
        : await supabase
            .from("cart_items")
            .insert({ user_id: userId, product_id: productId, quantity: 1 });
      if (result.error) throw result.error;
      return productId;
    },
    onSuccess: (productId) => {
      setAddedId(productId);
      window.setTimeout(
        () => setAddedId((current) => (current === productId ? null : current)),
        1600,
      );
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-detail"] });
    },
  });

  const categories = ["All", ...new Set((products.data ?? []).map((product) => product.category))];
  const visible = (products.data ?? []).filter(
    (product) => category === "All" || product.category === category,
  );
  const cartCount = isConfigured
    ? (cart.data ?? []).reduce((total, item) => total + item.quantity, 0)
    : demoCart.getItems().reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="max-w-6xl">
      <section className="relative mb-6 overflow-hidden rounded-[14px] border border-primary/30 bg-card p-5 sm:p-6">
        <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">Not sure what protection fits your ride?</h2>
            <p className="mt-1 max-w-xl text-[12px] text-muted-foreground">
              Tell us your bike, riding style and experience. We&apos;ll match a complete safety kit
              from the shop.
            </p>
          </div>
          <Button type="button" className="shrink-0" onClick={onOpenGear}>
            Get my recommendations
          </Button>
        </div>
      </section>

      <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {categories.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={category === item ? "default" : "outline"}
            onClick={() => setCategory(item)}
          >
            {item}
          </Button>
        ))}
        <Button type="button" size="sm" variant="outline" className="ml-auto" onClick={onOpenCart}>
          <ShoppingCart /> Cart{" "}
          <span className="grid min-w-5 place-items-center rounded-full bg-secondary px-1 text-[10px]">
            {cartCount}
          </span>
        </Button>
      </div>

      {isConfigured && products.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-80 animate-pulse rounded-[14px] bg-secondary" />
          ))}
        </div>
      ) : null}
      {!(isConfigured && products.isLoading) && visible.length === 0 ? (
        <div className="grid min-h-64 place-items-center rounded-[14px] border border-dashed border-border text-center">
          <div>
            <PackageOpen className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">No gear in this category</p>
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((product) => (
          <article
            key={product.id}
            className="group flex flex-col overflow-hidden rounded-[14px] border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_8px_24px_rgba(255,107,0,0.12)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <PackageOpen className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
              )}
              <span
                className={`absolute right-3 top-3 rounded-sm px-2 py-1 text-[10px] font-bold uppercase ${product.in_stock ? "bg-card text-success" : "bg-destructive text-destructive-foreground"}`}
              >
                {product.in_stock ? "In stock" : "Sold out"}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {product.category}
              </p>
              <h2 className="mt-1 text-base">{product.name}</h2>
              <p className="mt-2 line-clamp-2 flex-1 text-[12px] leading-relaxed text-muted-foreground">
                {product.description}
              </p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Inclusive of taxes</p>
                  <p className="text-xl font-bold">{rupees(product.price_inr)}</p>
                </div>
                <Button
                  type="button"
                  disabled={!product.in_stock || addToCart.isPending}
                  onClick={() => addToCart.mutate(product.id)}
                  className="min-w-29"
                >
                  {addedId === product.id ? (
                    <>
                      <Check /> Added
                    </>
                  ) : (
                    <>
                      <ShoppingCart /> Add
                    </>
                  )}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {addToCart.isError ? (
        <p role="alert" className="mt-4 text-[12px] text-destructive">
          Couldn&apos;t add that item. Please try again.
        </p>
      ) : null}
    </div>
  );
}
