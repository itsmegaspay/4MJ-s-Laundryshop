"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/Adminsidebar";

export default function AuditLog() {
  const user = useQuery(api.users.getCurrentUser);
  const allAuditLogs = useQuery(api.auditLogs.getAllAuditLogs, {});
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  if (user === null || user.role !== "admin") {
    return null;
  }

  // Filter logs based on search term and action filter
  const filteredLogs = allAuditLogs?.filter((log) => {
    const matchesSearch = 
      log.performedByEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetUserEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAction === "all" || log.action === filterAction;
    
    return matchesSearch && matchesFilter;
  }) || [];

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAction]);

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      // User Management
      case "user_created":
        return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
      case "user_updated":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
      case "user_deleted":
        return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
      case "role_changed":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
      
      // Customer Management
      case "customer_created":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400";
      case "customer_updated":
        return "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400";
      case "customer_deleted":
        return "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400";
      
      // Laundry Management
      case "laundry_created":
        return "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400";
      case "laundry_status_updated":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400";
      case "laundry_payment_updated":
        return "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400";
      case "laundry_deleted":
        return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
      
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
    }
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportLogs = () => {
    if (!filteredLogs || filteredLogs.length === 0) return;
    
    const csv = [
      ["Timestamp", "Action", "Performed By", "Target User", "Details"].join(","),
      ...filteredLogs.map(log => [
        formatTimestamp(log.timestamp),
        log.action,
        log.performedByEmail,
        log.targetUserEmail || "N/A",
        `"${log.details?.replace(/"/g, '""') || ""}"`,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${Date.now()}.csv`;
    a.click();
  };

  // Calculate statistics
  const stats = {
    total: allAuditLogs?.length || 0,
    userActions: allAuditLogs?.filter(log => 
      log.action.startsWith('user_') || log.action === 'role_changed'
    ).length || 0,
    customerActions: allAuditLogs?.filter(log => 
      log.action.startsWith('customer_')
    ).length || 0,
    laundryActions: allAuditLogs?.filter(log => 
      log.action.startsWith('laundry_')
    ).length || 0,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      {/* Sidebar */}
      <AdminSidebar userName={user.name} userEmail={user.email} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Audit Log</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Track all system activities and changes
                </p>
              </div>
              <button
                onClick={exportLogs}
                className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Download size={20} />
                Export CSV
              </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by email, action, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:w-56">
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Actions</option>
                  <optgroup label="User Management">
                    <option value="user_created">User Created</option>
                    <option value="user_updated">User Updated</option>
                    <option value="user_deleted">User Deleted</option>
                    <option value="role_changed">Role Changed</option>
                  </optgroup>
                  <optgroup label="Customer Management">
                    <option value="customer_created">Customer Created</option>
                    <option value="customer_updated">Customer Updated</option>
                    <option value="customer_deleted">Customer Deleted</option>
                  </optgroup>
                  <optgroup label="Laundry Management">
                    <option value="laundry_created">Laundry Created</option>
                    <option value="laundry_status_updated">Status Updated</option>
                    <option value="laundry_payment_updated">Payment Updated</option>
                    <option value="laundry_deleted">Laundry Deleted</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Logs</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">User Actions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.userActions}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">Customer Actions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.customerActions}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">Laundry Actions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.laundryActions}</p>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Performed By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                          No audit logs found
                        </td>
                      </tr>
                    ) : (
                      paginatedLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900 dark:text-slate-100">
                              {formatTimestamp(log.timestamp)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                              {getActionLabel(log.action)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {log.performedByName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {log.performedByEmail}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-600 dark:text-slate-400 max-w-md truncate">
                              {log.details}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors p-1"
                              title="View details"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredLogs.length)}</span> of{' '}
                      <span className="font-medium">{filteredLogs.length}</span> results
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current page
                          const showPage = 
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1);
                          
                          const showEllipsis = 
                            (page === currentPage - 2 && currentPage > 3) ||
                            (page === currentPage + 2 && currentPage < totalPages - 2);

                          if (showEllipsis) {
                            return (
                              <span key={page} className="px-2 text-slate-400">
                                ...
                              </span>
                            );
                          }

                          if (!showPage) return null;

                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Audit Log Details</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Timestamp
                </label>
                <p className="text-slate-900 dark:text-slate-100">{formatTimestamp(selectedLog.timestamp)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Action
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(selectedLog.action)}`}>
                  {getActionLabel(selectedLog.action)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Performed By
                </label>
                <p className="text-slate-900 dark:text-slate-100">{selectedLog.performedByName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedLog.performedByEmail}</p>
              </div>
              {selectedLog.targetUserEmail && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Target User
                  </label>
                  <p className="text-slate-900 dark:text-slate-100">{selectedLog.targetUserEmail}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Details
                </label>
                <p className="text-slate-900 dark:text-slate-100">{selectedLog.details}</p>
              </div>
              {selectedLog.metadata && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Metadata
                  </label>
                  <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-xs overflow-x-auto text-slate-900 dark:text-slate-100">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}