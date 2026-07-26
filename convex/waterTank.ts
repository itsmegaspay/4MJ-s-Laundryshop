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

// Get the real-time tank status: usage since last refill vs capacity
export const getTankStatus = query({
  args: {},
  handler: async (ctx) => {
    let config = await ctx.db.query("waterTankStatus").first();

    // Default config if none exists yet (3 tanks, 200L each = 600L total)
    const totalTanks = config?.totalTanks ?? 3;
    const tankCapacityLiters = config?.tankCapacityLiters ?? 200;
    const lastRefillAt = config?.lastRefillAt ?? 0; // 0 = since the beginning

    const totalCapacityLiters = totalTanks * tankCapacityLiters;

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
    const tanksUsed = Math.round((usedLiters / tankCapacityLiters) * 10) / 10; // e.g. 0.6
    const tanksRemaining = Math.round((remainingLiters / tankCapacityLiters) * 10) / 10;
    const percentRemaining = totalCapacityLiters > 0 ? Math.round((remainingLiters / totalCapacityLiters) * 100) : 0;

    // Alert thresholds
    const needsRefillSoon = percentRemaining <= 30 && percentRemaining > 10;
    const needsRefillUrgent = percentRemaining <= 10;

    return {
      totalTanks,
      tankCapacityLiters,
      totalCapacityLiters,
      usedLiters: Math.round(usedLiters),
      remainingLiters: Math.round(remainingLiters),
      tanksUsed,
      tanksRemaining,
      percentRemaining,
      needsRefillSoon,
      needsRefillUrgent,
      lastRefillAt,
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

// Mark tanks as refilled (resets usage tracking to 0)
export const refillTanks = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    const now = Date.now();

    const existing = await ctx.db.query("waterTankStatus").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastRefillAt: now,
        lastRefillBy: currentUser._id,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("waterTankStatus", {
        totalTanks: 3,
        tankCapacityLiters: 200,
        lastRefillAt: now,
        lastRefillBy: currentUser._id,
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      action: "water_tanks_refilled",
      performedBy: currentUser._id,
      performedByEmail: currentUser.email || "",
      performedByName: currentUser.name || "Unknown",
      details: "Water tanks marked as refilled (3 tanks, 600L)",
      timestamp: now,
    });
  },
});

// Update tank configuration (admin only)
export const updateTankConfig = mutation({
  args: {
    totalTanks: v.number(),
    tankCapacityLiters: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (currentUser.role !== "admin") throw new Error("Only administrators can update tank configuration");

    const existing = await ctx.db.query("waterTankStatus").first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        totalTanks: args.totalTanks,
        tankCapacityLiters: args.tankCapacityLiters,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("waterTankStatus", {
        totalTanks: args.totalTanks,
        tankCapacityLiters: args.tankCapacityLiters,
        lastRefillAt: now,
        updatedAt: now,
      });
    }
  },
});
