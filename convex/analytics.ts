import { query } from "./_generated/server";
import { v } from "convex/values";

// Get dashboard statistics
export const getDashboardStats = query({
  args: {
    timeRange: v.union(
      v.literal("today"),
      v.literal("week"),
      v.literal("month"),
      v.literal("all")
    ),
  },
  handler: async (ctx, args) => {
    const { timeRange } = args;
    
    // Calculate time range boundaries
    const now = Date.now();
    let startTime = 0;
    let previousStartTime = 0;
    
    switch (timeRange) {
      case "today":
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        startTime = todayStart.getTime();
        previousStartTime = startTime - 86400000; // Yesterday
        break;
      case "week":
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);
        startTime = weekStart.getTime();
        previousStartTime = startTime - 7 * 86400000; // Previous week
        break;
      case "month":
        const monthStart = new Date();
        monthStart.setDate(monthStart.getDate() - 30);
        monthStart.setHours(0, 0, 0, 0);
        startTime = monthStart.getTime();
        previousStartTime = startTime - 30 * 86400000; // Previous month
        break;
      case "all":
        startTime = 0;
        previousStartTime = 0;
        break;
    }

    // Fetch all orders
    const allOrders = await ctx.db
      .query("laundryOrders")
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    // Filter orders for current period
    const currentOrders = allOrders.filter((o) => o.createdAt >= startTime);
    const previousOrders = allOrders.filter(
      (o) => o.createdAt >= previousStartTime && o.createdAt < startTime
    );

    // Calculate total revenue
    const totalRevenue = currentOrders.reduce((sum, order) => {
      return sum + (order.pricing?.totalPrice || 0);
    }, 0);

    const previousRevenue = previousOrders.reduce((sum, order) => {
      return sum + (order.pricing?.totalPrice || 0);
    }, 0);

    const revenueGrowth =
      previousRevenue > 0
        ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
        : 0;

    // Calculate total orders
    const totalOrders = currentOrders.length;
    const ordersGrowth =
      previousOrders.length > 0
        ? Math.round(((totalOrders - previousOrders.length) / previousOrders.length) * 100)
        : 0;

    // Count active orders
    const activeOrders = currentOrders.filter(
      (o) => o.status === "pending" || o.status === "in-progress" || o.status === "ready"
    ).length;

    // Get unique customers in current period
    const customerIds = new Set(currentOrders.map((o) => o.customerId));
    const totalCustomers = customerIds.size;

    // Get unique customers in previous period
    const previousCustomerIds = new Set(previousOrders.map((o) => o.customerId));
    const customersGrowth =
      previousCustomerIds.size > 0
        ? Math.round(
            ((totalCustomers - previousCustomerIds.size) / previousCustomerIds.size) * 100
          )
        : 0;

    // Calculate average turnaround time (in hours)
    const completedOrders = currentOrders.filter((o) => o.completedAt);
    const avgTurnaroundTime =
      completedOrders.length > 0
        ? Math.round(
            completedOrders.reduce((sum, order) => {
              const duration = order.completedAt! - order.createdAt;
              return sum + duration / 3600000; // Convert to hours
            }, 0) / completedOrders.length
          )
        : 0;

    const previousCompletedOrders = previousOrders.filter((o) => o.completedAt);
    const previousAvgTurnaround =
      previousCompletedOrders.length > 0
        ? Math.round(
            previousCompletedOrders.reduce((sum, order) => {
              const duration = order.completedAt! - order.createdAt;
              return sum + duration / 3600000;
            }, 0) / previousCompletedOrders.length
          )
        : 0;

    const turnaroundChange =
      previousAvgTurnaround > 0
        ? Math.round(((avgTurnaroundTime - previousAvgTurnaround) / previousAvgTurnaround) * 100)
        : 0;

    // Calculate payment collection rate
    const paidOrders = currentOrders.filter((o) => o.paymentStatus === "paid").length;
    const paymentCollectionRate =
      totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 100) : 0;

    // Orders by status
    const ordersByStatus = {
      pending: currentOrders.filter((o) => o.status === "pending").length,
      inProgress: currentOrders.filter((o) => o.status === "in-progress").length,
      ready: currentOrders.filter((o) => o.status === "ready").length,
      completed: currentOrders.filter((o) => o.status === "completed").length,
      cancelled: currentOrders.filter((o) => o.status === "cancelled").length,
    };

    // Revenue by day (last 7 days for today/week, last 30 for month, last 12 months for all)
    const revenueByDay = calculateRevenueByDay(currentOrders, timeRange);

    // Orders by day
    const ordersByDay = calculateOrdersByDay(currentOrders, timeRange);

    // Service type distribution
    const serviceTypeDistribution = calculateServiceTypeDistribution(currentOrders);

    return {
      totalRevenue,
      revenueGrowth,
      totalOrders,
      ordersGrowth,
      activeOrders,
      totalCustomers,
      customersGrowth,
      avgTurnaroundTime,
      turnaroundChange,
      paymentCollectionRate,
      ordersByStatus,
      revenueByDay,
      ordersByDay,
      serviceTypeDistribution,
    };
  },
});

// Get recent activity
export const getRecentActivity = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("laundryOrders")
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("desc")
      .take(args.limit);

    const customers = await ctx.db.query("customers").collect();
    const customerMap = new Map(customers.map((c) => [c._id, c]));

    return orders.map((order) => {
      const customer = customerMap.get(order.customerId);
      let type = "order_created";
      let description = `Order ${order.orderId} created`;

      if (order.status === "completed") {
        type = "order_completed";
        description = `Order ${order.orderId} completed for ${customer?.name}`;
      } else if (order.paymentStatus === "paid" && order.paidAt) {
        type = "payment_received";
        description = `Payment received for order ${order.orderId}`;
      }

      return {
        _id: order._id,
        type,
        description,
        timestamp: order.updatedAt,
      };
    });
  },
});

// Get top customers
export const getTopCustomers = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("laundryOrders")
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    const customers = await ctx.db.query("customers").collect();
    const customerMap = new Map(customers.map((c) => [c._id, c]));

    // Group orders by customer and calculate totals
    const customerStats = new Map<
      string,
      { customerId: string; customerName: string; totalSpent: number; orderCount: number }
    >();

    orders.forEach((order) => {
      const customerId = order.customerId;
      const customer = customerMap.get(customerId);
      if (!customer) return;

      const existing = customerStats.get(customerId) || {
        customerId,
        customerName: customer.name,
        totalSpent: 0,
        orderCount: 0,
      };

      existing.totalSpent += order.pricing?.totalPrice || 0;
      existing.orderCount += 1;
      customerStats.set(customerId, existing);
    });

    // Sort by total spent and take top N
    return Array.from(customerStats.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, args.limit);
  },
});

// Get active alerts - UPDATED to only show unresolved alerts
export const getActiveAlerts = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    return await ctx.db
      .query("systemAlerts")
      .filter((q: any) => 
        q.and(
          q.eq(q.field("isResolved"), false), // Only show unresolved alerts
          q.gt(q.field("expiresAt"), now) // Not expired
        )
      )
      .order("desc")
      .take(5);
  },
});

// Helper functions
function calculateRevenueByDay(
  orders: any[],
  timeRange: "today" | "week" | "month" | "all"
): { date: string; value: number }[] {
  const now = new Date();

  // For "all time", group by month instead of day
  if (timeRange === "all") {
    return calculateRevenueByMonth(orders);
  }

  let days = 7;
  if (timeRange === "today") days = 1;
  else if (timeRange === "week") days = 7;
  else if (timeRange === "month") days = 30;

  const revenueByDay: { date: string; value: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dayStart = date.getTime();
    const dayEnd = dayStart + 86400000;

    const dayOrders = orders.filter((o) => o.createdAt >= dayStart && o.createdAt < dayEnd);
    const revenue = dayOrders.reduce((sum, order) => sum + (order.pricing?.totalPrice || 0), 0);

    // Format date based on time range
    let dateLabel = "";
    if (timeRange === "today") {
      dateLabel = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } else {
      dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    revenueByDay.push({
      date: dateLabel,
      value: revenue,
    });
  }

  return revenueByDay;
}

function calculateRevenueByMonth(orders: any[]): { date: string; value: number }[] {
  // Group orders by month
  const revenueByMonth = new Map<string, number>();

  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    
    const currentRevenue = revenueByMonth.get(monthLabel) || 0;
    revenueByMonth.set(monthLabel, currentRevenue + (order.pricing?.totalPrice || 0));
  });

  // Convert to array and sort by date
  return Array.from(revenueByMonth.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(-12); // Show last 12 months
}

function calculateOrdersByDay(
  orders: any[],
  timeRange: "today" | "week" | "month" | "all"
): { date: string; value: number }[] {
  const now = new Date();

  // For "all time", group by month instead of day
  if (timeRange === "all") {
    return calculateOrdersByMonth(orders);
  }

  let days = 7;
  if (timeRange === "today") days = 1;
  else if (timeRange === "week") days = 7;
  else if (timeRange === "month") days = 30;

  const ordersByDay: { date: string; value: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dayStart = date.getTime();
    const dayEnd = dayStart + 86400000;

    const dayOrders = orders.filter((o) => o.createdAt >= dayStart && o.createdAt < dayEnd);

    // Format date based on time range
    let dateLabel = "";
    if (timeRange === "today") {
      dateLabel = date.toLocaleTimeString("en-US", { hour: "2-digit" });
    } else {
      dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    ordersByDay.push({
      date: dateLabel,
      value: dayOrders.length,
    });
  }

  return ordersByDay;
}

function calculateOrdersByMonth(orders: any[]): { date: string; value: number }[] {
  // Group orders by month
  const ordersByMonth = new Map<string, number>();

  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    
    const currentCount = ordersByMonth.get(monthLabel) || 0;
    ordersByMonth.set(monthLabel, currentCount + 1);
  });

  // Convert to array and sort by date
  return Array.from(ordersByMonth.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => {
      const dateA = new Date(a.date + " 1");
      const dateB = new Date(b.date + " 1");
      return dateA.getTime() - dateB.getTime();
    })
    .slice(-12); // Show last 12 months
}

function calculateServiceTypeDistribution(orders: any[]): {
  clothes: number;
  blanketsLight: number;
  blanketsThick: number;
} {
  let clothesCount = 0;
  let blanketsLightCount = 0;
  let blanketsThickCount = 0;

  orders.forEach((order) => {
    if (order.orderType.clothes) clothesCount++;
    if (order.orderType.blanketsLight) blanketsLightCount++;
    if (order.orderType.blanketsThick) blanketsThickCount++;
  });

  const total = clothesCount + blanketsLightCount + blanketsThickCount || 1;

  return {
    clothes: Math.round((clothesCount / total) * 100),
    blanketsLight: Math.round((blanketsLightCount / total) * 100),
    blanketsThick: Math.round((blanketsThickCount / total) * 100),
  };
}