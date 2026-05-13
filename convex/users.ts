import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Sync or update user with custom fields
export const syncUser = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("staff"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the existing user (Convex Auth already created it)
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Only update fields that are provided AND don't overwrite existing role
    await ctx.db.patch(userId, {
      name: args.name ?? user.name,
      email: args.email ?? user.email,
      // IMPORTANT: Only set role if user doesn't have one already
      // This prevents overwriting admin roles back to staff
      role: user.role ?? args.role ?? "staff",
      createdAt: user.createdAt ?? Date.now(),
    });

    return userId;
  },
});

// Get current user info
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    return user;
  },
});

// Get user name (legacy compatibility)
export const getUserName = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    return user?.name ?? user?.email ?? null;
  },
});

// Get all users (for admin)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    
    // Check if user has admin role
    if (currentUser?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const allUsers = await ctx.db.query("users").collect();
    
    // Return users with proper role defaults
    return allUsers.map(user => ({
      ...user,
      role: user.role ?? "staff", // Default to staff if role not set
    }));
  },
});

// List all users (for admin) - alias for compatibility
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    
    // Check if user has admin role
    if (currentUser?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const allUsers = await ctx.db.query("users").collect();
    
    // Return users with proper role defaults
    return allUsers.map(user => ({
      ...user,
      role: user.role ?? "staff",
    }));
  },
});

// Create new user (admin only)
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("admin"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (currentUser?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Check if user with email already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Note: In a real implementation, you would need to:
    // 1. Hash the password properly using Convex Auth
    // 2. Create the auth credentials
    // For now, this is a placeholder that creates the user record
    // You'll need to integrate with Convex Auth's user creation flow

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      role: args.role,
      createdAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "user_created",
      performedBy: currentUserId,
      performedByEmail: currentUser?.email || "unknown",
      performedByName: currentUser?.name || currentUser?.email || "unknown",
      targetUserId: userId,
      targetUserEmail: args.email,
      details: `Created new user: ${args.name} (${args.email}) with role: ${args.role}`,
      metadata: {
        newValues: {
          name: args.name,
          email: args.email,
          role: args.role,
        },
      },
      timestamp: Date.now(),
    });

    return userId;
  },
});

// Update user (admin only)
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("staff"))),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (currentUser?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get the user to update
    const userToUpdate = await ctx.db.get(args.userId);
    if (!userToUpdate) {
      throw new Error("User not found");
    }

    // Store old values for audit log
    const oldValues = {
      name: userToUpdate.name,
      email: userToUpdate.email,
      role: userToUpdate.role,
    };

    // Check if email is being changed and if it conflicts with another user
    if (args.email && args.email !== userToUpdate.email) {
      const existingUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

      if (existingUser && existingUser._id !== args.userId) {
        throw new Error("User with this email already exists");
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (args.name !== undefined) updateData.name = args.name;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.role !== undefined) updateData.role = args.role;

    await ctx.db.patch(args.userId, updateData);

    // Build details string
    const changes: string[] = [];
    if (args.name !== undefined && args.name !== oldValues.name) {
      changes.push(`name: "${oldValues.name}" → "${args.name}"`);
    }
    if (args.email !== undefined && args.email !== oldValues.email) {
      changes.push(`email: "${oldValues.email}" → "${args.email}"`);
    }
    if (args.role !== undefined && args.role !== oldValues.role) {
      changes.push(`role: "${oldValues.role}" → "${args.role}"`);
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "user_updated",
      performedBy: currentUserId,
      performedByEmail: currentUser?.email || "unknown",
      performedByName: currentUser?.name || currentUser?.email || "unknown",
      targetUserId: args.userId,
      targetUserEmail: args.email || userToUpdate.email,
      details: `Updated user: ${userToUpdate.name || userToUpdate.email}. Changes: ${changes.join(", ")}`,
      metadata: {
        oldValues: oldValues,
        newValues: updateData,
      },
      timestamp: Date.now(),
    });

    return args.userId;
  },
});

// Delete user (admin only)
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (currentUser?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Prevent self-deletion
    if (args.userId === currentUserId) {
      throw new Error("You cannot delete your own account");
    }

    // Get the user to delete
    const userToDelete = await ctx.db.get(args.userId);
    if (!userToDelete) {
      throw new Error("User not found");
    }

    // Create audit log BEFORE deleting
    await ctx.db.insert("auditLogs", {
      action: "user_deleted",
      performedBy: currentUserId,
      performedByEmail: currentUser?.email || "unknown",
      performedByName: currentUser?.name || currentUser?.email || "unknown",
      targetUserId: args.userId,
      targetUserEmail: userToDelete.email,
      details: `Deleted user: ${userToDelete.name || userToDelete.email} (${userToDelete.email}) with role: ${userToDelete.role}`,
      metadata: {
        oldValues: {
          name: userToDelete.name,
          email: userToDelete.email,
          role: userToDelete.role,
        },
      },
      timestamp: Date.now(),
    });

    await ctx.db.delete(args.userId);

    return args.userId;
  },
});

// Update user role (admin only)
export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (currentUser?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get the user to update
    const userToUpdate = await ctx.db.get(args.userId);
    if (!userToUpdate) {
      throw new Error("User not found");
    }

    const oldRole = userToUpdate.role;

    await ctx.db.patch(args.userId, {
      role: args.role,
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "role_changed",
      performedBy: currentUserId,
      performedByEmail: currentUser?.email || "unknown",
      performedByName: currentUser?.name || currentUser?.email || "unknown",
      targetUserId: args.userId,
      targetUserEmail: userToUpdate.email,
      details: `Changed role for ${userToUpdate.name || userToUpdate.email}: "${oldRole}" → "${args.role}"`,
      metadata: {
        oldValues: { role: oldRole },
        newValues: { role: args.role },
      },
      timestamp: Date.now(),
    });

    return args.userId;
  },
});