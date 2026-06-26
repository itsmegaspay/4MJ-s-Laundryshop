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
        regularClothesPrice: String(currentPricing.regularClothesPrice ?? 230),
        assortedClothesPrice: String(currentPricing.assortedClothesPrice ?? 230),
        towelBlanketsPrice: String(currentPricing.towelBlanketsPrice ?? 230),
        comforterPrice: String(currentPricing.comforterPrice ?? 250),
        storageFeePerDay: String(currentPricing.storageFeePerDay ?? 15),
        selfServiceWashPrice: String(currentPricing.selfServiceWashPrice ?? 80),
        selfServiceSpinPrice: String(currentPricing.selfServiceSpinPrice ?? 35),
        selfServiceDryPrice: String(currentPricing.selfServiceDryPrice ?? 120),
      });
    }
  }, [currentPricing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(""); setErrorMessage("");
    const parsed: any = {};
    for (const [k, v] of Object.entries(prices)) { parsed[k] = parseInt(v) || 0; }
    setIsSubmitting(true);
    try {
      await updatePricing(parsed);
      setSuccessMessage("Pricing updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update pricing");
    } finally { setIsSubmitting(false); }
  };

  if (user === undefined || currentPricing === undefined) {
    return <div className="flex min-h-screen items-center justify-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" /></div>;
  }
  if (user === null) return null;

  const Field = ({ label, sub, field, unit = "/load" }: { label: string; sub?: string; field: string; unit?: string }) => (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-slate-500">₱</span>
        <input type="number" min="0" step="1"
          value={prices[field as keyof typeof prices]}
          onChange={(e) => setPrices(p => ({ ...p, [field]: e.target.value }))}
          className="w-24 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-right bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          required
        />
        <span className="text-xs text-slate-400 w-16">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      <AdminSidebar userName={user.name} userEmail={user.email} />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">Set Price</h1>
          <p className="text-slate-500 mb-6">Configure prices for all 4MJ's Laundry service categories</p>

          {successMessage && <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg text-green-800">✅ {successMessage}</div>}
          {errorMessage && <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">❌ {errorMessage}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Service */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Shirt size={18} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Full Service / Drop Off</h2>
              </div>
              <Field label="Regular Clothes" sub="Max 7kg per load" field="regularClothesPrice" />
              <Field label="Assorted Color Clothes" sub="Max 7kg per load" field="assortedClothesPrice" />
              <Field label="Towel & Blankets" sub="Max 5kg per load" field="towelBlanketsPrice" />
              <Field label="Comforter" sub="Small & Medium size" field="comforterPrice" />
              <Field label="Storage Fee" sub="Charged after 2 days" field="storageFeePerDay" unit="/day" />
            </div>

            {/* Self Service */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <WashingMachine size={18} className="text-purple-600" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Self-Service</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">Liquid detergent & fabcon not included · Max 7kg per load</p>
              <Field label="Wash Only" field="selfServiceWashPrice" unit="/session" />
              <Field label="Spinning (10 mins)" field="selfServiceSpinPrice" unit="/session" />
              <Field label="Dry Only" field="selfServiceDryPrice" unit="/session" />
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50">
              <Save size={18} />
              {isSubmitting ? "Saving..." : "Save All Prices"}
            </button>
          </form>

          {/* Current Prices Summary */}
          <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Currently Active Prices</h3>
            <div className="space-y-1.5 text-sm">
              <p className="text-xs font-medium text-slate-400 uppercase mt-2 mb-1">Full Service</p>
              {([
                ["Regular Clothes", currentPricing.regularClothesPrice ?? 230, "/load"],
                ["Assorted Color Clothes", currentPricing.assortedClothesPrice ?? 230, "/load"],
                ["Towel & Blankets", currentPricing.towelBlanketsPrice ?? 230, "/load"],
                ["Comforter", currentPricing.comforterPrice ?? 250, "/load"],
                ["Storage Fee", currentPricing.storageFeePerDay ?? 15, "/day"],
              ] as [string, number, string][]).map(([l, v, u]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{l}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">₱{v}{u}</span>
                </div>
              ))}
              <p className="text-xs font-medium text-slate-400 uppercase mt-3 mb-1">Self-Service</p>
              {([
                ["Wash Only", currentPricing.selfServiceWashPrice ?? 80, "/session"],
                ["Spinning (10 mins)", currentPricing.selfServiceSpinPrice ?? 35, "/session"],
                ["Dry Only", currentPricing.selfServiceDryPrice ?? 120, "/session"],
              ] as [string, number, string][]).map(([l, v, u]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{l}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">₱{v}{u}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-4">
            <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">Important Notes</h4>
            <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
              <li>• Prices are automatically applied to new orders</li>
              <li>• Existing orders keep their original pricing</li>
              <li>• Changes are logged in the audit trail</li>
              <li>• Only administrators can modify prices</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
