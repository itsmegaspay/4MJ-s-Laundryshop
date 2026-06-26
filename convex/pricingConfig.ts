import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getCurrentUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  return user;
}

export const updatePricing = mutation({
  args: {
    regularClothesPrice: v.number(),
    assortedClothesPrice: v.number(),
    towelBlanketsPrice: v.number(),
    comforterPrice: v.number(),
    storageFeePerDay: v.number(),
    selfServiceWashPrice: v.number(),
    selfServiceSpinPrice: v.number(),
    selfServiceDryPrice: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (currentUser.role !== "admin") throw new Error("Only administrators can update pricing");

    const existingConfig = await ctx.db.query("pricingConfig").first();
    const now = Date.now();
    const newPricing: any = {
      regularClothesPrice: args.regularClothesPrice,
      assortedClothesPrice: args.assortedClothesPrice,
      towelBlanketsPrice: args.towelBlanketsPrice,
      comforterPrice: args.comforterPrice,
      storageFeePerDay: args.storageFeePerDay,
      selfServiceWashPrice: args.selfServiceWashPrice,
      selfServiceSpinPrice: args.selfServiceSpinPrice,
      selfServiceDryPrice: args.selfServiceDryPrice,
      currency: "PHP",
      updatedAt: now,
      updatedBy: currentUser._id,
    };

    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, newPricing);
    } else {
      await ctx.db.insert("pricingConfig", newPricing);
    }

    await ctx.db.insert("auditLogs", {
      action: "pricing_updated",
      performedBy: currentUser._id,
      performedByEmail: currentUser.email || "",
      performedByName: currentUser.name || "Unknown",
      details: `Updated pricing: Regular Clothes ₱${args.regularClothesPrice}, Assorted ₱${args.assortedClothesPrice}, Towel & Blankets ₱${args.towelBlanketsPrice}, Comforter ₱${args.comforterPrice}, Storage ₱${args.storageFeePerDay}/day, Wash ₱${args.selfServiceWashPrice}, Spin ₱${args.selfServiceSpinPrice}, Dry ₱${args.selfServiceDryPrice}`,
      timestamp: now,
    });
  },
});

export const getCurrentPricing = query({
  args: {},
  handler: async (ctx) => {
    const config: any = await ctx.db.query("pricingConfig").first();
    return {
      regularClothesPrice: config?.regularClothesPrice ?? 230,
      assortedClothesPrice: config?.assortedClothesPrice ?? 230,
      towelBlanketsPrice: config?.towelBlanketsPrice ?? 230,
      comforterPrice: config?.comforterPrice ?? 250,
      storageFeePerDay: config?.storageFeePerDay ?? 15,
      selfServiceWashPrice: config?.selfServiceWashPrice ?? 80,
      selfServiceSpinPrice: config?.selfServiceSpinPrice ?? 35,
      selfServiceDryPrice: config?.selfServiceDryPrice ?? 120,
      currency: "PHP",
      updatedAt: config?.updatedAt ?? Date.now(),
    };
  },
});

export const calculatePrice = query({
  args: {
    regularClothes: v.optional(v.number()),
    assortedClothes: v.optional(v.number()),
    towelBlankets: v.optional(v.number()),
    comforter: v.optional(v.number()),
    selfServiceWash: v.optional(v.number()),
    selfServiceSpin: v.optional(v.number()),
    selfServiceDry: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const config: any = await ctx.db.query("pricingConfig").first();
    const p = {
      regularClothes: config?.regularClothesPrice ?? 230,
      assortedClothes: config?.assortedClothesPrice ?? 230,
      towelBlankets: config?.towelBlanketsPrice ?? 230,
      comforter: config?.comforterPrice ?? 250,
      selfServiceWash: config?.selfServiceWashPrice ?? 80,
      selfServiceSpin: config?.selfServiceSpinPrice ?? 35,
      selfServiceDry: config?.selfServiceDryPrice ?? 120,
    };
    let total = 0;
    if (args.regularClothes) { total += p.regularClothes * args.regularClothes; }
    if (args.assortedClothes) { total += p.assortedClothes * args.assortedClothes; }
    if (args.towelBlankets) { total += p.towelBlankets * args.towelBlankets; }
    if (args.comforter) { total += p.comforter * args.comforter; }
    if (args.selfServiceWash) { total += p.selfServiceWash * args.selfServiceWash; }
    if (args.selfServiceSpin) { total += p.selfServiceSpin * args.selfServiceSpin; }
    if (args.selfServiceDry) { total += p.selfServiceDry * args.selfServiceDry; }
    return { totalPrice: total };
  },
});
