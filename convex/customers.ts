import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
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

// Create a new customer
export const createCustomer = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Check if customer with this email already exists
    const existingEmail = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existingEmail && existingEmail.isActive) {
      throw new Error("Customer with this email already exists");
    }

    // Check if customer with this phone already exists
    const existingPhone = await ctx.db
      .query("customers")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();

    if (existingPhone && existingPhone.isActive) {
      throw new Error("Customer with this phone number already exists");
    }

    const now = Date.now();

    const customerId = await ctx.db.insert("customers", {
      name: args.name,
      email: args.email.toLowerCase(),
      phone: args.phone,
      notes: args.notes,
      createdAt: now,
      createdBy: currentUser._id,
      updatedAt: now,
      isActive: true,
    });

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "customer_created",
      performedBy: currentUser._id,
      performedByEmail: currentUser.email,
      performedByName: currentUser.name || "Unknown",
      targetCustomerId: customerId,
      details: `Created customer: ${args.name}`,
      timestamp: now,
    });

    return customerId;
  },
});

// Update customer information
export const updateCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found");

    const oldValues = { ...customer };
    const updates: Partial<Doc<"customers">> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email.toLowerCase();
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.customerId, updates);

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "customer_updated",
      performedBy: currentUser._id,
      performedByEmail: currentUser.email,
      performedByName: currentUser.name || "Unknown",
      targetCustomerId: args.customerId,
      details: `Updated customer: ${customer.name}`,
      metadata: {
        oldValues,
        newValues: updates,
      },
      timestamp: Date.now(),
    });

    return args.customerId;
  },
});

// Soft delete a customer
export const deleteCustomer = mutation({
  args: {
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found");

    await ctx.db.patch(args.customerId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "customer_deleted",
      performedBy: currentUser._id,
      performedByEmail: currentUser.email,
      performedByName: currentUser.name || "Unknown",
      targetCustomerId: args.customerId,
      details: `Deleted customer: ${customer.name}`,
      timestamp: Date.now(),
    });

    return args.customerId;
  },
});

// Get customer by email
export const getCustomerByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

// Get customer by phone
export const getCustomerByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

// Search customers
export const searchCustomers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const searchQuery = args.query.toLowerCase().trim();
    
    if (!searchQuery) {
      // Return recent active customers if no search query
      return await ctx.db
        .query("customers")
        .withIndex("by_created_at")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .take(10);
    }

    // Search by name, email, or phone
    const allCustomers = await ctx.db
      .query("customers")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return allCustomers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(searchQuery) ||
        customer.email.toLowerCase().includes(searchQuery) ||
        customer.phone.includes(searchQuery)
      );
    });
  },
});

// Get all active customers
export const getAllCustomers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_is_active", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();
  },
});

// Get customer by ID
export const getCustomerById = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.customerId);
  },
});

// Get recent customers (for quick selection)
export const getRecentCustomers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    
    return await ctx.db
      .query("customers")
      .withIndex("by_created_at")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(limit);
  },
});