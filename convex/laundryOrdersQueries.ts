import { v } from "convex/values";
import { query } from "./_generated/server";

// Get order by ID
export const getOrderById = query({
  args: { orderDocId: v.id("laundryOrders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderDocId);
    if (!order) return null;

    const customer = await ctx.db.get(order.customerId);
    const createdByUser = await ctx.db.get(order.createdBy);
    const updatedByUser = await ctx.db.get(order.updatedBy);

    return {
      ...order,
      customer,
      createdByUser,
      updatedByUser,
    };
  },
});

// Get order by order ID string
export const getOrderByOrderId = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("laundryOrders")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .first();

    if (!order) return null;

    const customer = await ctx.db.get(order.customerId);
    const createdByUser = await ctx.db.get(order.createdBy);
    const updatedByUser = await ctx.db.get(order.updatedBy);

    return {
      ...order,
      customer,
      createdByUser,
      updatedByUser,
    };
  },
});

// Get all orders with filters
export const getAllOrders = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("in-progress"),
        v.literal("ready"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
    paymentStatus: v.optional(v.union(v.literal("paid"), v.literal("unpaid"))),
    customerId: v.optional(v.id("customers")),
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Apply filters based on status
    let orders;
    if (args.status) {
      orders = await ctx.db
        .query("laundryOrders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      orders = await ctx.db
        .query("laundryOrders")
        .withIndex("by_created_at")
        .order("desc")
        .collect();
    }

    // Filter by payment status
    if (args.paymentStatus) {
      orders = orders.filter((o) => o.paymentStatus === args.paymentStatus);
    }

    // Filter by customer
    if (args.customerId) {
      orders = orders.filter((o) => o.customerId === args.customerId);
    }

    // Filter deleted
    if (!args.includeDeleted) {
      orders = orders.filter((o) => !o.isDeleted);
    }

    // Enrich with customer data
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const customer = await ctx.db.get(order.customerId);
        const createdByUser = await ctx.db.get(order.createdBy);
        return {
          ...order,
          customer,
          createdByUser,
        };
      })
    );

    return enrichedOrders;
  },
});

// Get orders by customer
export const getOrdersByCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("laundryOrders")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("desc")
      .collect();

    return orders;
  },
});

// Get order statistics
export const getOrderStatistics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startDate = args.startDate || now - 30 * 24 * 60 * 60 * 1000; // Last 30 days
    const endDate = args.endDate || now;

    const orders = await ctx.db
      .query("laundryOrders")
      .withIndex("by_created_at")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate),
          q.eq(q.field("isDeleted"), false)
        )
      )
      .collect();

    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      inProgress: orders.filter((o) => o.status === "in-progress").length,
      ready: orders.filter((o) => o.status === "ready").length,
      completed: orders.filter((o) => o.status === "completed").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
      paid: orders.filter((o) => o.paymentStatus === "paid").length,
      unpaid: orders.filter((o) => o.paymentStatus === "unpaid").length,
      totalRevenue: orders
        .filter((o) => o.pricing && o.paymentStatus === "paid")
        .reduce((sum, o) => sum + (o.pricing?.totalPrice || 0), 0),
      pendingRevenue: orders
        .filter((o) => o.pricing && o.paymentStatus === "unpaid")
        .reduce((sum, o) => sum + (o.pricing?.totalPrice || 0), 0),
    };

    // Get today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((o) => o.createdAt >= todayStart.getTime());

    return {
      ...stats,
      today: {
        total: todayOrders.length,
        pending: todayOrders.filter((o) => o.status === "pending").length,
        inProgress: todayOrders.filter((o) => o.status === "in-progress").length,
        ready: todayOrders.filter((o) => o.status === "ready").length,
        completed: todayOrders.filter((o) => o.status === "completed").length,
      },
    };
  },
});

// Search orders
export const searchOrders = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const searchQuery = args.query.toLowerCase().trim();

    if (!searchQuery) {
      return [];
    }

    // Search by order ID
    const orderByOrderId = await ctx.db
      .query("laundryOrders")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.query.toUpperCase()))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .first();

    if (orderByOrderId) {
      const customer = await ctx.db.get(orderByOrderId.customerId);
      return [{ ...orderByOrderId, customer }];
    }

    // Search by customer name, email, phone
    const allOrders = await ctx.db
      .query("laundryOrders")
      .withIndex("by_is_deleted", (q) => q.eq("isDeleted", false))
      .collect();

    const enrichedOrders = await Promise.all(
      allOrders.map(async (order) => {
        const customer = await ctx.db.get(order.customerId);
        return { ...order, customer };
      })
    );

    return enrichedOrders.filter((order) => {
      if (!order.customer) return false;
      return (
        order.orderId.toLowerCase().includes(searchQuery) ||
        order.customer.name.toLowerCase().includes(searchQuery) ||
        order.customer.email.toLowerCase().includes(searchQuery) ||
        order.customer.phone.includes(searchQuery)
      );
    });
  },
});