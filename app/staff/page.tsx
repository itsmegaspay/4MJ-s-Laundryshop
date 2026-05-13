"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Package, Clock, CheckCircle, Users, DollarSign, Loader2 } from 'lucide-react';
import { useEffect } from "react";
import StaffSidebar from "@/components/Staffsidebar";

export default function StaffDashboard() {
  const user = useQuery(api.users.getCurrentUser);
  const router = useRouter();

  // Get order statistics
  const orderStats = useQuery(api.laundryOrdersQueries.getOrderStatistics, {});
  
  // Get all orders for recent activity
  const allOrders = useQuery(api.laundryOrdersQueries.getAllOrders, {});

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push("/signin");
      return;
    }
    if (user.role === "admin") {
      router.push("/admin");
    }
  }, [user, router]);

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (user === null) {
    return null;
  }

  // Get recent orders (last 5)
  const recentOrders = allOrders?.slice(0, 5) || [];

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
      case "in-progress":
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
      case "ready":
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
      case "completed":
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
      case "cancelled":
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      {/* Sidebar */}
      <StaffSidebar userName={user.name} userEmail={user.email} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Welcome back, {user.name || user.email}
              </p>
            </div>

            {/* Dashboard Stats/Cards */}
            {!orderStats ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Today's Orders */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Today's Laundry</h3>
                      <ClipboardList className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {orderStats.today.total}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      {orderStats.today.completed} completed
                    </p>
                  </div>

                  {/* Pending */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</h3>
                      <Clock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {orderStats.pending}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      {orderStats.pending > 0 ? 'Needs attention' : 'All caught up!'}
                    </p>
                  </div>

                  {/* In Progress */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">In Progress</h3>
                      <Package className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {orderStats.inProgress}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Currently processing</p>
                  </div>

                  {/* Ready for Pickup */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Ready</h3>
                      <CheckCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {orderStats.ready}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      {orderStats.ready > 0 ? 'Awaiting pickup' : 'None ready'}
                    </p>
                  </div>
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Total Revenue (Paid) */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</h3>
                      <DollarSign className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(orderStats.totalRevenue)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      {orderStats.paid} paid laundry
                    </p>
                  </div>

                  {/* Pending Revenue (Unpaid) */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Revenue</h3>
                      <DollarSign className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(orderStats.pendingRevenue)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      {orderStats.unpaid} unpaid laundry
                    </p>
                  </div>

                  {/* Completed This Period */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Completed</h3>
                      <CheckCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {orderStats.completed}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">All time</p>
                  </div>
                </div>

                {/* Recent Activity Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Orders */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Laundry</h2>
                      <Link href="/staff/manage-laundry" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        View all
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {recentOrders.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                          No laundry yet
                        </p>
                      ) : (
                        recentOrders.map((order) => (
                          <div key={order._id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{order.orderId}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {order.customer?.name} • {formatTimestamp(order.createdAt)}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h2>
                    </div>
                    <div className="space-y-3">
                      <Link
                        href="/staff/manage-laundry?status=pending"
                        className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">View Pending Laundry</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {orderStats.pending} {orderStats.pending === 1 ? 'laundry' : 'laundry'} waiting
                            </p>
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/staff/manage-laundry?status=in-progress"
                        className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">Process Laundry</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {orderStats.inProgress} in progress
                            </p>
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/staff/manage-laundry?status=ready"
                        className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">Ready for Pickup</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {orderStats.ready} {orderStats.ready === 1 ? 'laundry' : 'laundry'} ready
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}