import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook to automatically sync the authenticated user to the database
 * Call this in protected pages that need user role info
 */
export function useSyncUser() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const syncUser = useMutation(api.users.syncUser);
  const hasSynced = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Reset sync status when user changes (sign out/in)
    if (currentUser === null) {
      hasSynced.current = false;
      setIsSyncing(false);
      return;
    }

    // Wait for user data to load
    if (currentUser === undefined) return;
    
    // User already has a role, no need to sync
    if (currentUser.role) {
      hasSynced.current = true;
      setIsSyncing(false);
      return;
    }

    // Already syncing or synced
    if (hasSynced.current || isSyncing) return;

    // User needs to be synced (missing role)
    const performSync = async () => {
      setIsSyncing(true);
      try {
        await syncUser({
          email: currentUser.email,
          name: currentUser.name,
        });
        hasSynced.current = true;
      } catch (error) {
        console.error("Failed to sync user:", error);
        hasSynced.current = false; // Allow retry
      } finally {
        setIsSyncing(false);
      }
    };

    performSync();
  }, [currentUser, syncUser, isSyncing]);

  // Return undefined while syncing to prevent premature actions
  // This is crucial - don't return the user until they have a role
  if (currentUser && !currentUser.role && !hasSynced.current) {
    return undefined;
  }

  return currentUser;
}