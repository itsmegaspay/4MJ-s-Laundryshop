import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  
  users: defineTable({
    authUserId: v.optional(v.string()),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("staff"))),
    createdAt: v.optional(v.number()),
  })
    .index("by_auth_id", ["authUserId"])
    .index("by_email", ["email"]),
  
  customers: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_email", ["email"])
    .index("by_phone", ["phone"])
    .index("by_created_at", ["createdAt"])
    .index("by_is_active", ["isActive"]),
  
  laundryOrders: defineTable({
    orderId: v.string(), // LND-YYYYMMDD-XXX
    customerId: v.id("customers"),
    
    // Order Details
    orderType: v.object({
      clothes: v.boolean(),
      blanketsLight: v.boolean(),
      blanketsThick: v.boolean(),
    }),
    
    status: v.union(
      v.literal("pending"),
      v.literal("in-progress"),
      v.literal("ready"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    
    // Weight & Pricing (filled when status = "ready")
    weight: v.optional(v.object({
      clothes: v.optional(v.number()),
      blanketsLight: v.optional(v.number()),
      blanketsThick: v.optional(v.number()),
    })),
    
    pricing: v.optional(v.object({
      clothesPrice: v.optional(v.number()),
      blanketsLightPrice: v.optional(v.number()),
      blanketsThickPrice: v.optional(v.number()),
      totalPrice: v.number(),
    })),
    
    // Payment
    paymentStatus: v.union(
      v.literal("unpaid"),
      v.literal("paid")
    ),
    paidAt: v.optional(v.number()),
    
    // Pickup
    expectedPickupDate: v.optional(v.number()),
    actualPickupDate: v.optional(v.number()),
    
    // Metadata
    notes: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
    
    // Status tracking timestamps
    inProgressAt: v.optional(v.number()),  // NEW: When status changed to in-progress
    readyAt: v.optional(v.number()),        // NEW: When status changed to ready
    completedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    cancellationReason: v.optional(v.string()),
    
    isDeleted: v.boolean(),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_customer", ["customerId"])
    .index("by_order_id", ["orderId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"])
    .index("by_is_deleted", ["isDeleted"])
    .index("by_payment_status", ["paymentStatus"]),
  
  pricingConfig: defineTable({
    clothesPricePerKg: v.number(),
    blanketsLightPricePerKg: v.number(),
    blanketsThickPricePerKg: v.number(),
    currency: v.string(), // "PHP"
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }),
  
  auditLogs: defineTable({
    action: v.string(),
    performedBy: v.id("users"),
    performedByEmail: v.string(),
    performedByName: v.string(),
    
    // Target entities
    targetOrderId: v.optional(v.id("laundryOrders")),
    targetCustomerId: v.optional(v.id("customers")),
    targetUserId: v.optional(v.id("users")),
    
    targetUserEmail: v.optional(v.string()),
    details: v.optional(v.string()),
    
    metadata: v.optional(v.object({
      oldValues: v.optional(v.any()),
      newValues: v.optional(v.any()),
    })),
    
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_target_order", ["targetOrderId"])
    .index("by_target_customer", ["targetCustomerId"])
    .index("by_target_user", ["targetUserId"])
    .index("by_performed_by", ["performedBy"])
    .index("by_action", ["action"]),
  
  emailSettings: defineTable({
    orderStatusTemplate: v.string(),
    welcomeEmailTemplate: v.string(),
    senderName: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }),
  // Add to your existing schema:
  analyticsCache: defineTable({
    // Cache calculated metrics to avoid recalculating every time
    reportDate: v.string(), // "2025-01-28"
    reportType: v.string(), // "daily", "weekly", "monthly"
    
    metrics: v.object({
      totalRevenue: v.number(),
      totalOrders: v.number(),
      newCustomers: v.number(),
      averageOrderValue: v.number(),
      completionRate: v.number(),
      paymentCollectionRate: v.number(),
    }),
    
    createdAt: v.number(),
  })
    .index("by_date", ["reportDate"])
    .index("by_type", ["reportType"]),

  systemAlerts: defineTable({
    alertType: v.string(), // "revenue_drop", "high_unpaid", "slow_turnaround"
    severity: v.union(
      v.literal("info"),
      v.literal("warning"), 
      v.literal("critical")
    ),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    isResolved: v.boolean(), // Track if the issue is resolved
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()), // When the alert was resolved
  })
    .index("by_severity", ["severity"])
    .index("by_is_read", ["isRead"])
    .index("by_created_at", ["createdAt"])
    .index("by_resolved", ["isResolved"]), // Index for filtering resolved alerts
});