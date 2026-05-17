/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
// staff
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Search, Plus, Eye, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import StaffSidebar from "@/components/Staffsidebar";
import { useRouter } from "next/navigation";

export default function ManageLaundryPage() {
  const user = useQuery(api.users.getCurrentUser);
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Queries (must be called before any conditional returns)
  const allOrders = useQuery(api.laundryOrdersQueries.getAllOrders, {
    status: filterStatus === "all" ? undefined : filterStatus as any,
  });

  const allCustomers = useQuery(api.customers.getAllCustomers);

  // Mutations (must be called before any conditional returns)
  const createOrder = useMutation(api.laundryOrders.createOrder);
  const updateOrderStatus = useMutation(api.laundryOrders.updateOrderStatus);
  const updatePaymentStatus = useMutation(api.laundryOrders.updatePaymentStatus);
  const createCustomer = useMutation(api.customers.createCustomer);
  const generateOrderId = useMutation(api.laundryOrders.generateOrderId);

  // Reset to page 1 when filters change (must be before conditional returns)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, sortBy]);

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

  // Function to send order confirmation email
  const sendOrderEmail = async (orderData: any, customerEmail: string, customerName: string) => {
    try {
      const response = await fetch('/api/send-order-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: customerEmail,
          customerName: customerName,
          orderId: orderData.orderId,
          orderType: orderData.orderType,
          expectedPickupDate: orderData.expectedPickupDate,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Failed to send email:', result.error);
        return { success: false, error: result.error };
      }

      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      console.error('Error sending order email:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to send ready notification email
  const sendReadyEmail = async (orderId: string, customerEmail: string, customerName: string, weight: any, pricing: any) => {
    try {
      const response = await fetch('/api/send-ready-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: customerEmail,
          customerName: customerName,
          orderId: orderId,
          weight: weight,
          pricing: pricing,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Failed to send ready email:', result.error);
        return { success: false, error: result.error };
      }

      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      console.error('Error sending ready email:', error);
      return { success: false, error: error.message };
    }
  };

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

  // Filter orders based on search
  const filteredOrders = allOrders?.filter((order) => {
    const matchesSearch = 
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  }) || [];

  // Sort orders based on selected sort option
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return b.createdAt - a.createdAt; // Newest first
      case "date-asc":
        return a.createdAt - b.createdAt; // Oldest first
      case "name-asc":
        return (a.customer?.name || "").localeCompare(b.customer?.name || "");
      case "name-desc":
        return (b.customer?.name || "").localeCompare(a.customer?.name || "");
      case "id-asc":
        return a.orderId.localeCompare(b.orderId);
      case "id-desc":
        return b.orderId.localeCompare(a.orderId);
      case "total-desc":
        return (b.pricing?.totalPrice || 0) - (a.pricing?.totalPrice || 0);
      case "total-asc":
        return (a.pricing?.totalPrice || 0) - (b.pricing?.totalPrice || 0);
      default:
        return b.createdAt - a.createdAt;
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  const getStatusBadgeColor = (status: string) => {
    return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
  };

  const getPaymentBadgeColor = (status: string) => {
    return status === "paid"
      ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
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

  const formatOrderType = (orderType: any) => {
    const types = [];
    if (orderType.clothes) types.push("Clothes");
    if (orderType.blanketsLight) types.push("Light Blankets");
    if (orderType.blanketsThick) types.push("Thick Blankets");
    // Backward compatibility
    if (orderType.blankets && !orderType.blanketsLight && !orderType.blanketsThick) {
      types.push("Blankets");
    }
    return types.join(", ");
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleUpdateStatus = async (orderDocId: Id<"laundryOrders">, newStatus: string, weight?: any) => {
    try {
      await updateOrderStatus({
        orderDocId,
        newStatus: newStatus as any,
        weight,
      });
      setIsViewModalOpen(false);
      setSelectedOrder(null);
    } catch (error: any) {
      alert(error.message || "Failed to update laundry status");
    }
  };

  const handleUpdatePayment = async (orderDocId: Id<"laundryOrders">, paymentStatus: "paid" | "unpaid") => {
    try {
      await updatePaymentStatus({
        orderDocId,
        paymentStatus,
      });
    } catch (error: any) {
      alert(error.message || "Failed to update payment status");
    }
  };

  // Calculate stats
  const stats = {
    total: allOrders?.length || 0,
    pending: allOrders?.filter(o => o.status === "pending").length || 0,
    inProgress: allOrders?.filter(o => o.status === "in-progress").length || 0,
    ready: allOrders?.filter(o => o.status === "ready").length || 0,
    completed: allOrders?.filter(o => o.status === "completed").length || 0,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      <StaffSidebar userName={user.name} userEmail={user.email} />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Manage Laundry
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  View and manage all laundry
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={20} />
                New Laundry
              </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by laundry ID, customer name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="id-asc">ID (A-Z)</option>
                <option value="id-desc">ID (Z-A)</option>
                <option value="total-desc">Total (High to Low)</option>
                <option value="total-asc">Total (Low to High)</option>
              </select>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.pending}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">In Progress</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.inProgress}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">Ready</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.ready}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.completed}</p>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              {!sortedOrders ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : sortedOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  {searchQuery ? "No laundry found" : "No laundry yet. Create your first laundry!"}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Actions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Laundry ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {paginatedOrders.map((order) => (
                          <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleViewOrder(order)}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="View details"
                              >
                                <Eye size={18} />
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {order.orderId}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {order.customer?.name}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                {order.customer?.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-600 dark:text-slate-300">
                                {formatOrderType(order.orderType)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {order.pricing?.totalPrice ? `₱${order.pricing.totalPrice}` : "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {formatTimestamp(order.createdAt)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                          <span className="font-medium">{Math.min(endIndex, sortedOrders.length)}</span> of{' '}
                          <span className="font-medium">{sortedOrders.length}</span> results
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
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* View/Edit Order Modal */}
      {isViewModalOpen && selectedOrder && (
        <ViewOrderModal
          order={selectedOrder}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedOrder(null);
          }}
          onUpdateStatus={handleUpdateStatus}
          onUpdatePayment={handleUpdatePayment}
          sendReadyEmail={sendReadyEmail}
          getStatusBadgeColor={getStatusBadgeColor}
          getPaymentBadgeColor={getPaymentBadgeColor}
          getStatusLabel={getStatusLabel}
          formatTimestamp={formatTimestamp}
          formatOrderType={formatOrderType}
        />
      )}

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <CreateOrderModal
          customers={allCustomers || []}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={async (data) => {
            try {
              const customer = allCustomers?.find(c => c._id === data.customerId);
              
              if (!customer) {
                alert("Customer not found");
                return;
              }

              console.log('Step 1: Generating laundry ID...');
              const orderId = await generateOrderId();
              
              console.log('Generated laundry ID:', orderId);
              console.log('Step 2: Sending confirmation email...');
              
              const emailResult = await sendOrderEmail(
                {
                  orderId: orderId,
                  orderType: data.orderType,
                  expectedPickupDate: data.expectedPickupDate,
                },
                customer.email,
                customer.name
              );
              
              if (!emailResult.success) {
                throw new Error(`Failed to send confirmation email: ${emailResult.error}`);
              }
              
              console.log('Email sent successfully!');
              console.log('Step 3: Creating laundry in database...');
              
              await createOrder({
                ...data,
                orderId: orderId,
              });
              
              console.log('Laundry created successfully!');
              
              alert(`✅ Laundry ${orderId} created successfully!\n\nConfirmation email sent to ${customer.email}`);
              setIsCreateModalOpen(false);
              
            } catch (error: any) {
              console.error('Error creating laundry:', error);
              alert(`❌ Failed to create laundry:\n\n${error.message}\n\nPlease check your email configuration and try again.`);
            }
          }}
          createCustomer={createCustomer}
        />
      )}
    </div>
  );
}

// View Order Modal Component
function ViewOrderModal({
  order,
  onClose,
  onUpdateStatus,
  onUpdatePayment,
  sendReadyEmail,
  getStatusBadgeColor,
  getPaymentBadgeColor,
  getStatusLabel,
  formatTimestamp,
  formatOrderType,
}: any) {
  const [weight, setWeight] = useState({
    clothes: order.weight?.clothes || 0,
    blanketsLight: order.weight?.blanketsLight || 0,
    blanketsThick: order.weight?.blanketsThick || 0,
  });
  const [isMarkingReady, setIsMarkingReady] = useState(false);

  // Get current pricing
  const pricing = useQuery(api.pricingConfig.getCurrentPricing);

  // Calculate total price based on weight
  const calculateTotal = () => {
    if (!pricing) return 0;
    
    let total = 0;
    if (order.orderType.clothes && weight.clothes > 0) {
      total += weight.clothes * pricing.clothesPricePerKg;
    }
    if (order.orderType.blanketsLight && weight.blanketsLight > 0) {
      total += weight.blanketsLight * pricing.blanketsLightPricePerKg;
    }
    if (order.orderType.blanketsThick && weight.blanketsThick > 0) {
      total += weight.blanketsThick * pricing.blanketsThickPricePerKg;
    }
    return total;
  };

  const totalPrice = calculateTotal();

  // Check if all required weights are entered
  const areAllWeightsEntered = () => {
    if (order.orderType.clothes && weight.clothes <= 0) return false;
    if (order.orderType.blanketsLight && weight.blanketsLight <= 0) return false;
    if (order.orderType.blanketsThick && weight.blanketsThick <= 0) return false;
    return true;
  };

  const handleMarkAsReady = async () => {
    if (!areAllWeightsEntered()) {
      alert("Please enter weight for all laundry types before marking as ready.");
      return;
    }
    
    if (totalPrice === 0) return;
    
    setIsMarkingReady(true);
    try {
      // Calculate pricing breakdown
      const pricingBreakdown: any = {
        totalPrice: totalPrice,
      };
      
      if (order.orderType.clothes && weight.clothes > 0) {
        pricingBreakdown.clothesPrice = weight.clothes * (pricing?.clothesPricePerKg || 0);
      }
      if (order.orderType.blanketsLight && weight.blanketsLight > 0) {
        pricingBreakdown.blanketsLightPrice = weight.blanketsLight * (pricing?.blanketsLightPricePerKg || 0);
      }
      if (order.orderType.blanketsThick && weight.blanketsThick > 0) {
        pricingBreakdown.blanketsThickPrice = weight.blanketsThick * (pricing?.blanketsThickPricePerKg || 0);
      }

      // STEP 1: Send email notification FIRST
      console.log('Step 1: Sending ready notification email...');
      const emailResult = await sendReadyEmail(
        order.orderId,
        order.customer?.email,
        order.customer?.name,
        weight,
        pricingBreakdown
      );

      if (!emailResult.success) {
        // Email failed - ask user if they want to continue
        const shouldContinue = confirm(
          `⚠️ Failed to send email notification:\n\n${emailResult.error}\n\nDo you want to mark the laundry as ready anyway?\n\nYou will need to notify the customer manually.`
        );
        
        if (!shouldContinue) {
          setIsMarkingReady(false);
          return;
        }
      }

      // STEP 2: Update order status after email is sent (or user confirmed to continue)
      console.log('Step 2: Updating laundry status to ready...');
      await onUpdateStatus(order._id, "ready", weight);

      // Show success message
      if (emailResult.success) {
        alert(`✅ Laundry marked as ready!\n\nNotification email sent to ${order.customer?.email}`);
      } else {
        alert(`✅ Laundry marked as ready!\n\n⚠️ Note: Email notification failed. Please notify customer manually.`);
      }
    } catch (error: any) {
      console.error('Error marking laundry as ready:', error);
      alert(`❌ Failed to mark laundry as ready:\n\n${error.message}`);
    } finally {
      setIsMarkingReady(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Laundry Details
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Laundry ID
              </label>
              <p className="text-slate-900 dark:text-slate-100 font-medium">{order.orderId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Status
              </label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Customer
            </label>
            <p className="text-slate-900 dark:text-slate-100">{order.customer?.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{order.customer?.email}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{order.customer?.phone}</p>
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Laundry Type
            </label>
            <p className="text-slate-900 dark:text-slate-100">
              {formatOrderType(order.orderType)}
            </p>
          </div>

          {/* Weight (if ready or completed) */}
          {(order.status === "ready" || order.status === "completed") && order.weight && (
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Weight
              </label>
              <div className="grid grid-cols-2 gap-4">
                {order.orderType.clothes && (
                  <p className="text-slate-900 dark:text-slate-100">
                    Clothes: {order.weight.clothes || 0} kg
                  </p>
                )}
                {order.orderType.blanketsLight && (
                  <p className="text-slate-900 dark:text-slate-100">
                    Light Blankets: {order.weight.blanketsLight || 0} kg
                  </p>
                )}
                {order.orderType.blanketsThick && (
                  <p className="text-slate-900 dark:text-slate-100">
                    Thick Blankets: {order.weight.blanketsThick || 0} kg
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pricing */}
          {order.pricing && (
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Pricing
              </label>
              <div className="space-y-1">
                {order.pricing.clothesPrice && (
                  <p className="text-slate-600 dark:text-slate-300">
                    Clothes: ₱{order.pricing.clothesPrice.toFixed(2)}
                  </p>
                )}
                {order.pricing.blanketsLightPrice && (
                  <p className="text-slate-600 dark:text-slate-300">
                    Light Blankets: ₱{order.pricing.blanketsLightPrice.toFixed(2)}
                  </p>
                )}
                {order.pricing.blanketsThickPrice && (
                  <p className="text-slate-600 dark:text-slate-300">
                    Thick Blankets: ₱{order.pricing.blanketsThickPrice.toFixed(2)}
                  </p>
                )}
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 pt-2 border-t">
                  Total: ₱{order.pricing.totalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Payment Status - Only show for completed orders */}
          {order.status === "completed" && (
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Payment Status
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-sm font-medium text-green-800 dark:text-green-300 text-center">
                  ✓ Paid (Order Completed)
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Payment is automatically processed upon completion
              </p>
            </div>
          )}

          {/* Update Status - Mark as Ready */}
          {order.status === "in-progress" && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Mark as Ready (Add Weight) - All fields required
              </label>
              <div className="space-y-3 mb-4">
                {order.orderType.clothes && (
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Clothes (kg) * - ₱{pricing?.clothesPricePerKg || 0}/kg
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={weight.clothes}
                        onChange={(e) => setWeight({ ...weight, clothes: parseInt(e.target.value) || 0 })}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        required
                      />
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 min-w-[80px] text-right">
                        ₱{((weight.clothes || 0) * (pricing?.clothesPricePerKg || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                {order.orderType.blanketsLight && (
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Light Blankets (kg) * - ₱{pricing?.blanketsLightPricePerKg || 0}/kg
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={weight.blanketsLight}
                        onChange={(e) => setWeight({ ...weight, blanketsLight: parseInt(e.target.value) || 0 })}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        required
                      />
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 min-w-[80px] text-right">
                        ₱{((weight.blanketsLight || 0) * (pricing?.blanketsLightPricePerKg || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                {order.orderType.blanketsThick && (
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Thick Blankets (kg) * - ₱{pricing?.blanketsThickPricePerKg || 0}/kg
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={weight.blanketsThick}
                        onChange={(e) => setWeight({ ...weight, blanketsThick: parseInt(e.target.value) || 0 })}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        required
                      />
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 min-w-[80px] text-right">
                        ₱{((weight.blanketsThick || 0) * (pricing?.blanketsThickPricePerKg || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Price Display */}
              <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Amount:</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    ₱{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleMarkAsReady}
                disabled={!areAllWeightsEntered() || isMarkingReady}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMarkingReady ? 'Sending notification...' : `Mark as Ready - ₱${totalPrice.toFixed(2)}`}
              </button>
              {!areAllWeightsEntered() && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">
                  Please enter weight for all laundry types
                </p>
              )}
            </div>
          )}

          {/* Status Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Update Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {order.status === "pending" && (
                <button
                  onClick={() => onUpdateStatus(order._id, "in-progress")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Start Processing
                </button>
              )}
              {order.status === "ready" && (
                <button
                  onClick={async () => {
                    await onUpdateStatus(order._id, "completed");
                    await onUpdatePayment(order._id, "paid");
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Mark Completed
                </button>
              )}
              {order.status !== "completed" && order.status !== "cancelled" && (
                <button
                  onClick={() => onUpdateStatus(order._id, "cancelled")}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel Laundry
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Notes
              </label>
              <p className="text-slate-600 dark:text-slate-300">{order.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>Created: {formatTimestamp(order.createdAt)}</p>
            {order.completedAt && <p>Completed: {formatTimestamp(order.completedAt)}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Order Modal Component
function CreateOrderModal({
  customers,
  onClose,
  onCreate,
  createCustomer,
}: {
  customers: any[];
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
  createCustomer: any;
}) {
  // Get minimum date (today)
  const getMinDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    customerId: "",
    orderType: {
      clothes: false,
      blanketsLight: false,
      blanketsThick: false,
    },
    notes: "",
    pickupDate: "",
    pickupTime: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
      alert("Please fill in all required customer fields");
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const customerId = await createCustomer({
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        notes: newCustomer.notes || undefined,
      });
      
      setFormData({ ...formData, customerId });
      setShowAddCustomer(false);
      setNewCustomer({ name: "", email: "", phone: "", notes: "" });
      alert("Customer added successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to create customer");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId) {
      alert("Please select a customer");
      return;
    }
    
    if (!formData.orderType.clothes && !formData.orderType.blanketsLight && !formData.orderType.blanketsThick) {
      alert("Please select at least one laundry type");
      return;
    }

    // Check if date and time are both provided
    if (!formData.pickupDate || !formData.pickupTime) {
      alert("Please select both pickup date and time");
      return;
    }

    // Combine date and time
    const dateTimeString = `${formData.pickupDate}T${formData.pickupTime}`;
    const dateTime = new Date(dateTimeString);
    
    // Validate that the datetime is in the future
    if (dateTime <= new Date()) {
      alert("Expected pickup date must be in the future");
      return;
    }
    
    const expectedPickupDate = dateTime.getTime();

    setIsSubmitting(true);
    try {
      await onCreate({
        customerId: formData.customerId as Id<"customers">,
        orderType: formData.orderType,
        notes: formData.notes || undefined,
        expectedPickupDate,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time slots (every 30 minutes from 8 AM to 8 PM)
  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hourStr = String(hour).padStart(2, '0');
      const minuteStr = String(minute).padStart(2, '0');
      const time24 = `${hourStr}:${minuteStr}`;
      
      // Format for display (12-hour)
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const display = `${hour12}:${minuteStr} ${ampm}`;
      
      timeSlots.push({ value: time24, display });
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {showAddCustomer ? "Add New Customer" : "Create New Laundry"}
          </h2>
        </div>

        {showAddCustomer ? (
          // Add Customer Form
          <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                required
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                placeholder="+63 912 345 6789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                placeholder="Additional customer information..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddCustomer(false);
                  setNewCustomer({ name: "", email: "", phone: "", notes: "" });
                }}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isCreatingCustomer}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingCustomer ? "Adding..." : "Add Customer"}
              </button>
            </div>
          </form>
        ) : (
          // Create Order Form
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Customer *
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + Add New Customer
                </button>
              </div>
              <select
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Laundry Type *
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.orderType.clothes}
                    onChange={(e) => setFormData({
                      ...formData,
                      orderType: { ...formData.orderType, clothes: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Clothes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.orderType.blanketsLight}
                    onChange={(e) => setFormData({
                      ...formData,
                      orderType: { ...formData.orderType, blanketsLight: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Light Blankets</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.orderType.blanketsThick}
                    onChange={(e) => setFormData({
                      ...formData,
                      orderType: { ...formData.orderType, blanketsThick: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Thick Blankets</span>
                </label>
              </div>
            </div>

            {/* Date and Time Picker with Better UI */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Expected Pickup Date & Time *
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Date Picker */}
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <Calendar className="inline w-3 h-3 mr-1" />
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.pickupDate}
                    min={getMinDate()}
                    onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Time Picker */}
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <Clock className="inline w-3 h-3 mr-1" />
                    Time *
                  </label>
                  <select
                    required
                    value={formData.pickupTime}
                    onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                    disabled={!formData.pickupDate}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.display}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Both date and time are required. Available times: 8:00 AM - 8:00 PM
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                placeholder="Special instructions or notes..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Laundry"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}