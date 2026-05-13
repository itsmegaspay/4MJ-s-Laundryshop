"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/Adminsidebar";
import { Save, DollarSign, Shirt, Bed } from "lucide-react";

export default function SetPricePage() {
  const user = useQuery(api.users.getCurrentUser);
  const currentPricing = useQuery(api.pricingConfig.getCurrentPricing);
  const updatePricing = useMutation(api.pricingConfig.updatePricing);
  const router = useRouter();

  const [clothesPrice, setClothesPrice] = useState<string>("");
  const [blanketsLightPrice, setBlanketsLightPrice] = useState<string>("");
  const [blanketsThickPrice, setBlanketsThickPrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Redirect if not admin
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

  // Load current pricing when it's available
  useEffect(() => {
    if (currentPricing) {
      setClothesPrice(currentPricing.clothesPricePerKg.toString());
      // Handle backward compatibility - use defaults if new fields don't exist yet
      setBlanketsLightPrice((currentPricing.blanketsLightPricePerKg || 70).toString());
      setBlanketsThickPrice((currentPricing.blanketsThickPricePerKg || 100).toString());
    }
  }, [currentPricing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    const clothesPriceNum = parseInt(clothesPrice);
    const blanketsLightPriceNum = parseInt(blanketsLightPrice);
    const blanketsThickPriceNum = parseInt(blanketsThickPrice);

    // Validation
    if (isNaN(clothesPriceNum) || clothesPriceNum <= 0 || !Number.isInteger(clothesPriceNum)) {
      setErrorMessage("Clothes price must be a positive whole number");
      return;
    }

    if (isNaN(blanketsLightPriceNum) || blanketsLightPriceNum <= 0 || !Number.isInteger(blanketsLightPriceNum)) {
      setErrorMessage("Light blankets price must be a positive whole number");
      return;
    }

    if (isNaN(blanketsThickPriceNum) || blanketsThickPriceNum <= 0 || !Number.isInteger(blanketsThickPriceNum)) {
      setErrorMessage("Thick blankets price must be a positive whole number");
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePricing({
        clothesPricePerKg: clothesPriceNum,
        blanketsLightPricePerKg: blanketsLightPriceNum,
        blanketsThickPricePerKg: blanketsThickPriceNum,
      });

      setSuccessMessage("✅ Pricing updated successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(`❌ Failed to update pricing: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateExample = (weight: number) => {
    const clothesPriceNum = parseInt(clothesPrice) || 0;
    const blanketsLightPriceNum = parseInt(blanketsLightPrice) || 0;
    const blanketsThickPriceNum = parseInt(blanketsThickPrice) || 0;

    return {
      clothes: (clothesPriceNum * weight).toFixed(0),
      blanketsLight: (blanketsLightPriceNum * weight).toFixed(0),
      blanketsThick: (blanketsThickPriceNum * weight).toFixed(0),
    };
  };

  if (user === undefined || currentPricing === undefined) {
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

  const exampleWeight = 5;
  const examples = calculateExample(exampleWeight);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      <AdminSidebar userName={user.name} userEmail={user.email} />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Set Price
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Configure the price per kilogram for each laundry type
              </p>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-medium">{successMessage}</p>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-medium">{errorMessage}</p>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pricing Form */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
                  Pricing Configuration
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Clothes Price */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <div className="flex items-center gap-2">
                        <Shirt size={16} />
                        Clothes Price (per kg)
                      </div>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={clothesPrice}
                        onChange={(e) => setClothesPrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        placeholder="50"
                        required
                      />
                    </div>
                  </div>

                  {/* Light Blankets Price */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <div className="flex items-center gap-2">
                        <Bed size={16} />
                        Light Blankets Price (per kg)
                      </div>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={blanketsLightPrice}
                        onChange={(e) => setBlanketsLightPrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        placeholder="70"
                        required
                      />
                    </div>
                  </div>

                  {/* Thick Blankets Price */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <div className="flex items-center gap-2">
                        <Bed size={16} className="text-slate-700 dark:text-slate-300" />
                        Thick Blankets Price (per kg)
                      </div>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={blanketsThickPrice}
                        onChange={(e) => setBlanketsThickPrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        placeholder="100"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={20} />
                    {isSubmitting ? "Saving..." : "Save Pricing"}
                  </button>
                </form>

                {/* Current Active Pricing Display */}
                {currentPricing && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Currently Active Pricing
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">Clothes:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          ₱{currentPricing.clothesPricePerKg}/kg
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">Light Blankets:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          ₱{currentPricing.blanketsLightPricePerKg || 70}/kg
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">Thick Blankets:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          ₱{currentPricing.blanketsThickPricePerKg || 100}/kg
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                        Last updated: {new Date(currentPricing.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Examples & Info */}
              <div className="space-y-6">
                {/* Example Calculations */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Example Calculations ({exampleWeight} kg each)
                  </h3>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Shirt size={14} />
                          <span>Clothes</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          ₱{examples.clothes}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Bed size={14} />
                          <span>Light Blankets</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          ₱{examples.blanketsLight}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Bed size={14} />
                          <span>Thick Blankets</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          ₱{examples.blanketsThick}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                          <DollarSign size={14} />
                          <span>All Combined</span>
                        </div>
                        <span className="text-xl font-bold text-blue-900 dark:text-blue-100">
                          ₱{(parseInt(examples.clothes) + parseInt(examples.blanketsLight) + parseInt(examples.blanketsThick)).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                    Important Notes
                  </h4>
                  <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Prices are automatically applied to new orders</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Existing orders keep their original pricing</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Changes are logged in the audit trail</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Only administrators can modify prices</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}