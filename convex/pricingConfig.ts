import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getCurrentUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  let currentUser = await ctx.db.get(userId);
  if (!currentUser || !currentUser.email) {
    const identity = await ctx.auth.getUserIdentity();
    await ctx.db.patch(userId, {
      email: identity?.email || "unknown@example.com",
      name: currentUser?.name || identity?.name || identity?.email?.split("@")[0] || "User",
      role: currentUser?.role || "staff",
      createdAt: currentUser?.createdAt || Date.now(),
    });
    currentUser = await ctx.db.get(userId);
  }
  if (!currentUser) throw new Error("Failed to get user");
  return currentUser;
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
    const details = `Updated pricing: Regular Clothes ₱${args.regularClothesPrice}, Assorted ₱${args.assortedClothesPrice}, Towel & Blankets ₱${args.towelBlanketsPrice}, Comforter ₱${args.comforterPrice}, Storage ₱${args.storageFeePerDay}/day, Wash ₱${args.selfServiceWashPrice}, Spin ₱${args.selfServiceSpinPrice}, Dry ₱${args.selfServiceDryPrice}`;

    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        regularClothesPrice: args.regularClothesPrice,
        assortedClothesPrice: args.assortedClothesPrice,
        towelBlanketsPrice: args.towelBlanketsPrice,
        comforterPrice: args.comforterPrice,
        storageFeePerDay: args.storageFeePerDay,
        selfServiceWashPrice: args.selfServiceWashPrice,
        selfServiceSpinPrice: args.selfServiceSpinPrice,
        selfServiceDryPrice: args.selfServiceDryPrice,
        updatedAt: now,
        updatedBy: currentUser._id,
      });
    } else {
      await ctx.db.insert("pricingConfig", {
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
      });
    }

    await ctx.db.insert("auditLogs", {
      action: "pricing_updated",
      performedBy: currentUser._id,
      performedByEmail: currentUser.email,
      performedByName: currentUser.name || "Unknown",
      details,
      timestamp: now,
    });
  },
});

export const getCurrentPricing = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("pricingConfig").first();
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
    regularClothes: v.optional(v.boolean()),
    assortedClothes: v.optional(v.boolean()),
    towelBlankets: v.optional(v.boolean()),
    comforter: v.optional(v.boolean()),
    selfServiceWash: v.optional(v.number()),
    selfServiceSpin: v.optional(v.number()),
    selfServiceDry: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.query("pricingConfig").first();
    const p = {
      regularClothes: config?.regularClothesPrice ?? 230,
      assortedClothes: config?.assortedClothesPrice ?? 230,
      towelBlankets: config?.towelBlanketsPrice ?? 230,
      comforter: config?.comforterPrice ?? 250,
      selfServiceWash: config?.selfServiceWashPrice ?? 80,
      selfServiceSpin: config?.selfServiceSpinPrice ?? 35,
      selfServiceDry: config?.selfServiceDryPrice ?? 120,
    };

    let totalPrice = 0;
    const breakdown: any = {};

    if (args.regularClothes) { breakdown.regularClothesPrice = p.regularClothes; totalPrice += p.regularClothes; }
    if (args.assortedClothes) { breakdown.assortedClothesPrice = p.assortedClothes; totalPrice += p.assortedClothes; }
    if (args.towelBlankets) { breakdown.towelBlanketsPrice = p.towelBlankets; totalPrice += p.towelBlankets; }
    if (args.comforter) { breakdown.comforterPrice = p.comforter; totalPrice += p.comforter; }
    if (args.selfServiceWash) { breakdown.selfServiceWashPrice = p.selfServiceWash * args.selfServiceWash; totalPrice += breakdown.selfServiceWashPrice; }
    if (args.selfServiceSpin) { breakdown.selfServiceSpinPrice = p.selfServiceSpin * args.selfServiceSpin; totalPrice += breakdown.selfServiceSpinPrice; }
    if (args.selfServiceDry) { breakdown.selfServiceDryPrice = p.selfServiceDry * args.selfServiceDry; totalPrice += breakdown.selfServiceDryPrice; }

    return { ...breakdown, totalPrice };
  },
});
