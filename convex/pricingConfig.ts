import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper function to get current user
async function getCurrentUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  let currentUser = await ctx.db.get(userId);
  
  // If user doesn't have required fields, sync them
  if (!currentUser || !currentUser.email) {
    const identity = await ctx.auth.getUserIdentity();
    
    // Update user with identity info
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

// Initialize or update pricing configuration
export const updatePricing = mutation({
  args: {
    clothesPricePerKg: v.number(),
    blanketsLightPricePerKg: v.number(),
    blanketsThickPricePerKg: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Only admin can update pricing
    if (currentUser.role !== "admin") {
      throw new Error("Only administrators can update pricing");
    }

    // Validate prices
    if (
      args.clothesPricePerKg <= 0 ||
      args.blanketsLightPricePerKg <= 0 ||
      args.blanketsThickPricePerKg <= 0
    ) {
      throw new Error("Prices must be greater than zero");
    }

    const existingConfig = await ctx.db.query("pricingConfig").first();

    const now = Date.now();

    if (existingConfig) {
      // Update existing config
      const oldValues = {
        clothesPricePerKg: existingConfig.clothesPricePerKg,
        blanketsLightPricePerKg: existingConfig.blanketsLightPricePerKg,
        blanketsThickPricePerKg: existingConfig.blanketsThickPricePerKg,
      };

      await ctx.db.patch(existingConfig._id, {
        clothesPricePerKg: args.clothesPricePerKg,
        blanketsLightPricePerKg: args.blanketsLightPricePerKg,
        blanketsThickPricePerKg: args.blanketsThickPricePerKg,
        updatedAt: now,
        updatedBy: currentUser._id,
      });

      // Log the action
      await ctx.db.insert("auditLogs", {
        action: "pricing_updated",
        performedBy: currentUser._id,
        performedByEmail: currentUser.email,
        performedByName: currentUser.name || "Unknown",
        details: `Updated pricing: Clothes ₱${args.clothesPricePerKg}/kg, Light Blankets ₱${args.blanketsLightPricePerKg}/kg, Thick Blankets ₱${args.blanketsThickPricePerKg}/kg`,
        metadata: {
          oldValues,
          newValues: {
            clothesPricePerKg: args.clothesPricePerKg,
            blanketsLightPricePerKg: args.blanketsLightPricePerKg,
            blanketsThickPricePerKg: args.blanketsThickPricePerKg,
          },
        },
        timestamp: now,
      });

      return existingConfig._id;
    } else {
      // Create new config
      const configId = await ctx.db.insert("pricingConfig", {
        clothesPricePerKg: args.clothesPricePerKg,
        blanketsLightPricePerKg: args.blanketsLightPricePerKg,
        blanketsThickPricePerKg: args.blanketsThickPricePerKg,
        currency: "PHP",
        updatedAt: now,
        updatedBy: currentUser._id,
      });

      // Log the action
      await ctx.db.insert("auditLogs", {
        action: "pricing_created",
        performedBy: currentUser._id,
        performedByEmail: currentUser.email,
        performedByName: currentUser.name || "Unknown",
        details: `Created pricing: Clothes ₱${args.clothesPricePerKg}/kg, Light Blankets ₱${args.blanketsLightPricePerKg}/kg, Thick Blankets ₱${args.blanketsThickPricePerKg}/kg`,
        timestamp: now,
      });

      return configId;
    }
  },
});

// Get current pricing configuration
export const getCurrentPricing = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("pricingConfig").first();

    // Return default pricing if not configured yet
    if (!config) {
      return {
        clothesPricePerKg: 30,
        blanketsLightPricePerKg: 50,
        blanketsThickPricePerKg: 60,
        currency: "PHP",
        updatedAt: Date.now(),
      };
    }

    return config;
  },
});

// Calculate price based on weight
export const calculatePrice = query({
  args: {
    clothesWeight: v.optional(v.number()),
    blanketsLightWeight: v.optional(v.number()),
    blanketsThickWeight: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pricing = await ctx.db.query("pricingConfig").first();

    const clothesPrice = pricing?.clothesPricePerKg || 50;
    const blanketsLightPrice = pricing?.blanketsLightPricePerKg || 70;
    const blanketsThickPrice = pricing?.blanketsThickPricePerKg || 100;

    let totalPrice = 0;
    const breakdown = {
      clothesPrice: 0,
      blanketsLightPrice: 0,
      blanketsThickPrice: 0,
    };

    if (args.clothesWeight) {
      breakdown.clothesPrice = args.clothesWeight * clothesPrice;
      totalPrice += breakdown.clothesPrice;
    }

    if (args.blanketsLightWeight) {
      breakdown.blanketsLightPrice = args.blanketsLightWeight * blanketsLightPrice;
      totalPrice += breakdown.blanketsLightPrice;
    }

    if (args.blanketsThickWeight) {
      breakdown.blanketsThickPrice = args.blanketsThickWeight * blanketsThickPrice;
      totalPrice += breakdown.blanketsThickPrice;
    }

    return {
      ...breakdown,
      totalPrice,
      pricePerKg: {
        clothes: clothesPrice,
        blanketsLight: blanketsLightPrice,
        blanketsThick: blanketsThickPrice,
      },
    };
  },
}); 