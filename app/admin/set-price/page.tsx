"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/Adminsidebar";
import { Save, Shirt, WashingMachine } from "lucide-react";

export default function SetPricePage() {
  const user = useQuery(api.users.getCurrentUser);
  const currentPricing = useQuery(api.pricingConfig.getCurrentPricing);
  const updatePricing = useMutation(api.pricingConfig.updatePricing);
  const router = useRouter();

  const [prices, setPrices] = useState({
    regularClothesPrice: "230",
    assortedClothesPrice: "230",
    towelBlanketsPrice: "230",
    comforterPrice: "250",
    storageFeePerDay: "15",
    selfServiceWashPrice: "80",
    selfServiceSpinPrice: "35",
    selfServiceDryPrice: "120",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) { router.push("/signin"); return; }
    if (user.role !== "admin") router.push("/staff");
  }, [user, router]);

  useEffect(() => {
    if (currentPricing) {
      setPrices({
        regularClothesPrice: (currentPricing.regularClothesPrice ?? 230).toString(),
        assortedClothesPrice: (currentPricing.assortedClothesPrice ?? 230).toString(),
        towelBlanketsPrice: (currentPricing.towelBlanketsPrice ?? 230).toString(),
        comforterPrice: (currentPricing.comforterPrice ?? 250).toString(),
        storageFeePerDay: (currentPricing.storageFeePerDay ?? 15).toString(),
        selfServiceWashPrice: (currentPricing.selfServiceWashPrice ?? 80).toString(),
        selfServiceSpinPrice: (currentPricing.selfServiceSpinPrice ?? 35).toString(),
        selfServiceDryPrice: (currentPricing.selfServiceDryPrice ?? 120).toString(),
      });
    }
  }, [currentPricing]);

  const handleChange = (field: string, value: string) => {
    setPrices((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    const parsed = Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, parseInt(v)]));
    if (Object.values(parsed).some((v) => isNaN(v as number) || (v as number) < 0)) {
      setErrorMessage("All prices must be valid numbers (0 or greater).");
      return;
    }
    setIsSubmitting(true);
    try {
      await updatePricing(parsed as any);
      setSuccessMessage("Pricing updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(`Failed to update pricing: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user === undefined || currentPricing === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }
  if (user === null) return null;

  const PriceField = ({ label, subtitle, field, unit = "/load" }: { label: string; subtitle?: string; field: string; unit?: string; }) => (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-slate-500 font-medium">₱</span>
        <input
          type="number" min="0" step="1"
          value={prices[field as keyof typeof prices]}
          onChange={(e) => handleChange(field, e.target.value)}
          className="w-24 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-right"
          required
        />
        <span className="text-xs text-slate-400 w-16">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      <AdminSidebar userName={user.name} userEmail={user.email} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Set Price</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Configure prices for all service categories</p>
            </div>

            {successMessage && (
              <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-medium">✅ {successMessage}</p>
              </div>
            )}
            {errorMessage && (
              <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-medium">❌ {errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Service */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shirt size={18} className="text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Full Service / Drop Off</h2>
                </div>
                <PriceField label="Regular Clothes" subtitle="Max 7kg per load" field="regularClothesPrice" />
                <PriceField label="Assorted Color Clothes" subtitle="Max 7kg per load" field="assortedClothesPrice" />
                <PriceField label="Towel & Blankets" subtitle="Max 5kg per load" field="towelBlanketsPrice" />
                <PriceField label="Comforter" subtitle="Small & Medium size" field="comforterPrice" />
                <PriceField label="Storage Fee" subtitle="Charged after 2 days" field="storageFeePerDay" unit="/day" />
              </div>

              {/* Self-Service */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-1">
                  <WashingMachine size={18} className="text-purple-600" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Self-Service</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Liquid detergent & fabcon not included · Max 7kg per load</p>
                <PriceField label="Wash Only" field="selfServiceWashPrice" unit="/session" />
                <PriceField label="Spinning (10 mins)" field="selfServiceSpinPrice" unit="/session" />
                <PriceField label="Dry Only" field="selfServiceDryPrice" unit="/session" />
              </div>

              <button type="submit" disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Save size={20} />
                {isSubmitting ? "Saving..." : "Save All Prices"}
              </button>
            </form>

            {/* Active Pricing Summary */}
            <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">Currently Active Pricing</h3>
              <div className="space-y-1 text-sm">
                <p className="text-xs font-medium text-slate-500 uppercase mb-2">Full Service</p>
                {[["Regular Clothes", currentPricing.regularClothesPrice ?? 230, "/load"],["Assorted Color Clothes", currentPricing.assortedClothesPrice ?? 230, "/load"],["Towel & Blankets", currentPricing.towelBlanketsPrice ?? 230, "/load"],["Comforter", currentPricing.comforterPrice ?? 250, "/load"],["Storage Fee", currentPricing.storageFeePerDay ?? 15, "/day"]].map(([l, v, u]) => (
                  <div key={l as string} className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">{l as string}</span><span className="font-semibold text-slate-900 dark:text-slate-100">₱{v as number}{u as string}</span></div>
                ))}
                <p className="text-xs font-medium text-slate-500 uppercase mt-3 mb-2">Self-Service</p>
                {[["Wash Only", currentPricing.selfServiceWashPrice ?? 80, "/session"],["Spinning (10 mins)", currentPricing.selfServiceSpinPrice ?? 35, "/session"],["Dry Only", currentPricing.selfServiceDryPrice ?? 120, "/session"]].map(([l, v, u]) => (
                  <div key={l as string} className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">{l as string}</span><span className="font-semibold text-slate-900 dark:text-slate-100">₱{v as number}{u as string}</span></div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">Last updated: {new Date(currentPricing.updatedAt).toLocaleString()}</div>
            </div>

            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">Important Notes</h4>
              <ul className="space-y-1.5 text-sm text-amber-800 dark:text-amber-300">
                <li className="flex gap-2"><span>•</span><span>Prices are automatically applied to new orders</span></li>
                <li className="flex gap-2"><span>•</span><span>Existing orders keep their original pricing</span></li>
                <li className="flex gap-2"><span>•</span><span>Changes are logged in the audit trail</span></li>
                <li className="flex gap-2"><span>•</span><span>Only administrators can modify prices</span></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
