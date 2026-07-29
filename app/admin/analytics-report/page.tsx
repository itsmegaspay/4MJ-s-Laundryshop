"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import AdminSidebar from "@/components/Adminsidebar";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  DollarSign,
  Package,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  Filter,
  ChevronDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from "recharts";

// Date range type
type DateRange = {
  start: Date;
  end: Date;
};

// Convert short day abbreviations (Sun, Mon, ...) to full day names for readable insight text
const DAY_NAME_MAP: Record<string, string> = {
  Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday",
};
function fullDayName(shortDay: string): string {
  return DAY_NAME_MAP[shortDay] || shortDay;
}

export default function AnalyticsReportPage() {
  const user = useQuery(api.users.getCurrentUser);
  const router = useRouter();
  
  // Custom date range state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  }));
  const [activeRangeMode, setActiveRangeMode] = useState<"7" | "30" | "90" | "custom">("30");
  const [customRange, setCustomRange] = useState({
    start: "",
    end: "",
  });

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push("/signin");
      return;
    }
    if (user.role !== "admin") {
      router.push("/staff");
    }
  }, [user, router]);

  // Fetch all services for custom analysis
  const allOrders = useQuery(api.laundryOrdersQueries.getAllOrders, {});
  const allCustomers = useQuery(api.customers.getAllCustomersForAnalytics);

  if (user === undefined || !allOrders || !allCustomers) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (user === null) {
    return null;
  }

  // Apply custom date range filter
  const applyCustomRange = () => {
    if (customRange.start && customRange.end) {
      // Parse "YYYY-MM-DD" into explicit local year/month/day components.
      // (Passing the raw string to `new Date()` is ambiguous: a date-only
      // string like "2026-07-20" is parsed as UTC midnight, while a
      // date-time string with no timezone suffix like "2026-07-20T23:59:59"
      // is parsed as *local* time. Mixing the two meant the start and end
      // boundaries used different timezone rules, so a custom range never
      // lined up with the equivalent quick-range preset.)
      const [startYear, startMonth, startDay] = customRange.start
        .split("-")
        .map(Number);
      const [endYear, endMonth, endDay] = customRange.end
        .split("-")
        .map(Number);

      setDateRange({
        start: new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0),
        end: new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999),
      });
      setActiveRangeMode("custom");
      setShowDatePicker(false);
    }
  };

  // Quick range setters
  const setQuickRange = (days: number) => {
    setDateRange({
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date(),
    });
    setActiveRangeMode(String(days) as "7" | "30" | "90");
    setShowDatePicker(false);
  };

  // Filter services by date range
  const filteredOrders = allOrders.filter(
    (order) =>
      order.createdAt >= dateRange.start.getTime() &&
      order.createdAt <= dateRange.end.getTime()
  );

  // Calculate previous period for comparison
  const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
  const previousPeriodOrders = allOrders.filter(
    (order) =>
      order.createdAt >= dateRange.start.getTime() - periodLength &&
      order.createdAt < dateRange.start.getTime()
  );

  // CURRENT PERIOD METRICS
  const currentRevenue = filteredOrders.reduce((sum, o) => sum + (o.pricing?.totalPrice || 0), 0);
  const currentOrders = filteredOrders.length;
  const currentCompletedOrders = filteredOrders.filter((o) => o.status === "completed").length;
  const currentAvgOrderValue = currentOrders > 0 ? currentRevenue / currentOrders : 0;

  // PREVIOUS PERIOD METRICS
  const previousRevenue = previousPeriodOrders.reduce((sum, o) => sum + (o.pricing?.totalPrice || 0), 0);
  const previousOrders = previousPeriodOrders.length;
  const previousCompletedOrders = previousPeriodOrders.filter((o) => o.status === "completed").length;
  const previousAvgOrderValue = previousOrders > 0 ? previousRevenue / previousOrders : 0;

  // CALCULATE CHANGES
  const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const ordersChange = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0;
  const avgValueChange = previousAvgOrderValue > 0 ? ((currentAvgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100 : 0;
  const currentCompletionPct = currentOrders > 0 ? (currentCompletedOrders / currentOrders) * 100 : 0;
  const previousCompletionPct = previousOrders > 0 ? (previousCompletedOrders / previousOrders) * 100 : 0;
  const completionRateChange = previousOrders > 0 ? (currentCompletionPct - previousCompletionPct) : 0;

  // CUSTOMER SEGMENTATION
  const customerSpending = new Map<string, number>();
  filteredOrders.forEach((order) => {
    const customerId = order.customerId;
    const current = customerSpending.get(customerId) || 0;
    customerSpending.set(customerId, current + (order.pricing?.totalPrice || 0));
  });

  const highValueCustomers = Array.from(customerSpending.values()).filter((v) => v >= 1000).length;
  const mediumValueCustomers = Array.from(customerSpending.values()).filter((v) => v >= 500 && v < 1000).length;
  const lowValueCustomers = Array.from(customerSpending.values()).filter((v) => v < 500).length;

  // NEW VS RETURNING CUSTOMERS
  // A customer is counted only if they placed at least one service in this period.
  // Among those, "new" = their account was created within this period (first-timer),
  // "returning" = their account existed before this period started (came back again).
  const periodStart = dateRange.start.getTime();
  const customerIdsInPeriod = Array.from(new Set(filteredOrders.map((o) => o.customerId)));
  const customersMap = new Map(allCustomers.map((c) => [c._id, c]));

  let newCustomersInPeriod = 0;
  let returningCustomers = 0;
  customerIdsInPeriod.forEach((custId) => {
    const cust = customersMap.get(custId);
    if (!cust) return;
    if (cust.createdAt >= periodStart && cust.createdAt <= dateRange.end.getTime()) {
      newCustomersInPeriod++;
    } else {
      returningCustomers++;
    }
  });
  const uniqueCustomersInPeriod = customerIdsInPeriod.length;

  // DAY OF WEEK ANALYSIS
  const dayOfWeekData = [
    { day: "Sun", revenue: 0, orders: 0 },
    { day: "Mon", revenue: 0, orders: 0 },
    { day: "Tue", revenue: 0, orders: 0 },
    { day: "Wed", revenue: 0, orders: 0 },
    { day: "Thu", revenue: 0, orders: 0 },
    { day: "Fri", revenue: 0, orders: 0 },
    { day: "Sat", revenue: 0, orders: 0 },
  ];

  filteredOrders.forEach((order) => {
    const dayIndex = new Date(order.createdAt).getDay();
    dayOfWeekData[dayIndex].revenue += order.pricing?.totalPrice || 0;
    dayOfWeekData[dayIndex].orders += 1;
  });

  // SERVICE TYPE REVENUE BREAKDOWN
  let regularClothesRevenue = 0;
  let assortedClothesRevenue = 0;
  let towelBlanketsRevenue = 0;
  let comforterRevenue = 0;
  let selfServiceRevenue = 0;

  filteredOrders.forEach((order) => {
    if (order.pricing) {
      const p: any = order.pricing;
      regularClothesRevenue += p.regularClothesPrice || p.clothesPrice || 0;
      assortedClothesRevenue += p.assortedClothesPrice || 0;
      towelBlanketsRevenue += p.towelBlanketsPrice || p.blanketsLightPrice || 0;
      comforterRevenue += p.comforterPrice || p.blanketsThickPrice || 0;
      selfServiceRevenue += (p.selfServiceWashPrice || 0) + (p.selfServiceSpinPrice || 0) + (p.selfServiceDryPrice || 0);
    }
  });

  const serviceRevenueData = [
    { name: "Regular Clothes", value: regularClothesRevenue, color: "#3b82f6" },
    { name: "Assorted Clothes", value: assortedClothesRevenue, color: "#6366f1" },
    { name: "Towel & Blankets", value: towelBlanketsRevenue, color: "#8b5cf6" },
    { name: "Comforter", value: comforterRevenue, color: "#f59e0b" },
    { name: "Self-Service", value: selfServiceRevenue, color: "#10b981" },
  ].filter((item) => item.value > 0);

  // Customer Segment Data
  const customerSegmentData = [
    { name: "High Value (₱1000+)", value: highValueCustomers, color: "#10b981" },
    { name: "Medium Value (₱500-999)", value: mediumValueCustomers, color: "#3b82f6" },
    { name: "Low Value (<₱500)", value: lowValueCustomers, color: "#f59e0b" },
  ].filter((item) => item.value > 0);

  // Export to CSV
  const exportToCSV = () => {
    const csvData = [
      ["=== 4MJ'S LAUNDRY - ADVANCED ANALYTICS REPORT ==="],
      [""],
      ["Report Generated:", new Date().toLocaleString()],
      ["Date Range:", `${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`],
      ["Period Length:", `${Math.ceil(periodLength / (24 * 60 * 60 * 1000))} days`],
      [""],
      [""],
      ["=== PERIOD COMPARISON ==="],
      [""],
      ["Metric", "Current Period", "Previous Period", "Change (%)", "Trend"],
      ["Total Revenue", currentRevenue.toFixed(2), previousRevenue.toFixed(2), revenueChange.toFixed(1) + "%", revenueChange >= 0 ? "↑" : "↓"],
      ["Total Services", currentOrders, previousOrders, ordersChange.toFixed(1) + "%", ordersChange >= 0 ? "↑" : "↓"],
      ["Average Order Value", currentAvgOrderValue.toFixed(2), previousAvgOrderValue.toFixed(2), avgValueChange.toFixed(1) + "%", avgValueChange >= 0 ? "↑" : "↓"],
      ["Completion Rate", `${currentCompletionPct.toFixed(1)}%`, `${previousCompletionPct.toFixed(1)}%`, completionRateChange.toFixed(1) + "%", completionRateChange >= 0 ? "↑" : "↓"],
      ["Completed Services", currentCompletedOrders, previousCompletedOrders, "", ""],
      [""],
      [""],
      ["=== CUSTOMER INSIGHTS ==="],
      [""],
      ["Customer Segmentation by Spending"],
      ["Segment", "Count", "Percentage of Total"],
      ["High Value (₱1000+)", highValueCustomers, `${((highValueCustomers / (highValueCustomers + mediumValueCustomers + lowValueCustomers || 1)) * 100).toFixed(1)}%`],
      ["Medium Value (₱500-999)", mediumValueCustomers, `${((mediumValueCustomers / (highValueCustomers + mediumValueCustomers + lowValueCustomers || 1)) * 100).toFixed(1)}%`],
      ["Low Value (<₱500)", lowValueCustomers, `${((lowValueCustomers / (highValueCustomers + mediumValueCustomers + lowValueCustomers || 1)) * 100).toFixed(1)}%`],
      ["TOTAL", highValueCustomers + mediumValueCustomers + lowValueCustomers, "100%"],
      [""],
      ["Customer Acquisition Analysis"],
      ["Type", "Count", "Percentage of Total"],
      ["New Customers", newCustomersInPeriod, `${((newCustomersInPeriod / (uniqueCustomersInPeriod || 1)) * 100).toFixed(1)}%`],
      ["Returning Customers", returningCustomers, `${((returningCustomers / (uniqueCustomersInPeriod || 1)) * 100).toFixed(1)}%`],
      ["TOTAL CUSTOMERS", uniqueCustomersInPeriod, "100%"],
      [""],
      [""],
      ["=== REVENUE ANALYSIS ==="],
      [""],
      ["Revenue by Service Type"],
      ["Service Type", "Revenue (₱)", "Percentage of Total"],
      ["Regular Clothes", regularClothesRevenue.toFixed(2), `${((regularClothesRevenue / (currentRevenue || 1)) * 100).toFixed(1)}%`],
      ["Assorted Clothes", assortedClothesRevenue.toFixed(2), `${((assortedClothesRevenue / (currentRevenue || 1)) * 100).toFixed(1)}%`],
      ["Towel & Blankets", towelBlanketsRevenue.toFixed(2), `${((towelBlanketsRevenue / (currentRevenue || 1)) * 100).toFixed(1)}%`],
      ["Comforter", comforterRevenue.toFixed(2), `${((comforterRevenue / (currentRevenue || 1)) * 100).toFixed(1)}%`],
      ["Self-Service", selfServiceRevenue.toFixed(2), `${((selfServiceRevenue / (currentRevenue || 1)) * 100).toFixed(1)}%`],
      ["TOTAL REVENUE", currentRevenue.toFixed(2), "100%"],
      [""],
      ["Revenue by Day of Week"],
      ["Day", "Revenue (₱)", "Orders", "Avg Service Value (₱)", "% of Total Revenue"],
      ...dayOfWeekData.map((item) => [
        item.day,
        item.revenue.toFixed(2),
        item.orders,
        item.orders > 0 ? (item.revenue / item.orders).toFixed(2) : "0.00",
        `${((item.revenue / (currentRevenue || 1)) * 100).toFixed(1)}%`
      ]),
      ["TOTAL", currentRevenue.toFixed(2), currentOrders, currentAvgOrderValue.toFixed(2), "100%"],
      [""],
      [""],
      ["=== KEY PERFORMANCE INDICATORS ==="],
      [""],
      ["Metric", "Value"],
      ["Best Revenue Day", fullDayName(dayOfWeekData.reduce((max, day) => day.revenue > max.revenue ? day : max).day)],
      ["Peak Revenue Amount", `₱${dayOfWeekData.reduce((max, day) => day.revenue > max.revenue ? day : max).revenue.toFixed(2)}`],
      ["Busiest Day (Orders)", fullDayName(dayOfWeekData.reduce((max, day) => day.orders > max.orders ? day : max).day)],
      ["Peak Order Count", dayOfWeekData.reduce((max, day) => day.orders > max.orders ? day : max).orders],
      ["Customer Retention Rate", `${((returningCustomers / (uniqueCustomersInPeriod || 1)) * 100).toFixed(1)}%`],
      ["New Customer Rate", `${((newCustomersInPeriod / (uniqueCustomersInPeriod || 1)) * 100).toFixed(1)}%`],
      [""],
      [""],
      ["=== END OF REPORT ==="],
    ];

    const csv = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `4MJs-Analytics-${dateRange.start.toISOString().split('T')[0]}-to-${dateRange.end.toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      <AdminSidebar userName={user.name || "User"} userEmail={user.email} />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Advanced Analytics
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Deep insights with period comparisons
                </p>
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download size={20} />
                Export CSV
              </button>
            </div>

            {/* Custom Date Range Picker */}
            <div className="mb-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Calendar size={18} />
                  Date Range:
                </div>
                
                {/* Quick Range Buttons */}
                <button
                  onClick={() => setQuickRange(7)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activeRangeMode === "7"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setQuickRange(30)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activeRangeMode === "30"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setQuickRange(90)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activeRangeMode === "90"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  Last 90 Days
                </button>

                {/* Custom Range Toggle */}
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activeRangeMode === "custom"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-100 dark:bg-blue-950/30 hover:bg-blue-200 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                  }`}
                >
                  <Filter size={16} />
                  Custom Range
                  <ChevronDown size={16} className={`transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
                </button>

                {/* Current Range Display */}
                <div className="ml-auto text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
                  </span>
                  <span className="ml-2 text-xs">
                    ({Math.ceil(periodLength / (24 * 60 * 60 * 1000))} days)
                  </span>
                </div>
              </div>

              {/* Custom Date Picker */}
              {showDatePicker && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customRange.start}
                      onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customRange.end}
                      onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <button
                    onClick={applyCustomRange}
                    disabled={!customRange.start || !customRange.end}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                  >
                    Apply Range
                  </button>
                </div>
              )}
            </div>

            {/* Period Comparison Cards */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Activity size={20} className="text-blue-600" />
                Period Comparison
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ComparisonCard
                  title="Total Revenue"
                  current={currentRevenue}
                  previous={previousRevenue}
                  change={revenueChange}
                  format="currency"
                  icon={DollarSign}
                  hasPreviousData={previousOrders > 0}
                />
                <ComparisonCard
                  title="Total Services"
                  current={currentOrders}
                  previous={previousOrders}
                  change={ordersChange}
                  format="number"
                  icon={Package}
                  hasPreviousData={previousOrders > 0}
                />
                <ComparisonCard
                  title="Avg Service Value"
                  current={currentAvgOrderValue}
                  previous={previousAvgOrderValue}
                  change={avgValueChange}
                  format="currency"
                  icon={TrendingUp}
                  hasPreviousData={previousOrders > 0}
                />
                <ComparisonCard
                  title="Completion Rate"
                  current={currentCompletionPct}
                  previous={previousCompletionPct}
                  change={completionRateChange}
                  format="percentage"
                  icon={Clock}
                  hasPreviousData={previousOrders > 0}
                />
              </div>
            </div>

            {/* Customer Insights */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Users size={20} className="text-purple-600" />
                Customer Insights
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Segmentation */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Customer Value Segments
                  </h3>
                  {customerSegmentData.length > 0 ? (
                    <CustomerSegmentChart data={customerSegmentData} />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      No customer data available
                    </div>
                  )}
                </div>

                {/* New vs Returning */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Customer Acquisition
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          New Customers
                        </span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {newCustomersInPeriod}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                        <div
                          className="bg-green-600 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${uniqueCustomersInPeriod > 0 ? (newCustomersInPeriod / uniqueCustomersInPeriod) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Returning Customers
                        </span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {returningCustomers}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${uniqueCustomersInPeriod > 0 ? (returningCustomers / uniqueCustomersInPeriod) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Total Customers
                        </span>
                        <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                          {uniqueCustomersInPeriod}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Analysis */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-green-600" />
                Revenue Analysis
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Type Revenue */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Revenue by Service Type
                  </h3>
                  {serviceRevenueData.length > 0 ? (
                    <ServiceRevenueChart data={serviceRevenueData} />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      No revenue data available
                    </div>
                  )}
                </div>

                {/* Day of Week Analysis */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Revenue by Day of Week
                  </h3>
                  <DayOfWeekChart data={dayOfWeekData} />
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-900 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Activity className="text-blue-600" size={24} />
                Automated Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InsightCard
                  title="Revenue Trend"
                  description={
                    previousRevenue === 0
                      ? currentRevenue > 0
                        ? "No revenue recorded in the previous period to compare against yet — check back once more history builds up."
                        : "No revenue recorded in either period."
                      : revenueChange >= 10
                      ? `Revenue increased by ${revenueChange.toFixed(1)}% compared to the previous period. Excellent growth!`
                      : revenueChange > 0
                      ? `Revenue slightly increased by ${revenueChange.toFixed(1)}% compared to the previous period.`
                      : revenueChange === 0
                      ? "Revenue remained exactly the same as the previous period."
                      : `Revenue decreased by ${Math.abs(revenueChange).toFixed(1)}%. Consider promotional campaigns.`
                  }
                  severity={
                    previousRevenue === 0
                      ? "orange"
                      : revenueChange >= 10
                      ? "green"
                      : revenueChange >= 0
                      ? "orange"
                      : "red"
                  }
                />
                <InsightCard
                  title="Service Volume"
                  description={
                    previousOrders === 0
                      ? currentOrders > 0
                        ? "No services recorded in the previous period to compare against yet — check back once more history builds up."
                        : "No services recorded in either period."
                      : ordersChange >= 10
                      ? `Services increased by ${ordersChange.toFixed(1)}%. Customer demand is growing!`
                      : ordersChange > 0
                      ? `Services slightly increased by ${ordersChange.toFixed(1)}%.`
                      : ordersChange === 0
                      ? "Service volume remained exactly the same as the previous period."
                      : `Services decreased by ${Math.abs(ordersChange).toFixed(1)}%. Focus on customer acquisition.`
                  }
                  severity={
                    previousOrders === 0
                      ? "orange"
                      : ordersChange >= 10
                      ? "green"
                      : ordersChange >= 0
                      ? "orange"
                      : "red"
                  }
                />
                <InsightCard
                  title="Customer Base"
                  description={
                    newCustomersInPeriod === 0 && returningCustomers === 0
                      ? "No customer activity recorded in this period."
                      : newCustomersInPeriod > returningCustomers
                      ? `Strong customer acquisition with ${newCustomersInPeriod} new customers!`
                      : returningCustomers > 0
                      ? `Good retention! ${returningCustomers} returning customers show loyalty.`
                      : "Focus on building a loyal customer base."
                  }
                  severity={
                    newCustomersInPeriod === 0 && returningCustomers === 0
                      ? "red"
                      : returningCustomers > 0 && newCustomersInPeriod > 0
                      ? "green"
                      : "orange"
                  }
                />
                <InsightCard
                  title="Best Revenue Day"
                  description={`${fullDayName(dayOfWeekData.reduce((max, day) => day.revenue > max.revenue ? day : max).day)} generates the most revenue with ₱${dayOfWeekData.reduce((max, day) => day.revenue > max.revenue ? day : max).revenue.toLocaleString()}.`}
                  severity="green"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Comparison Card Component
function ComparisonCard({
  title,
  current,
  previous,
  change,
  format,
  icon: Icon,
  hasPreviousData = true,
}: {
  title: string;
  current: number;
  previous: number;
  change: number;
  format: "currency" | "number" | "percentage";
  icon: any;
  hasPreviousData?: boolean;
}) {
  const formatValue = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return format === "percentage" ? "0.0%" : format === "currency" ? "₱0" : "0";
    if (format === "currency") return `₱${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (format === "percentage") return `${value.toFixed(1)}%`;
    return value.toString();
  };

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h3>
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
          <Icon className="text-blue-600 dark:text-blue-400" size={20} />
        </div>
      </div>
      
      {/* Current Value */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {formatValue(current)}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Current Period</p>
      </div>

      {/* Comparison */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Previous</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {hasPreviousData ? formatValue(previous) : (
              <span className="italic text-slate-400 dark:text-slate-500 font-normal">No prior data</span>
            )}
          </p>
        </div>
        {hasPreviousData && change !== 0 && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
              isPositive
                ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                : isNegative
                ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight size={14} />
            ) : isNegative ? (
              <ArrowDownRight size={14} />
            ) : null}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Customer Segment Chart Component
const CustomerSegmentTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700">
        <p className="font-bold text-sm">{payload[0].name}</p>
        <p className="text-xs text-slate-300 mt-1">{payload[0].value} customers</p>
      </div>
    );
  }
  return null;
};

function CustomerSegmentChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${(percent || 0) * 100 >= 5 ? (name || '').split(' ')[0] : ''} ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomerSegmentTooltip />} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Service Revenue Chart Component
function ServiceRevenueChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.name}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {item.name}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ₱{item.value.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {((item.value / total) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Day of Week Chart Component
const DayOfWeekTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700">
        <p className="font-bold text-sm">{payload[0].payload.day}</p>
        <p className="text-xs text-slate-300">Revenue: ₱{payload[0].value.toLocaleString()}</p>
        <p className="text-xs text-slate-300">Orders: {payload[0].payload.orders}</p>
      </div>
    );
  }
  return null;
};

function DayOfWeekChart({ data }: { data: { day: string; revenue: number; orders: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" opacity={0.5} />
          <XAxis 
            dataKey="day" 
            className="text-xs text-slate-500 dark:text-slate-400"
            tick={{ fill: 'currentColor' }}
            tickLine={false}
            axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
          />
          <YAxis 
            className="text-xs text-slate-500 dark:text-slate-400"
            tick={{ fill: 'currentColor' }}
            tickLine={false}
            axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
            tickFormatter={(value) => `₱${value}`}
          />
          <Tooltip content={<DayOfWeekTooltip />} />
          <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Insight Card Component - green/orange/red severity coloring
function InsightCard({
  title,
  description,
  severity,
}: {
  title: string;
  description: string;
  severity: "green" | "orange" | "red";
}) {
  const styles = {
    green: {
      cardBg: "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900",
      iconBg: "bg-green-100 dark:bg-green-950/30",
      iconColor: "text-green-600 dark:text-green-400",
      Icon: TrendingUp,
    },
    orange: {
      cardBg: "bg-orange-50/50 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900",
      iconBg: "bg-orange-100 dark:bg-orange-950/30",
      iconColor: "text-orange-600 dark:text-orange-400",
      Icon: TrendingUp,
    },
    red: {
      cardBg: "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900",
      iconBg: "bg-red-100 dark:bg-red-950/30",
      iconColor: "text-red-600 dark:text-red-400",
      Icon: TrendingDown,
    },
  }[severity];

  const { Icon } = styles;

  return (
    <div className={`rounded-lg p-4 border ${styles.cardBg}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}>
          <Icon className={styles.iconColor} size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}