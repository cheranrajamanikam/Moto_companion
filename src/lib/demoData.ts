import type { GearProduct } from "@/lib/gear.functions";

export const DEMO_POSTS = [
  {
    id: "demo-post-1",
    user_id: "demo-user-1",
    user_name: "RE Riders Bengaluru",
    content:
      "Sunday morning ride to Nandi Hills — 50 riders confirmed, 350cc+ only, 6AM from Silk Board 🏍️",
    image_url: null as string | null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-post-2",
    user_id: "demo-user-2",
    user_name: "Vikram S.",
    content:
      "NH275 Madikeri stretch has loose gravel after last night's rain — ride carefully near km 45 ⚠️",
    image_url: null as string | null,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-post-3",
    user_id: "demo-user-3",
    user_name: "Rahul M.",
    content:
      "Just earned the Hill Conqueror badge after completing the Ladakh circuit! 2,847km in 12 days 🏔️",
    image_url: null as string | null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_EMERGENCY_CONTACTS = [
  {
    id: "demo-ec-1",
    user_id: "mock-user-001",
    contact_name: "Mom",
    phone_number: "+91 98765 43210",
    relationship: "Mother",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-ec-2",
    user_id: "mock-user-001",
    contact_name: "Dad",
    phone_number: "+91 98765 43211",
    relationship: "Father",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-ec-3",
    user_id: "mock-user-001",
    contact_name: "Ride Partner",
    phone_number: "+91 98765 43212",
    relationship: "Riding buddy",
    created_at: new Date().toISOString(),
  },
];

export const DEMO_EVENTS = [
  {
    id: "demo-event-1",
    title: "Nandi Hills Sunrise Ride",
    description: "Early morning group ride to Nandi Hills. Meet at Silk Board flyover, 5:30 AM.",
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Silk Board, Bengaluru",
    image_url: null as string | null,
  },
  {
    id: "demo-event-2",
    title: "Monsoon Safety Clinic",
    description: "Free workshop on wet-weather riding, tyre checks, and emergency braking.",
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Indiranagar, Bengaluru",
    image_url: null as string | null,
  },
  {
    id: "demo-event-3",
    title: "Mysuru Weekend Tour",
    description: "Two-day tour via NH275 with breakfast stop at Srirangapatna.",
    event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Hebbal, Bengaluru",
    image_url: null as string | null,
  },
];

export const DEMO_LEADERBOARD = [
  {
    id: "demo-lb-1",
    user_id: "mock-user-001",
    rider_name: "Arjun Kumar",
    points: 2840,
    safe_rides: 38,
    challenge_name: "Smooth Riding Challenge",
    week: "Week 37",
  },
  {
    id: "demo-lb-2",
    user_id: "demo-user-2",
    rider_name: "Priya Sundaram",
    points: 2650,
    safe_rides: 34,
    challenge_name: "Smooth Riding Challenge",
    week: "Week 37",
  },
  {
    id: "demo-lb-3",
    user_id: "demo-user-3",
    rider_name: "Vikramaditya Rao",
    points: 2410,
    safe_rides: 31,
    challenge_name: "Smooth Riding Challenge",
    week: "Week 37",
  },
  {
    id: "demo-lb-4",
    user_id: "demo-user-4",
    rider_name: "Ananya Deshmukh",
    points: 1980,
    safe_rides: 22,
    challenge_name: "Smooth Riding Challenge",
    week: "Week 37",
  },
];

export const DEMO_PRODUCTS: GearProduct[] = [
  {
    id: "demo-prod-1",
    name: "AGV K3 SV Helmet",
    category: "Helmet",
    price_inr: 12999,
    description: "ECE 22.06 certified full-face helmet with anti-scratch visor.",
    image_url: null,
    in_stock: true,
  },
  {
    id: "demo-prod-2",
    name: "Rynox Tornado Pro Jacket",
    category: "Jacket",
    price_inr: 8499,
    description: "CE Level 2 armour, waterproof touring jacket for monsoon rides.",
    image_url: null,
    in_stock: true,
  },
  {
    id: "demo-prod-3",
    name: "Rynox Storm Evo Gloves",
    category: "Gloves",
    price_inr: 2499,
    description: "Touchscreen-compatible riding gloves with knuckle protection.",
    image_url: null,
    in_stock: true,
  },
  {
    id: "demo-prod-4",
    name: "Rynox Air GT Knee Guards",
    category: "Knee Guards",
    price_inr: 1899,
    description: "Ventilated CE-certified knee guards for daily commuting.",
    image_url: null,
    in_stock: true,
  },
  {
    id: "demo-prod-5",
    name: "Forma Adventure Boots",
    category: "Boots",
    price_inr: 11499,
    description: "Adventure touring boots with ankle protection and waterproof lining.",
    image_url: null,
    in_stock: true,
  },
  {
    id: "demo-prod-6",
    name: "Rynox Elbow Guards",
    category: "Elbow Guards",
    price_inr: 1599,
    description: "Lightweight elbow protection for city and highway riding.",
    image_url: null,
    in_stock: true,
  },
];

const DEMO_CART_KEY = "mc_demo_cart";

export type DemoCartItem = {
  id: string;
  product_id: string;
  quantity: number;
  products: GearProduct;
};

export const demoCart = {
  getItems(): DemoCartItem[] {
    try {
      const raw = localStorage.getItem(DEMO_CART_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as DemoCartItem[];
    } catch {
      return [];
    }
  },

  saveItems(items: DemoCartItem[]) {
    localStorage.setItem(DEMO_CART_KEY, JSON.stringify(items));
  },

  addProduct(productId: string) {
    const product = DEMO_PRODUCTS.find((p) => p.id === productId);
    if (!product) return;
    const items = this.getItems();
    const existing = items.find((i) => i.product_id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({
        id: `demo-cart-${productId}`,
        product_id: productId,
        quantity: 1,
        products: product,
      });
    }
    this.saveItems(items);
  },

  setQuantity(id: string, quantity: number) {
    let items = this.getItems();
    if (quantity < 1) {
      items = items.filter((i) => i.id !== id);
    } else {
      items = items.map((i) => (i.id === id ? { ...i, quantity } : i));
    }
    this.saveItems(items);
  },

  remove(id: string) {
    this.saveItems(this.getItems().filter((i) => i.id !== id));
  },

  getSummary() {
    return this.getItems().map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
  },
};

const PRIORITY_CATEGORIES = [
  "Helmet",
  "Jacket",
  "Gloves",
  "Knee Guards",
  "Boots",
  "Elbow Guards",
];

export function getDemoGearRecommendation(input: {
  bikeType: string;
  ridingType: string;
  experienceLevel: string;
}) {
  const wantsWaterproof = /tour|rain|monsoon|adventure|long/i.test(input.ridingType);
  const budgetFirst = /begin|new|novice/i.test(input.experienceLevel);
  const picks: { productId: string; reason: string }[] = [];

  for (const category of PRIORITY_CATEGORIES) {
    const inCategory = DEMO_PRODUCTS.filter((p) => p.category === category && p.in_stock).sort(
      (a, b) =>
        budgetFirst ? a.price_inr - b.price_inr : b.price_inr - a.price_inr,
    );
    const chosen =
      (wantsWaterproof
        ? inCategory.find((p) => /waterproof|rain|touring|monsoon/i.test(p.description ?? ""))
        : undefined) ?? inCategory[0];
    if (chosen) {
      picks.push({
        productId: chosen.id,
        reason: `${category} suited to ${input.ridingType.toLowerCase()} riding on a ${input.bikeType.toLowerCase()}.`,
      });
    }
  }

  return {
    summary: `A safety-first kit for ${input.experienceLevel.toLowerCase()} riders doing ${input.ridingType.toLowerCase()} rides on a ${input.bikeType.toLowerCase()}.`,
    picks,
    products: DEMO_PRODUCTS,
  };
}
