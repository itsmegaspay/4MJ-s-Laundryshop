"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { WashingMachine, Search } from 'lucide-react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Home() {
  const user = useQuery(api.users.getCurrentUser);
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleTrackLaundry = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingNumber.trim()) {
      return;
    }

    // Navigate to tracking page with the order ID
    router.push(`/track?id=${trackingNumber.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="px-4 py-3 sm:px-6 sm:py-4 flex flex-row justify-between items-center">
          <div className="flex items-center gap-1 sm:gap-2 text-xl sm:text-2xl font-bold">
            <WashingMachine size={24} className="sm:w-[27px] sm:h-[27px]" />
            <span className="truncate">4MJ's</span>
          </div>
          <div className="flex gap-2 sm:gap-3">
            {user ? (
              <Link
                href={user.role === "admin" ? "/admin" : "/staff"}
                className="bg-slate-600 hover:bg-slate-700 text-white rounded-lg px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/signin"
                className="bg-slate-600 hover:bg-slate-700 text-white rounded-lg px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium transition-all duration-200"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile-optimized main content */}
      <main className="flex min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-73px)] items-center justify-center px-4 py-8 sm:p-6">
        <div className="text-center max-w-2xl w-full space-y-6 sm:space-y-8">
          {/* Hero text */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              Track your laundry
            </h1>
            <p className="text-base sm:text-lg md:text-2xl text-muted-foreground px-4">
              <i>anywhere, anytime.</i>
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleTrackLaundry} className="space-y-3 sm:space-y-4 max-w-md mx-auto px-2 sm:px-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
              <Input
                type="text"
                placeholder="Enter tracking number..."
                className="pl-9 sm:pl-10 h-11 sm:h-12 text-base sm:text-lg"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            
            <Button 
              type="submit"
              size="lg" 
              className="w-full h-11 sm:h-12 text-base sm:text-lg font-light hover:brightness-90"
              disabled={!trackingNumber.trim()}
            >
              Track Laundry
            </Button>
          </form>

          {/* Helper text for mobile */}
          <p className="text-xs sm:text-sm text-muted-foreground px-4">
            Example: LND-20260128-001
          </p>
        </div>
      </main>
    </div>
  );
}