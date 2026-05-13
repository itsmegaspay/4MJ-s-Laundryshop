"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { WashingMachine } from 'lucide-react';

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8 w-full max-w-lg mx-auto h-screen justify-center items-center px-4">
      <div className="text-center flex flex-col items-center gap-4">
        <button type="button"
          onClick={() => router.push("/")}
          className="hover:brightness-90"
        >
          <div className="flex items-center gap-1 text-3xl font-bold">
            <WashingMachine size={35}/>
            4MJ's
          </div>
        </button>
        <div className="flex gap-6 items-center p-2">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            Login
          </h1>
          <div className="flex flex-col items-start text-left text-sm">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              Authorized Access Only
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              This system is intended for 4MJ's Laundry administrators and staff.
            </p>
          </div>
        </div>
      </div>

      <form
        className="flex flex-col gap-4 w-full bg-slate-100 dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-600"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);

          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", "signIn");

          try {
            // Just sign in - the useSyncUser hook on the dashboard will handle syncing
            await signIn("password", formData);
            
            // Redirect to dashboard where user will be synced and routed
            router.push("/dashboard");
          } catch (error: any) {
            console.error("Sign in error:", error);
            setError(error.message || "Failed to sign in");
            setLoading(false);
          }
        }}
      >
        <input
          className="bg-white dark:bg-slate-900 text-foreground rounded-lg p-3 border border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none transition-all placeholder:text-slate-400"
          type="email"
          name="email"
          placeholder="Email"
          required
        />

        <input
          className="bg-white dark:bg-slate-900 text-foreground rounded-lg p-3 border border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none transition-all placeholder:text-slate-400"
          type="password"
          name="password"
          placeholder="Password"
          required
        />

        <button
          className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-semibold rounded-lg py-3 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          type="submit"
          disabled={loading}
        >
          {loading ? "Loading..." : "Sign in"}
        </button>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 dark:border-rose-500/50 rounded-lg p-4">
            <p className="text-rose-700 dark:text-rose-300 font-medium text-sm break-words">
              Error: {error}
            </p>
          </div>
        )}

        <div className="text-center pt-2 border-t border-slate-300 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don`t have an account? Contact your administrator.
          </p>
        </div>
      </form>
    </div>
  );
}