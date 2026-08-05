"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import AdminSidebar from "@/components/Adminsidebar";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
  TrendingUpIcon,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";


function PhilippinePesoIcon({ className = "", size = 20 }: { className?: string; size?: number }) {
  return (
    <span
      className={className}
      style={{
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      ₱
    </span>
  );
}

export default function AdminDashboard() {
  const user = useQuery(api.users.getCurrentUser);
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("month");
  
  // Add mutation for resolving alerts
  const resolveAlert = useMutation(api.alertSystem.resolveAlert);

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

  // Fetch dashboard data
  const dashboardStats = useQuery(api.analytics.getDashboardStats, {
    timeRange,
  });

  // Convex queries update reactively whenever a laundry service is created.
  // This is used as the source of truth for the monthly Laundry Volume chart.
  const realtimeOrders = useQuery(api.laundryOrdersQueries.getAllOrders, {});

  const recentActivity = useQuery(api.analytics.getRecentActivity, {
    limit: 5,
  });

  const topCustomers = useQuery(api.analytics.getTopCustomers, {
    limit: 5,
  });

  const alerts = useQuery(api.analytics.getActiveAlerts);
  const drumStatus = useQuery(api.waterTank.getDrumStatus);
  const refillDrums = useMutation(api.waterTank.refillDrums);
  const [isRefilling, setIsRefilling] = useState(false);

  if (user === undefined || !dashboardStats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (user === null) {
    return null;
  }

  const {
    totalRevenue,
    revenueGrowth,
    totalOrders,
    ordersGrowth,
    totalCustomers,
    customersGrowth,
    avgTurnaroundTime,
    turnaroundChange,
    paymentCollectionRate,
    ordersByStatus,
    revenueByDay,
    ordersByDay,
    serviceTypeDistribution,
    insights,
    waterConsumption,
  } = dashboardStats;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      <AdminSidebar userName={user.name} userEmail={user.email} />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Dashboard Overview
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Welcome back, {user.name}! Here's what's happening today.
              </p>
            </div>

            {/* Time Range Filter */}
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => setTimeRange("today")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === "today"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeRange("week")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeRange("month")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeRange("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                All Time
              </button>
            </div>

            {/* Alerts with Dismiss Button */}
            {alerts && alerts.length > 0 && (
              <div className="mb-6 space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className={`p-4 rounded-lg border flex items-start gap-3 ${
                      alert.severity === "critical"
                        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                        : alert.severity === "warning"
                        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
                        : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                    }`}
                  >
                    <AlertCircle
                      className={
                        alert.severity === "critical"
                          ? "text-red-600 dark:text-red-400"
                          : alert.severity === "warning"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-blue-600 dark:text-blue-400"
                      }
                      size={20}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {alert.message}
                      </p>
                    </div>
                    <button
                      onClick={() => resolveAlert({ alertId: alert._id })}
                      className={`p-1.5 rounded-lg transition-colors hover:bg-white/50 dark:hover:bg-slate-800/50 ${
                        alert.severity === "critical"
                          ? "text-red-600 dark:text-red-400"
                          : alert.severity === "warning"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                      title="Dismiss alert"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Revenue"
                value={`₱${totalRevenue.toLocaleString()}`}
                change={revenueGrowth}
                icon={PhilippinePesoIcon}
                iconColor="text-green-600 dark:text-green-400"
                iconBg="bg-green-100 dark:bg-green-950/30"
              />
              <MetricCard
                title="Total Laundry"
                value={totalOrders.toString()}
                change={ordersGrowth}
                icon={Package}
                iconColor="text-blue-600 dark:text-blue-400"
                iconBg="bg-blue-100 dark:bg-blue-950/30"
              />
              <MetricCard
                title="Total Customers"
                value={totalCustomers.toString()}
                change={customersGrowth}
                icon={Users}
                iconColor="text-purple-600 dark:text-purple-400"
                iconBg="bg-purple-100 dark:bg-purple-950/30"
              />
              <MetricCard
                title="Avg Turnaround"
                value={`${avgTurnaroundTime}h`}
                change={turnaroundChange}
                icon={Clock}
                iconColor="text-orange-600 dark:text-orange-400"
                iconBg="bg-orange-100 dark:bg-orange-950/30"
                invertChange
              />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Active Laundry */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
                  Active Laundry
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Pending</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {ordersByStatus.pending || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">In Progress</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {ordersByStatus.inProgress || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Ready</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {ordersByStatus.ready || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Payment Collection
                  </h3>
                  <div className="group relative">
                    <AlertCircle size={16} className="text-slate-400 cursor-help" />
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded shadow-lg z-10">
                      Percentage of paid laundry out of total laundry in selected time range
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-slate-200 dark:text-slate-700"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 56 * (1 - paymentCollectionRate / 100)
                        }`}
                        className="text-green-600 dark:text-green-400"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {paymentCollectionRate}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                    {ordersByStatus.pending + ordersByStatus.inProgress + ordersByStatus.ready + ordersByStatus.completed} total laundry
                  </p>
                </div>
              </div>

              {/* Service Distribution */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
                  Service Types
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Regular / Assorted Clothes</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {serviceTypeDistribution.clothes}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${serviceTypeDistribution.clothes}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Towel &amp; Blankets
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {serviceTypeDistribution.blanketsLight}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${serviceTypeDistribution.blanketsLight}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Comforter
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {serviceTypeDistribution.blanketsThick}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${serviceTypeDistribution.blanketsThick}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* ── DA INSIGHTS / FORECASTING ─────────────────────────────── */}
            {insights && (() => {
              const compRate = insights.completionRate || 0;
              const compSeverity = compRate >= 80 ? "green" : compRate >= 50 ? "orange" : "red";
              const revGrowth = insights.revenueGrowth || 0;
              const revSeverity = revGrowth > 0 ? "green" : revGrowth === 0 ? "orange" : "red";
              const ordGrowth = ordersGrowth || 0;
              const ordSeverity = ordGrowth > 0 ? "green" : ordGrowth === 0 ? "orange" : "red";

              const cc: Record<string, { bg: string; border: string; text: string; sub: string; label: string }> = {
                green: {
                  bg: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20",
                  border: "border-green-300 dark:border-green-700",
                  text: "text-green-700 dark:text-green-300",
                  sub: "text-green-600 dark:text-green-400",
                  label: "text-green-700 dark:text-green-400",
                },
                orange: {
                  bg: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20",
                  border: "border-orange-300 dark:border-orange-700",
                  text: "text-orange-700 dark:text-orange-300",
                  sub: "text-orange-600 dark:text-orange-400",
                  label: "text-orange-700 dark:text-orange-400",
                },
                red: {
                  bg: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20",
                  border: "border-red-300 dark:border-red-700",
                  text: "text-red-700 dark:text-red-300",
                  sub: "text-red-600 dark:text-red-400",
                  label: "text-red-700 dark:text-red-400",
                },
              };
              const icon = { green: "✅", orange: "⚠️", red: "🔴" };

              return (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  📊 DA Insights &amp; Forecasting
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Completion Rate */}
                  <div className={`${cc[compSeverity].bg} rounded-lg border ${cc[compSeverity].border} p-5`}>
                    <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${cc[compSeverity].label}`}>{icon[compSeverity]} Completion Rate</p>
                    <p className={`text-2xl font-bold ${cc[compSeverity].text}`}>{compRate}%</p>
                    <p className={`text-xs mt-1 ${cc[compSeverity].sub}`}>
                      {compSeverity === "green" ? "Of all services completed — excellent!" : compSeverity === "orange" ? "Slightly below target for completed services" : "Needs attention — completion rate is low"}
                    </p>
                  </div>
                  {/* Projected Revenue */}
                  <div className={`${cc[revSeverity].bg} rounded-lg border ${cc[revSeverity].border} p-5`}>
                    <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${cc[revSeverity].label}`}>{icon[revSeverity]} Projected Revenue</p>
                    <p className={`text-2xl font-bold ${cc[revSeverity].text}`}>₱{(insights.forecastRevenue||0).toLocaleString()}</p>
                    <p className={`text-xs mt-1 ${cc[revSeverity].sub}`}>
                      Trend: {revGrowth>=0?"+":""}{revGrowth}% {revSeverity === "orange" ? "(no change)" : revSeverity === "red" ? "(declining)" : "(growing)"}
                    </p>
                  </div>
                  {/* Busiest Day - operational heads-up */}
                  <div className={`${cc.orange.bg} rounded-lg border ${cc.orange.border} p-5`}>
                    <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${cc.orange.label}`}>⚠️ Busiest Day</p>
                    <p className={`text-2xl font-bold ${cc.orange.text}`}>{insights.peakDay||"N/A"}</p>
                    <p className={`text-xs mt-1 ${cc.orange.sub}`}>{insights.peakDayOrders||0} services on avg — prepare staff</p>
                  </div>
                  {/* Projected Services */}
                  <div className={`${cc[ordSeverity].bg} rounded-lg border ${cc[ordSeverity].border} p-5`}>
                    <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${cc[ordSeverity].label}`}>{icon[ordSeverity]} Projected Services</p>
                    <p className={`text-2xl font-bold ${cc[ordSeverity].text}`}>{insights.forecastOrders||0}</p>
                    <p className={`text-xs mt-1 ${cc[ordSeverity].sub}`}>
                      Avg ₱{(insights.avgOrderValue||0).toLocaleString()} per service {ordSeverity === "orange" ? "(no change)" : ordSeverity === "red" ? "(declining)" : "(growing)"}
                    </p>
                  </div>
                  {/* Revenue Growing/Declining */}
                  <div className={`${cc[revSeverity].bg} rounded-lg border ${cc[revSeverity].border} p-5`}>
                    <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${cc[revSeverity].label}`}>{revSeverity === "red" ? "🔴 Revenue Declining" : revSeverity === "orange" ? "⚠️ Revenue Flat" : "✅ Revenue Growing"}</p>
                    <p className={`text-2xl font-bold ${cc[revSeverity].text}`}>{revGrowth>=0?"+":""}{revGrowth}%</p>
                    <p className={`text-xs mt-1 ${cc[revSeverity].sub}`}>
                      {revSeverity === "red" ? "Action needed to recover revenue" : revSeverity === "orange" ? "No change from last period — try a promotion to spark growth" : "Keep up the great work!"}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600 p-5">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">💡 Business Tip</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {compSeverity === "green" ? "Great completion rate! Focus on increasing volume." : revSeverity !== "red" ? "Revenue is growing — keep the momentum!" : "Consider promotions to boost services this period."}
                    </p>
                  </div>

                  {/* Water Drum Monitor - Realistic Tracking */}
                  {drumStatus && (
                    <div className="col-span-full mt-2">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">💧 Water Drum Monitor</h3>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Confirm that all ${drumStatus.totalDrums} drums have been refilled to full (${drumStatus.totalCapacityLiters}L)?`)) {
                              setIsRefilling(true);
                              try { await refillDrums({}); } finally { setIsRefilling(false); }
                            }
                          }}
                          disabled={isRefilling}
                          className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                        >
                          {isRefilling ? "Refilling..." : "🔄 Mark Drums Refilled"}
                        </button>
                      </div>

                      {/* Refill Alert Banner */}
                      {drumStatus.needsRefillUrgent && (
                        <div className="mb-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex items-start gap-3">
                          <span className="text-2xl">🔴</span>
                          <div>
                            <p className="font-semibold text-red-800 dark:text-red-200">Urgent: Refill Water Drums Now</p>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                              Only {drumStatus.drumsRemaining} drum(s) ({drumStatus.remainingLiters}L) remaining out of {drumStatus.totalDrums} drums. Refill {(drumStatus.totalDrums - drumStatus.drumsRemaining).toFixed(1)} drum(s) / {drumStatus.usedLiters}L needed.
                            </p>
                          </div>
                        </div>
                      )}
                      {drumStatus.needsRefillSoon && !drumStatus.needsRefillUrgent && (
                        <div className="mb-3 p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg flex items-start gap-3">
                          <span className="text-2xl">🟠</span>
                          <div>
                            <p className="font-semibold text-orange-800 dark:text-orange-200">Water Running Low — Plan a Refill Soon</p>
                            <p className="text-sm text-orange-600 dark:text-orange-400 mt-0.5">
                              {drumStatus.drumsRemaining} drum(s) ({drumStatus.remainingLiters}L) remaining out of {drumStatus.totalDrums} drums.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Drums Used</p>
                          <p className="text-xl font-bold text-blue-800 dark:text-blue-200">{drumStatus.drumsUsed} / {drumStatus.totalDrums} drums</p>
                          <p className="text-xs text-blue-500 mt-0.5">{drumStatus.usedLiters}L used</p>
                        </div>
                        <div className={`rounded-lg p-4 border ${drumStatus.needsRefillUrgent ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700" : drumStatus.needsRefillSoon ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700" : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"}`}>
                          <p className={`text-xs mb-1 ${drumStatus.needsRefillUrgent ? "text-red-600 dark:text-red-400" : drumStatus.needsRefillSoon ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}`}>Drums Remaining</p>
                          <p className={`text-xl font-bold ${drumStatus.needsRefillUrgent ? "text-red-800 dark:text-red-200" : drumStatus.needsRefillSoon ? "text-orange-800 dark:text-orange-200" : "text-green-800 dark:text-green-200"}`}>{drumStatus.drumsRemaining} drums</p>
                          <p className="text-xs mt-0.5 opacity-70">{drumStatus.remainingLiters}L left ({drumStatus.percentRemaining}%)</p>
                        </div>
                        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700 rounded-lg p-4">
                          <p className="text-xs text-cyan-600 dark:text-cyan-400 mb-1">Drum Capacity</p>
                          <p className="text-xl font-bold text-cyan-800 dark:text-cyan-200">{drumStatus.totalCapacityLiters}L</p>
                          <p className="text-xs text-cyan-500 mt-0.5">{drumStatus.totalDrums} × {drumStatus.drumCapacityLiters}L drums</p>
                        </div>
                        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700 rounded-lg p-4">
                          <p className="text-xs text-cyan-600 dark:text-cyan-400 mb-1">Last Refilled</p>
                          <p className="text-sm font-bold text-cyan-800 dark:text-cyan-200">
                            {drumStatus.lastRefillAt ? new Date(drumStatus.lastRefillAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Never recorded"}
                          </p>
                          <p className="text-xs text-cyan-500 mt-0.5">Since this refill</p>
                        </div>
                      </div>

                      {/* Visual drum level bar */}
                      <div className="mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase">Water Level</p>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{drumStatus.percentRemaining}% remaining</p>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-4 rounded-full transition-all duration-500 ${drumStatus.percentRemaining <= 10 ? "bg-red-500" : drumStatus.percentRemaining <= 30 ? "bg-orange-500" : "bg-green-500"}`}
                            style={{ width: `${drumStatus.percentRemaining}%` }}
                          />
                        </div>
                      </div>

                      {/* By Service Type breakdown */}
                      <div className="mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Usage By Service Type (since last refill)</p>
                        <div className="space-y-1.5 text-sm">
                          {[
                            ["Regular Clothes", drumStatus.usedByService?.regularClothes || 0, "50L/load"],
                            ["Assorted Clothes", drumStatus.usedByService?.assortedClothes || 0, "50L/load"],
                            ["Towel & Blankets", drumStatus.usedByService?.towelBlankets || 0, "60L/load"],
                            ["Comforter", drumStatus.usedByService?.comforter || 0, "70L/load"],
                            ["Self-Service Wash", drumStatus.usedByService?.selfServiceWash || 0, "45L/session"],
                            ["Self-Service Spin", drumStatus.usedByService?.selfServiceSpin || 0, "5L/session"],
                          ].filter(([, v]) => (v as number) > 0).map(([label, liters, rate]) => (
                            <div key={label as string} className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-slate-400">{label as string} <span className="text-xs text-slate-400">({rate as string})</span></span>
                              <span className="font-medium text-blue-700 dark:text-blue-300">{(liters as number).toLocaleString()} L</span>
                            </div>
                          ))}
                          {drumStatus.usedLiters === 0 && (
                            <p className="text-slate-400 text-sm">No water usage recorded since last refill.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
            })()}


            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Revenue Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Revenue Trend
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Money earned over time
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {timeRange === "all" ? "Monthly" : timeRange === "today" ? "Hourly" : "Daily"}
                  </span>
                </div>
                <ImprovedLineChart data={revenueByDay} color="#10b981" formatValue={(v) => `₱${v.toLocaleString()}`} />
              </div>

              {/* Laundry Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Laundry Volume
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Number of laundry received
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {timeRange === "all" ? "Monthly" : timeRange === "today" ? "Hourly" : "Daily"}
                  </span>
                </div>
                <ImprovedLaundryLineChart
                  data={ordersByDay}
                  realtimeOrders={realtimeOrders || []}
                  color="#3b82f6"
                  timeRange={timeRange}
                />
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Customers */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Top Customers
                </h3>
                {topCustomers && topCustomers.length > 0 ? (
                  <div className="space-y-4">
                    {topCustomers.map((customer, index) => (
                      <div
                        key={customer.customerId}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {customer.customerName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {customer.orderCount} laundry
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          ₱{customer.totalSpent.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                    No customer data available
                  </p>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Recent Activity
                </h3>
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity._id} className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.type === "order_created"
                              ? "bg-blue-100 dark:bg-blue-950/30"
                              : activity.type === "order_completed"
                              ? "bg-green-100 dark:bg-green-950/30"
                              : activity.type === "payment_received"
                              ? "bg-emerald-100 dark:bg-emerald-950/30"
                              : "bg-slate-100 dark:bg-slate-800"
                          }`}
                        >
                          {activity.type === "order_created" ? (
                            <Package
                              size={16}
                              className="text-blue-600 dark:text-blue-400"
                            />
                          ) : activity.type === "order_completed" ? (
                            <CheckCircle
                              size={16}
                              className="text-green-600 dark:text-green-400"
                            />
                          ) : activity.type === "payment_received" ? (
                            <DollarSign
                              size={16}
                              className="text-emerald-600 dark:text-emerald-400"
                            />
                          ) : (
                            <Activity size={16} className="text-slate-600 dark:text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 dark:text-slate-100">
                            {activity.description}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                    No recent activity
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  iconBg,
  invertChange = false,
}: {
  title: string;
  value: string;
  change: number;
  icon: any;
  iconColor: string;
  iconBg: string;
  invertChange?: boolean;
}) {
  const isPositive = invertChange ? change < 0 : change > 0;
  const isNegative = invertChange ? change > 0 : change < 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h3>
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={iconColor} size={20} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        {change !== 0 && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositive
                ? "text-green-600 dark:text-green-400"
                : isNegative
                ? "text-red-600 dark:text-red-400"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp size={16} />
            ) : isNegative ? (
              <TrendingDown size={16} />
            ) : null}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom tooltip components defined outside render
const LineChartTooltip = ({ active, payload, formatValue }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700">
        <p className="font-bold text-sm">{formatValue(payload[0].value)}</p>
        <p className="text-xs text-slate-300 mt-1">{payload[0].payload.date}</p>
      </div>
    );
  }
  return null;
};

const LaundryLineChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const point = payload[0].payload;

    return (
      <div className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700">
        <p className="font-bold text-sm">
          {value} {value === 1 ? "service" : "services"}
        </p>
        <p className="text-xs text-slate-300 mt-1">
          {point.fullDate || point.date || `Day ${point.day}`}
        </p>
      </div>
    );
  }

  return null;
};

// Professional Area Chart using Recharts
function ImprovedLineChart({ 
  data, 
  color,
  formatValue = (v) => v.toString()
}: { 
  data: { date: string; value: number }[]; 
  color: string;
  formatValue?: (value: number) => string;
}) {
  if ((!data || data.length === 0) && realtimeOrders.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <TrendingUpIcon size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No data available</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Data will appear once you have revenue
          </p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const hasData = data.some(d => d.value > 0);

  // Handle single data point case
  if (data.length === 1) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4" style={{ backgroundColor: color + '20' }}>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {formatValue(data[0].value)}
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {data[0].date}
          </div>
        </div>
      </div>
    );
  }

  // Check if all values are zero or very small
  if (!hasData || maxValue < 1) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <BarChart3 size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No revenue yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Start receiving payments to see trends
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" opacity={0.5} />
          <XAxis 
            dataKey="date" 
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
          <Tooltip content={<LineChartTooltip formatValue={formatValue} />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2.5}
            fill="url(#colorRevenue)"
            dot={{ fill: color, r: 3 }}
            activeDot={{ r: 5, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Professional Laundry Line Chart using Recharts
function ImprovedLaundryLineChart({
  data,
  realtimeOrders,
  color,
  timeRange,
}: {
  data: { date: string; value: number }[];
  realtimeOrders: { createdAt: number }[];
  color: string;
  timeRange: "today" | "week" | "month" | "all";
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Package size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            No services available
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Data will appear once you have orders
          </p>
        </div>
      </div>
    );
  }

  const parseChartDate = (dateLabel: string): Date | null => {
    const trimmed = dateLabel.trim();
    const directDate = new Date(trimmed);

    if (!Number.isNaN(directDate.getTime())) {
      return directDate;
    }

    const currentYear = new Date().getFullYear();
    const labelDate = new Date(`${trimmed}, ${currentYear}`);

    if (!Number.isNaN(labelDate.getTime())) {
      return labelDate;
    }

    return null;
  };

  let chartData: {
    date: string;
    day?: number;
    value: number;
    fullDate?: string;
  }[] = data;

  if (timeRange === "month") {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalsByDay = new Map<number, number>();

    // Count the actual laundry service records. Because `realtimeOrders` is a
    // Convex query result, this updates automatically after create/cancel/etc.
    realtimeOrders.forEach((order) => {
      const createdDate = new Date(order.createdAt);

      if (
        createdDate.getFullYear() === year &&
        createdDate.getMonth() === month
      ) {
        const day = createdDate.getDate();
        totalsByDay.set(day, (totalsByDay.get(day) || 0) + 1);
      }
    });

    chartData = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const fullDate = new Date(year, month, day).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      return {
        date: day.toString(),
        day,
        value: totalsByDay.get(day) || 0,
        fullDate,
      };
    });
  }

  const maxValue = Math.max(...chartData.map((item) => item.value), 1);
  const yAxisMaximum = Math.max(4, Math.ceil(maxValue));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-slate-200 dark:stroke-slate-700"
            opacity={0.5}
          />
          <XAxis
            dataKey={timeRange === "month" ? "day" : "date"}
            className="text-xs text-slate-500 dark:text-slate-400"
            tick={{ fill: "currentColor", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "currentColor", opacity: 0.2 }}
            interval={timeRange === "month" ? 0 : "preserveStartEnd"}
            minTickGap={timeRange === "month" ? 0 : 12}
          />
          <YAxis
            className="text-xs text-slate-500 dark:text-slate-400"
            tick={{ fill: "currentColor" }}
            tickLine={false}
            axisLine={{ stroke: "currentColor", opacity: 0.2 }}
            allowDecimals={false}
            domain={[0, yAxisMaximum]}
          />
          <Tooltip content={<LaundryLineChartTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={{ fill: color, r: 3 }}
            activeDot={{ fill: color, r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Helper function to format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}