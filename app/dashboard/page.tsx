"use client";

import { useRouter } from "next/navigation";
import { useSyncUser } from "@/hooks/userSyncUser";
import { useEffect } from "react";

export default function Dashboard() {
  const user = useSyncUser();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return; // Still loading
    
    if (user === null) {
      router.push("/signin");
      return;
    }
    
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case "admin":
        router.push("/admin");
        break;
      case "staff":
        router.push("/staff");
        break;
      default:
        // Handle unexpected roles - maybe redirect to a default page or error
        console.error("Unknown user role:", user.role);
        router.push("/signin"); // Or a "no access" page
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
}