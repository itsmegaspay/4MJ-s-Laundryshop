import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create an audit log entry
export const createAuditLog = mutation({
  args: {
    action: v.string(), // e.g., "user_created", "user_updated", "user_deleted"
    targetUserId: v.optional(v.id("users")),
    targetUserEmail: v.optional(v.string()),
    details: v.optional(v.string()), // JSON string with additional details
    metadata: v.optional(v.object({
      oldValues: v.optional(v.any()),
      newValues: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    
    const auditLogId = await ctx.db.insert("auditLogs", {
      action: args.action,
      performedBy: userId,
      performedByEmail: user?.email || "unknown",
      performedByName: user?.name || user?.email || "unknown",
      targetUserId: args.targetUserId,
      targetUserEmail: args.targetUserEmail,
      details: args.details,
      metadata: args.metadata,
      timestamp: Date.now(),
    });

    return auditLogId;
  },
});

// Get all audit logs (admin only)
export const getAllAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
    action: v.optional(v.string()), // Filter by action type
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (currentUser?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    let query = ctx.db.query("auditLogs").order("desc");

    const logs = await query.collect();

    // Filter by action if provided
    let filteredLogs = logs;
    if (args.action) {
      filteredLogs = logs.filter(log => log.action === args.action);
    }

    // Limit results if specified
    if (args.limit) {
      filteredLogs = filteredLogs.slice(0, args.limit);
    }

    return filteredLogs;
  },
});

// Get audit logs for a specific user (admin only)
export const getAuditLogsForUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (currentUser?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const logs = await ctx.db
      .query("auditLogs")
      .filter((q) => q.eq(q.field("targetUserId"), args.userId))
      .order("desc")
      .collect();

    if (args.limit) {
      return logs.slice(0, args.limit);
    }

    return logs;
  },
});

// Get recent audit logs (for dashboard)
export const getRecentAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (currentUser?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const limit = args.limit || 10;
    const logs = await ctx.db
      .query("auditLogs")
      .order("desc")
      .take(limit);

    return logs;
  },
});