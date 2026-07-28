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

// Water usage per service type (liters per load/session)
const WATER_PER_SERVICE: Record<string, number> = {
  regularClothes: 50, assortedClothes: 50, clothes: 50,
  towelBlankets: 60, blanketsLight: 60,
  comforter: 70, blanketsThick: 70,
  selfServiceWash: 45, selfServiceSpin: 5, selfServiceDry: 0,
};

// Get the real-time drum status: usage since last refill vs capacity
export const getDrumStatus = query({
  args: {},
  handler: async (ctx) => {
    let config = await ctx.db.query("waterDrumStatus").first();

    // Default config if none exists yet (12 drums, 200L each = 2400L total)
    const totalDrums = config?.totalDrums ?? 12;
    const drumCapacityLiters = config?.drumCapacityLiters ?? 200;
    const lastRefillAt = config?.lastRefillAt ?? 0; // 0 = since the beginning

    const totalCapacityLiters = totalDrums * drumCapacityLiters;

    // Sum water used by all orders created since the last refill
    const orders = await ctx.db
      .query("laundryOrders")
      .withIndex("by_created_at", (q) => q.gte("createdAt", lastRefillAt))
      .collect();

    let usedLiters = 0;
    const usedByService: Record<string, number> = {};

    orders.forEach((o) => {
      if (o.isDeleted || o.status === "cancelled") return;
      const ot = o.orderType as any;
      const w = o.weight as any;
      // Only count water for orders that have actually been processed (weight recorded)
      if (!w) return;
      Object.entries(WATER_PER_SERVICE).forEach(([key, litersPerLoad]) => {
        if (ot?.[key] && w?.[key]) {
          const used = litersPerLoad * w[key];
          usedByService[key] = (usedByService[key] || 0) + used;
          usedLiters += used;
        }
      });
    });

    const remainingLiters = Math.max(0, totalCapacityLiters - usedLiters);
    const drumsUsed = Math.round((usedLiters / drumCapacityLiters) * 10) / 10; // e.g. 0.6
    // Derive drumsRemaining from drumsUsed (not independently rounded) so the two
    // always sum exactly to totalDrums instead of drifting apart from rounding.
    const drumsRemaining = Math.round((totalDrums - drumsUsed) * 10) / 10;
    const percentRemaining = totalCapacityLiters > 0 ? Math.round((remainingLiters / totalCapacityLiters) * 100) : 0;

    // Alert thresholds
    const needsRefillSoon = percentRemaining <= 30 && percentRemaining > 10;
    const needsRefillUrgent = percentRemaining <= 10;

    return {
      totalDrums,
      drumCapacityLiters,
      totalCapacityLiters,
      usedLiters: Math.round(usedLiters),
      remainingLiters: Math.round(remainingLiters),
      drumsUsed,
      drumsRemaining,
      percentRemaining,
      needsRefillSoon,
      needsRefillUrgent,
      lastRefillAt,
      // Exposed so the UI can calculate exact water needs for a given order
      // without duplicating/hardcoding these rates on the client.
      ratesPerService: {
        regularClothes: WATER_PER_SERVICE.regularClothes,
        assortedClothes: WATER_PER_SERVICE.assortedClothes,
        towelBlankets: WATER_PER_SERVICE.towelBlankets,
        comforter: WATER_PER_SERVICE.comforter,
        selfServiceWash: WATER_PER_SERVICE.selfServiceWash,
        selfServiceSpin: WATER_PER_SERVICE.selfServiceSpin,
        selfServiceDry: WATER_PER_SERVICE.selfServiceDry,
      },
      usedByService: {
        regularClothes: Math.round(usedByService.regularClothes || usedByService.clothes || 0),
        assortedClothes: Math.round(usedByService.assortedClothes || 0),
        towelBlankets: Math.round(usedByService.towelBlankets || usedByService.blanketsLight || 0),
        comforter: Math.round(usedByService.comforter || usedByService.blanketsThick || 0),
        selfServiceWash: Math.round(usedByService.selfServiceWash || 0),
        selfServiceSpin: Math.round(usedByService.selfServiceSpin || 0),
      },
    };
  },
});

// Mark drums as refilled (resets usage tracking to 0)
export const refillDrums = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    const now = Date.now();

    const existing = await ctx.db.query("waterDrumStatus").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastRefillAt: now,
        lastRefillBy: currentUser._id,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("waterDrumStatus", {
        totalDrums: 12,
        drumCapacityLiters: 200,
        lastRefillAt: now,
        lastRefillBy: currentUser._id,
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      action: "water_drums_refilled",
      performedBy: currentUser._id,
      performedByEmail: currentUser.email || "",
      performedByName: currentUser.name || "Unknown",
      details: "Water drums marked as refilled (12 drums, 2400L)",
      timestamp: now,
    });
  },
});

// Update drum configuration (admin only)
export const updateDrumConfig = mutation({
  args: {
    totalDrums: v.number(),
    drumCapacityLiters: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (currentUser.role !== "admin") throw new Error("Only administrators can update drum configuration");

    const existing = await ctx.db.query("waterDrumStatus").first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        totalDrums: args.totalDrums,
        drumCapacityLiters: args.drumCapacityLiters,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("waterDrumStatus", {
        totalDrums: args.totalDrums,
        drumCapacityLiters: args.drumCapacityLiters,
        lastRefillAt: now,
        updatedAt: now,
      });
    }
  },
});
