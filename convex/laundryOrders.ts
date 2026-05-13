import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper function to get or create current user
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

// Generate unique order ID - can be called independently
export const generateOrderId = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;

    // Get today's orders to determine the next sequence number
    const todayStart = new Date(year, now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const todayOrders = await ctx.db
      .query("laundryOrders")
      .withIndex("by_created_at")
      .filter((q: any) =>
        q.and(
          q.gte(q.field("createdAt"), todayStart),
          q.lt(q.field("createdAt"), todayEnd)
        )
      )
      .collect();

    const sequence = todayOrders.length + 1;
    const sequenceStr = String(sequence).padStart(3, "0");

    return `LND-${dateStr}-${sequenceStr}`;
  },
});

// Create a new laundry order
export const createOrder = mutation({
  args: {
    customerId: v.id("customers"),
    orderType: v.object({
      clothes: v.boolean(),
      blanketsLight: v.boolean(),
      blanketsThick: v.boolean(),
    }),
    notes: v.optional(v.string()),
    expectedPickupDate: v.optional(v.number()),
    orderId: v.optional(v.string()), // Allow passing in a pre-generated orderId
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Validate order type
    if (!args.orderType.clothes && !args.orderType.blanketsLight && !args.orderType.blanketsThick) {
      throw new Error("At least one order type must be selected");
    }

    // Verify customer exists
    const customer = await ctx.db.get(args.customerId);
    if (!customer || !customer.isActive) {
      throw new Error("Customer not found");
    }

    const now = Date.now();
    
    // Use provided orderId or generate a new one
    let orderId = args.orderId;
    if (!orderId) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, "0");
      const day = String(new Date().getDate()).padStart(2, "0");
      const dateStr = `${year}${month}${day}`;

      const todayStart = new Date(year, new Date().getMonth(), new Date().getDate()).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000;

      const todayOrders = await ctx.db
        .query("laundryOrders")
        .withIndex("by_created_at")
        .filter((q: any) =>
          q.and(
            q.gte(q.field("createdAt"), todayStart),
            q.lt(q.field("createdAt"), todayEnd)
          )
        )
        .collect();

      const sequence = todayOrders.length + 1;
      const sequenceStr = String(sequence).padStart(3, "0");
      orderId = `LND-${dateStr}-${sequenceStr}`;
    }

    const orderDocId = await ctx.db.insert("laundryOrders", {
      orderId,
      customerId: args.customerId,
      orderType: args.orderType,
      status: "pending",
      paymentStatus: "unpaid",
      expectedPickupDate: args.expectedPickupDate,
      notes: args.notes,
      createdAt: now,
      createdBy: currentUser._id,
      updatedAt: now,
      updatedBy: currentUser._id,
      isDeleted: false,
    });

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "laundry_created",
      performedBy: currentUser._id,
      performedByEmail: currentUser.email,
      performedByName: currentUser.name || "Unknown",
      targetOrderId: orderDocId,
      targetCustomerId: args.customerId,
      details: `Created order ${orderId} for ${customer.name}`,
      metadata: {
        newValues: {
          orderId,
          orderType: args.orderType,
          status: "pending",
        },
      },
      timestamp: now,
    });

    return { orderDocId, orderId, customer };
  },
});

// Update order status
export const updateOrderStatus = mutation({
  args: {
    orderDocId: v.id("laundryOrders"),
    newStatus: v.union(
      v.literal("pending"),
      v.literal("in-progress"),
      v.literal("ready"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    weight: v.optional(
      v.object({
        clothes: v.optional(v.number()),
        blanketsLight: v.optional(v.number()),
        blanketsThick: v.optional(v.number()),
      })
    ),
    cancellationReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const order = await ctx.db.get(args.orderDocId);
    if (!order) throw new Error("Order not found");
    if (order.isDeleted) throw new Error("Order has been deleted");

    const oldStatus = order.status;
    const now = Date.now();

    // Prepare update object
    const updates: Partial<Doc<"laundryOrders">> = {
      status: args.newStatus,
      updatedAt: now,
      updatedBy: currentUser._id,
    };

    // Track timestamp based on new status
    if (args.newStatus === "in-progress" && !order.inProgressAt) {
      updates.inProgressAt = now;
    }

    // If marking as ready, validate and calculate pricing
    if (args.newStatus === "ready") {
      if (!order.readyAt) {
        updates.readyAt = now;
      }

      if (!args.weight || (!args.weight.clothes && !args.weight.blanketsLight && !args.weight.blanketsThick)) {
        throw new Error("Weight is required when marking order as ready");
      }

      // Get pricing config
      const pricing = await ctx.db.query("pricingConfig").first();
      const clothesPrice = pricing?.clothesPricePerKg || 50;
      const blanketsLightPrice = pricing?.blanketsLightPricePerKg || 70;
      const blanketsThickPrice = pricing?.blanketsThickPricePerKg || 100;

      let totalPrice = 0;
      const priceBreakdown: any = {};

      if (args.weight.clothes && order.orderType.clothes) {
        priceBreakdown.clothesPrice = args.weight.clothes * clothesPrice;
        totalPrice += priceBreakdown.clothesPrice;
      }

      if (args.weight.blanketsLight && order.orderType.blanketsLight) {
        priceBreakdown.blanketsLightPrice = args.weight.blanketsLight * blanketsLightPrice;
        totalPrice += priceBreakdown.blanketsLightPrice;
      }

      if (args.weight.blanketsThick && order.orderType.blanketsThick) {
        priceBreakdown.blanketsThickPrice = args.weight.blanketsThick * blanketsThickPrice;
        totalPrice += priceBreakdown.blanketsThickPrice;
      }

      updates.weight = args.weight;
      updates.pricing = {
        ...priceBreakdown,
        totalPrice,
      };
    }

    // If marking as completed
    if (args.newStatus === "completed") {
      updates.completedAt = now;
      updates.actualPickupDate = now;
    }

    // If cancelling
    if (args.newStatus === "cancelled") {
      updates.cancelledAt = now;
      updates.cancellationReason = args.cancellationReason;
    }

    await ctx.db.patch(args.orderDocId, updates);

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "laundry_status_updated",
      performedBy: currentUser._id,
      performedByEmail: currentUser.email,
      performedByName: currentUser.name || "Unknown",
      targetOrderId: args.orderDocId,
      details: `Updated order ${order.orderId} status from ${oldStatus} to ${args.newStatus}`,
      metadata: {
        oldValues: { status: oldStatus },
        newValues: { status: args.newStatus, ...updates },
      },
      timestamp: now,
    });

    return args.orderDocId;
  },
});

// Update payment status
export const updatePaymentStatus = mutation({
  args: {
    orderDocId: v.id("laundryOrders"),
    paymentStatus: v.union(v.literal("paid"), v.literal("unpaid")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const order = await ctx.db.get(args.orderDocId);
    if (!order) throw new Error("Order not found");

    const oldPaymentStatus = order.paymentStatus;
    const now = Date.now();

    const updates: Partial<Doc<"laundryOrders">> = {
      paymentStatus: args.paymentStatus,
      updatedAt: now,
      updatedBy: currentUser._id,
    };

    if (args.paymentStatus === "paid") {
      updates.paidAt = now;
    }

    await ctx.db.patch(args.orderDocId, updates);

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "laundry_payment_updated",
      performedBy: currentUser._id,
      performedByEmail: currentUser.email,
      performedByName: currentUser.name || "Unknown",
      targetOrderId: args.orderDocId,
      details: `Updated order ${order.orderId} payment status from ${oldPaymentStatus} to ${args.paymentStatus}`,
      metadata: {
        oldValues: { paymentStatus: oldPaymentStatus },
        newValues: { paymentStatus: args.paymentStatus },
      },
      timestamp: now,
    });

    return args.orderDocId;
  },
});

// Soft delete an order (admin only)
export const deleteOrder = mutation({
  args: {
    orderDocId: v.id("laundryOrders"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Only admin can delete
    if (currentUser.role !== "admin") {
      throw new Error("Only administrators can delete orders");
    }

    const order = await ctx.db.get(args.orderDocId);
    if (!order) throw new Error("Order not found");

    const now = Date.now();

    await ctx.db.patch(args.orderDocId, {
      isDeleted: true,
      deletedAt: now,
      deletedBy: currentUser._id,
      updatedAt: now,
      updatedBy: currentUser._id,
    });

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "laundry_deleted",
      performedBy: currentUser._id,
      performedByEmail: currentUser.email,
      performedByName: currentUser.name || "Unknown",
      targetOrderId: args.orderDocId,
      details: `Deleted order ${order.orderId}`,
      timestamp: now,
    });

    return args.orderDocId;
  },
});