"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WashingMachine, ArrowLeft, Package, Clock, CheckCircle2, XCircle, Loader2, CreditCard, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function TrackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");

  const order = useQuery(
    api.laundryOrdersQueries.getOrderByOrderId,
    orderId ? { orderId } : "skip"
  );

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
          label: "Pending",
          description: "Your laundry has been received and is waiting to be processed.",
        };
      case "in-progress":
        return {
          icon: Loader2,
          color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
          label: "In Progress",
          description: "Your laundry is currently being washed and processed.",
        };
      case "ready":
        return {
          icon: CheckCircle2,
          color: "text-green-600 bg-green-100 dark:bg-green-900/30",
          label: "Ready",
          description: "Your laundry is clean and ready! Please come pick it up.",
        };
      case "completed":
        return {
          icon: CheckCircle2,
          color: "text-green-700 bg-green-100 dark:bg-green-900/30",
          label: "Completed",
          description: "Laundry completed and picked up.",
        };
      case "cancelled":
        return {
          icon: XCircle,
          color: "text-red-600 bg-red-100 dark:bg-red-900/30",
          label: "Cancelled",
          description: "This laundry order has been cancelled.",
        };
      default:
        return {
          icon: Package,
          color: "text-gray-600 bg-gray-100 dark:bg-gray-900/30",
          label: status,
          description: "",
        };
    }
  };

  const getTimeline = (order: any) => {
    const timeline = [];
    
    // Laundry placed
    timeline.push({
      status: "pending",
      label: "Laundry Received",
      description: "Your laundry has been received",
      timestamp: order.createdAt,
      completed: true,
      icon: Package,
      cancelled: false,
    });

    // In progress
    const inProgressCompleted = ["in-progress", "ready", "completed"].includes(order.status);
    timeline.push({
      status: "in-progress",
      label: "Processing",
      description: "Your laundry is being washed",
      timestamp: order.inProgressAt || null,
      completed: inProgressCompleted,
      icon: Loader2,
      cancelled: false,
    });

    // Ready
    const readyCompleted = ["ready", "completed"].includes(order.status);
    timeline.push({
      status: "ready",
      label: "Ready",
      description: "Your laundry is ready! Please come pick it up",
      timestamp: order.readyAt || null,
      completed: readyCompleted,
      icon: CheckCircle2,
      cancelled: false,
    });

    // Completed
    timeline.push({
      status: "completed",
      label: "Completed",
      description: "Laundry has been picked up",
      timestamp: order.completedAt || null,
      completed: order.status === "completed",
      icon: CheckCircle2,
      cancelled: false,
    });

    // If cancelled, show it
    if (order.status === "cancelled") {
      return [{
        status: "cancelled",
        label: "Laundry Cancelled",
        description: order.cancellationReason || "Laundry order was cancelled",
        timestamp: order.cancelledAt || order.updatedAt,
        completed: true,
        icon: XCircle,
        cancelled: true,
      }];
    }

    return timeline;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateMobile = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimelineDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/" className="flex items-center gap-1 sm:gap-2 text-xl sm:text-2xl font-bold">
              <WashingMachine size={24} className="sm:w-[27px] sm:h-[27px]" />
              <span>4MJ's</span>
            </Link>
          </div>
        </header>
        <main className="flex min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-73px)] items-center justify-center p-4 sm:p-6">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">No Tracking Number</CardTitle>
              <CardDescription className="text-sm">Please provide a tracking number to view laundry details.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/")} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (order === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/" className="flex items-center gap-1 sm:gap-2 text-xl sm:text-2xl font-bold">
              <WashingMachine size={24} className="sm:w-[27px] sm:h-[27px]" />
              <span>4MJ's</span>
            </Link>
          </div>
        </header>
        <main className="flex min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-73px)] items-center justify-center p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
            <p className="text-base sm:text-lg">Loading laundry details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/" className="flex items-center gap-1 sm:gap-2 text-xl sm:text-2xl font-bold">
              <WashingMachine size={24} className="sm:w-[27px] sm:h-[27px]" />
              <span>4MJ's</span>
            </Link>
          </div>
        </header>
        <main className="flex min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-73px)] items-center justify-center p-4 sm:p-6">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Laundry Not Found</CardTitle>
              <CardDescription className="text-sm">
                We couldn't find a laundry order with tracking number: <strong className="break-all">{orderId}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please check the tracking number and try again. Make sure you've entered it correctly.
              </p>
              <Button onClick={() => router.push("/")} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  const timeline = getTimeline(order);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="px-4 py-3 sm:px-6 sm:py-4 flex flex-row justify-between items-center">
          <Link href="/" className="flex items-center gap-1 sm:gap-2 text-xl sm:text-2xl font-bold">
            <WashingMachine size={24} className="sm:w-[27px] sm:h-[27px]" />
            <span>4MJ's</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-xs sm:text-sm">
            <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Back
          </Button>
        </div>
      </header>

      {/* Mobile-optimized main content */}
      <main className="container max-w-4xl mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Laundry Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Laundry Tracking</h1>
          <p className="text-sm sm:text-base text-muted-foreground break-all">
            Tracking: <span className="font-mono font-semibold">{order.orderId}</span>
          </p>
        </div>

        {/* Status Card - Mobile optimized */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg sm:text-2xl">Laundry Status</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Current status of your laundry</CardDescription>
              </div>
              <Badge className={`${statusInfo.color} px-2.5 py-1 sm:px-3 text-xs sm:text-sm font-medium w-fit`}>
                <StatusIcon className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-sm sm:text-base text-muted-foreground">{statusInfo.description}</p>
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
              Laundry Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="relative">
              {timeline.map((step, index) => {
                const StepIcon = step.icon;
                const isLast = index === timeline.length - 1;
                const isCancelled = step.cancelled;

                return (
                  <div key={index} className="relative flex gap-3 sm:gap-4 pb-6 sm:pb-8 last:pb-0">
                    {/* Timeline line */}
                    {!isLast && (
                      <div
                        className={`absolute left-[11px] sm:left-[13px] top-[28px] w-0.5 h-[calc(100%-28px)] ${
                          step.completed && !isCancelled
                            ? "bg-green-500"
                            : isCancelled
                            ? "bg-red-500"
                            : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full flex-shrink-0 ${
                        step.completed && !isCancelled
                          ? "bg-green-500 text-white"
                          : isCancelled
                          ? "bg-red-500 text-white"
                          : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <StepIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-0.5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                        <h3
                          className={`font-semibold text-sm sm:text-base ${
                            step.completed ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </h3>
                        {step.timestamp && (
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {formatTimelineDate(step.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Laundry Details - Mobile optimized */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-2xl">Laundry Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Customer Name</p>
                <p className="font-medium text-sm sm:text-base break-words">{order.customer?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Drop-off Date</p>
                <p className="font-medium text-sm sm:text-base">
                  <span className="hidden sm:inline">{formatDate(order.createdAt)}</span>
                  <span className="sm:hidden">{formatDateMobile(order.createdAt)}</span>
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Items</p>
              <div className="space-y-1.5 sm:space-y-2">
                {order.orderType.clothes && (
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span>Clothes</span>
                    {order.weight?.clothes && <span className="text-muted-foreground">{order.weight.clothes} kg</span>}
                  </div>
                )}
                {order.orderType.blanketsLight && (
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span>Light Blankets</span>
                    {order.weight?.blanketsLight && <span className="text-muted-foreground">{order.weight.blanketsLight} kg</span>}
                  </div>
                )}
                {order.orderType.blanketsThick && (
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span>Thick Blankets</span>
                    {order.weight?.blanketsThick && <span className="text-muted-foreground">{order.weight.blanketsThick} kg</span>}
                  </div>
                )}
              </div>
            </div>

            {order.expectedPickupDate && (
              <>
                <Separator />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Expected Pickup Date</p>
                  <p className="font-medium text-sm sm:text-base">
                    <span className="hidden sm:inline">{formatDate(order.expectedPickupDate)}</span>
                    <span className="sm:hidden">{formatDateMobile(order.expectedPickupDate)}</span>
                  </p>
                </div>
              </>
            )}

            {order.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium text-sm sm:text-base break-words">{order.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pricing Card - Mobile optimized */}
        {order.pricing && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <CardTitle className="text-lg sm:text-2xl">Pricing</CardTitle>
                <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"} className="w-fit">
                  <CreditCard className="mr-1 sm:mr-1.5 h-3 w-3" />
                  {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-2">
              {order.pricing.clothesPrice && order.pricing.clothesPrice > 0 && (
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Clothes</span>
                  <span className="font-medium">₱{order.pricing.clothesPrice.toFixed(2)}</span>
                </div>
              )}
              {order.pricing.blanketsLightPrice && order.pricing.blanketsLightPrice > 0 && (
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Light Blankets</span>
                  <span className="font-medium">₱{order.pricing.blanketsLightPrice.toFixed(2)}</span>
                </div>
              )}
              {order.pricing.blanketsThickPrice && order.pricing.blanketsThickPrice > 0 && (
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Thick Blankets</span>
                  <span className="font-medium">₱{order.pricing.blanketsThickPrice.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base sm:text-lg font-bold">
                <span>Total</span>
                <span>₱{order.pricing.totalPrice.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom spacing for mobile */}
        <div className="pb-4 sm:pb-0" />
      </main>
    </div>
  );
}