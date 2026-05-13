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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

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

  const recentActivity = useQuery(api.analytics.getRecentActivity, {
    limit: 5,
  });

  const topCustomers = useQuery(api.analytics.getTopCustomers, {
    limit: 5,
  });

  const alerts = useQuery(api.analytics.getActiveAlerts);

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
                icon={DollarSign}
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
                      <span className="text-sm text-slate-600 dark:text-slate-400">Clothes</span>
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
                        Light Blankets
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
                        Thick Blankets
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
                <ImprovedBarChart data={ordersByDay} color="#3b82f6" />
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

const BarChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700">
        <p className="font-bold text-sm">{value} {value === 1 ? 'order' : 'orders'}</p>
        <p className="text-xs text-slate-300 mt-1">{payload[0].payload.date}</p>
      </div>
    );
  }
  return null;
};

const BarChartLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (value === 0) return null;
  
  return (
    <text 
      x={x + width / 2} 
      y={y - 5} 
      fill="currentColor" 
      textAnchor="middle" 
      className="text-xs font-bold fill-slate-700 dark:fill-slate-300"
    >
      {value}
    </text>
  );
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
  if (!data || data.length === 0) {
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

// Professional Bar Chart using Recharts
function ImprovedBarChart({ 
  data, 
  color 
}: { 
  data: { date: string; value: number }[]; 
  color: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Package size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No orders available</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Data will appear once you have orders
          </p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const hasData = data.some(d => d.value > 0);

  // Check if all values are zero
  if (!hasData || maxValue < 1) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Package size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No orders yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Create your first order to see trends
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
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
            allowDecimals={false}
          />
          <Tooltip content={<BarChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
          <Bar 
            dataKey="value" 
            fill={color} 
            radius={[4, 4, 0, 0]}
            label={<BarChartLabel />}
          />
        </BarChart>
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