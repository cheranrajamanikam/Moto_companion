import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type GearInput = {
  bikeType: string;
  ridingType: string;
  experienceLevel: string;
};

export type GearProduct = {
  id: string;
  name: string;
  category: string;
  price_inr: number;
  description: string | null;
  image_url: string | null;
  in_stock: boolean;
};

export type GearRecommendation = {
  summary: string;
  picks: { productId: string; reason: string }[];
  products: GearProduct[];
};

const PRIORITY_CATEGORIES = [
  "Helmet",
  "Jacket",
  "Gloves",
  "Knee Guards",
  "Boots",
  "Elbow Guards",
  "Rain Gear",
];

function createPublicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

function heuristicPicks(products: GearProduct[], input: GearInput) {
  const wantsWaterproof = /tour|rain|monsoon|adventure|long/i.test(input.ridingType);
  const budgetFirst = /begin|new|novice/i.test(input.experienceLevel);
  const picks: { productId: string; reason: string }[] = [];

  for (const category of PRIORITY_CATEGORIES) {
    const inCategory = products
      .filter((p) => p.category === category && p.in_stock)
      .sort((a, b) =>
        budgetFirst ? Number(a.price_inr) - Number(b.price_inr) : Number(b.price_inr) - Number(a.price_inr),
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
  return picks;
}

export const recommendGear = createServerFn({ method: "POST" })
  .inputValidator((data: GearInput) => ({
    bikeType: String(data.bikeType ?? "").slice(0, 60),
    ridingType: String(data.ridingType ?? "").slice(0, 60),
    experienceLevel: String(data.experienceLevel ?? "").slice(0, 60),
  }))
  .handler(async ({ data }): Promise<GearRecommendation> => {
    const supabase = createPublicClient();
    const { data: rows } = await supabase
      .from("products")
      .select("id, name, category, price_inr, description, image_url, in_stock");
    const products = (rows ?? []).map((p) => ({ ...p, price_inr: Number(p.price_inr) }));

    const fallback: GearRecommendation = {
      summary: `A safety-first kit for ${data.experienceLevel.toLowerCase()} riders doing ${data.ridingType.toLowerCase()} rides on a ${data.bikeType.toLowerCase()}.`,
      picks: heuristicPicks(products, data),
      products,
    };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey || products.length === 0) return fallback;

    try {
      const catalogue = products
        .map((p) => `${p.id} | ${p.name} | ${p.category} | Rs ${p.price_inr} | stock:${p.in_stock}`)
        .join("\n");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are a motorcycle safety gear advisor for Indian riders. Pick in-stock products only, one per protective category (helmet, jacket, gloves, knee guards, boots, plus any other relevant safety gear). Reply with JSON only: {\"summary\":string,\"picks\":[{\"productId\":string,\"reason\":string}]}. Reasons must be one short sentence.",
            },
            {
              role: "user",
              content: `Bike type: ${data.bikeType}\nRiding type: ${data.ridingType}\nExperience: ${data.experienceLevel}\n\nCatalogue (id | name | category | price | stock):\n${catalogue}`,
            },
          ],
        }),
      });

      if (!response.ok) return fallback;
      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = payload.choices?.[0]?.message?.content ?? "";
      const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const parsed = JSON.parse(json) as { summary?: string; picks?: { productId: string; reason: string }[] };
      const valid = (parsed.picks ?? []).filter((p) => products.some((x) => x.id === p.productId));
      if (valid.length === 0) return fallback;
      return { summary: parsed.summary ?? fallback.summary, picks: valid, products };
    } catch {
      return fallback;
    }
  });
