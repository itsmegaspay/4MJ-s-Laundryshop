"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Search, Plus, Edit, Trash2, Phone, Mail, User } from "lucide-react";
import StaffSidebar from "@/components/Staffsidebar";
import { useRouter } from "next/navigation";

export default function ManageCustomersPage() {
  const user = useQuery(api.users.getCurrentUser);
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

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

  // Queries
  const searchResults = useQuery(api.customers.searchCustomers, { 
    query: searchQuery 
  });
  const allCustomers = useQuery(api.customers.getAllCustomers);

  // Mutations
  const createCustomer = useMutation(api.customers.createCustomer);
  const updateCustomer = useMutation(api.customers.updateCustomer);
  const deleteCustomer = useMutation(api.customers.deleteCustomer);

  const customers = searchQuery ? searchResults : allCustomers;

  const handleCreateCustomer = async (formData: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  }) => {
    try {
      await createCustomer(formData);
      setIsAddModalOpen(false);
    } catch (error: any) {
      alert(error.message || "Failed to create customer");
    }
  };

  const handleUpdateCustomer = async (formData: {
    customerId: Id<"customers">;
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => {
    try {
      await updateCustomer(formData);
      setEditingCustomer(null);
    } catch (error: any) {
      alert(error.message || "Failed to update customer");
    }
  };

  const handleDeleteCustomer = async (customerId: Id<"customers">) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    
    try {
      await deleteCustomer({ customerId });
    } catch (error: any) {
      alert(error.message || "Failed to delete customer");
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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      {/* Sidebar */}
      <StaffSidebar userName={user.name} userEmail={user.email} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Manage Customers
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                View, add, and manage customer information
              </p>
            </div>

            {/* Search and Add */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={20} />
                Add Customer
              </button>
            </div>

            {/* Customer List */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              {!customers ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : customers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  {searchQuery ? "No customers found" : "No customers yet. Add your first customer!"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {customers.map((customer) => (
                        <tr key={customer._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <User size={20} className="text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                  {customer.name}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  Added {new Date(customer.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <Mail size={16} className="text-slate-400" />
                                {customer.email}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <Phone size={16} className="text-slate-400" />
                                {customer.phone}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">
                              {customer.notes || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingCustomer(customer)}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Edit customer"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer._id)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Delete customer"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add Customer Modal */}
            {isAddModalOpen && (
              <CustomerModal
                title="Add New Customer"
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleCreateCustomer}
              />
            )}

            {/* Edit Customer Modal */}
            {editingCustomer && (
              <CustomerModal
                title="Edit Customer"
                initialData={editingCustomer}
                onClose={() => setEditingCustomer(null)}
                onSubmit={(data) => handleUpdateCustomer({ 
                  customerId: editingCustomer._id, 
                  ...data 
                })}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Customer Modal Component
function CustomerModal({
  title,
  initialData,
  onClose,
  onSubmit,
}: {
  title: string;
  initialData?: any;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    notes: initialData?.notes || "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if email already exists (only when email changes and is valid format)
  const [emailToCheck, setEmailToCheck] = useState<string | null>(null);
  const existingEmailCustomer = useQuery(
    api.customers.getCustomerByEmail,
    emailToCheck ? { email: emailToCheck } : "skip"
  );

  // Check if phone already exists
  const [phoneToCheck, setPhoneToCheck] = useState<string | null>(null);
  const existingPhoneCustomer = useQuery(
    api.customers.getCustomerByPhone,
    phoneToCheck ? { phone: phoneToCheck } : "skip"
  );

  // Validation functions
  const isValidName = (name: string): { valid: boolean; error: string } => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return { valid: false, error: "Name is required" };
    }
    
    if (trimmedName.length < 2) {
      return { valid: false, error: "Name must be at least 2 characters" };
    }
    
    if (trimmedName.length > 100) {
      return { valid: false, error: "Name must not exceed 100 characters" };
    }
    
    // Check for valid characters (letters, spaces, hyphens, apostrophes, dots, commas)
    const nameRegex = /^[a-zA-Z\s'-.,()\u00C0-\u017F]+$/;
    if (!nameRegex.test(trimmedName)) {
      return { valid: false, error: "Name contains invalid characters" };
    }
    
    // Check for excessive spaces
    if (/\s{2,}/.test(trimmedName)) {
      return { valid: false, error: "Name cannot contain consecutive spaces" };
    }
    
    return { valid: true, error: "" };
  };

  const isValidEmail = (email: string): { valid: boolean; error: string } => {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      return { valid: false, error: "Email is required" };
    }
    
    // Email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { valid: false, error: "Please enter a valid email address" };
    }
    
    if (trimmedEmail.length > 100) {
      return { valid: false, error: "Email must not exceed 100 characters" };
    }
    
    // Check if email exists (skip if editing the same customer)
    if (existingEmailCustomer && existingEmailCustomer._id !== initialData?._id) {
      return { valid: false, error: "A customer with this email already exists" };
    }
    
    return { valid: true, error: "" };
  };

  const isValidPhone = (phone: string): { valid: boolean; error: string } => {
    const trimmedPhone = phone.trim();
    
    if (!trimmedPhone) {
      return { valid: false, error: "Phone number is required" };
    }
    
    // Remove common separators for validation
    const cleanedPhone = trimmedPhone.replace(/[\s\-()]/g, '');
    
    // Check if it contains only digits and + sign at the start
    const phoneRegex = /^\+?[0-9]+$/;
    if (!phoneRegex.test(cleanedPhone)) {
      return { valid: false, error: "Phone number can only contain digits, +, spaces, hyphens, and parentheses" };
    }
    
    // Check minimum length (at least 7 digits for local numbers)
    if (cleanedPhone.replace(/\+/g, '').length < 7) {
      return { valid: false, error: "Phone number must be at least 7 digits" };
    }
    
    // Check maximum length (international numbers can be up to 15 digits + country code)
    if (cleanedPhone.replace(/\+/g, '').length > 15) {
      return { valid: false, error: "Phone number is too long" };
    }
    
    // Check for valid Philippine format if starts with +63 or 63 or 0
    if (cleanedPhone.startsWith('+63')) {
      const digitsAfterCode = cleanedPhone.slice(3);
      if (digitsAfterCode.length !== 10) {
        return { valid: false, error: "Philippine number should have 10 digits after +63" };
      }
    } else if (cleanedPhone.startsWith('63') && cleanedPhone.length === 12) {
      const digitsAfterCode = cleanedPhone.slice(2);
      if (digitsAfterCode.length !== 10) {
        return { valid: false, error: "Philippine number should have 10 digits after 63" };
      }
    } else if (cleanedPhone.startsWith('0') && cleanedPhone.length === 11) {
      // Valid Philippine mobile format starting with 0
    }
    
    // Check if phone exists (skip if editing the same customer)
    if (existingPhoneCustomer && existingPhoneCustomer._id !== initialData?._id) {
      return { valid: false, error: "A customer with this phone number already exists" };
    }
    
    return { valid: true, error: "" };
  };

  const validateForm = (): boolean => {
    const nameValidation = isValidName(formData.name);
    const emailValidation = isValidEmail(formData.email);
    const phoneValidation = isValidPhone(formData.phone);

    setErrors({
      name: nameValidation.error,
      email: emailValidation.error,
      phone: phoneValidation.error,
    });

    return nameValidation.valid && emailValidation.valid && phoneValidation.valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 ${errors.name ? 'focus:ring-red-500' : 'focus:ring-blue-500'} focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`}
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                const newEmail = e.target.value;
                setFormData({ ...formData, email: newEmail });
                if (errors.email) setErrors({ ...errors, email: "" });
                
                // Trigger email check if valid format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(newEmail.trim())) {
                  setEmailToCheck(newEmail.trim());
                } else {
                  setEmailToCheck(null);
                }
              }}
              onBlur={() => {
                // Validate on blur to show duplicate error
                const emailValidation = isValidEmail(formData.email);
                if (!emailValidation.valid) {
                  setErrors({ ...errors, email: emailValidation.error });
                }
              }}
              className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 ${errors.email ? 'focus:ring-red-500' : 'focus:ring-blue-500'} focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`}
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const newPhone = e.target.value;
                setFormData({ ...formData, phone: newPhone });
                if (errors.phone) setErrors({ ...errors, phone: "" });
                
                // Trigger phone check if valid format (at least 7 digits)
                const cleanedPhone = newPhone.replace(/[\s\-()]/g, '');
                const phoneRegex = /^\+?[0-9]+$/;
                if (phoneRegex.test(cleanedPhone) && cleanedPhone.replace(/\+/g, '').length >= 7) {
                  setPhoneToCheck(newPhone.trim());
                } else {
                  setPhoneToCheck(null);
                }
              }}
              onBlur={() => {
                // Validate on blur to show duplicate error
                const phoneValidation = isValidPhone(formData.phone);
                if (!phoneValidation.valid) {
                  setErrors({ ...errors, phone: phoneValidation.error });
                }
              }}
              className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 ${errors.phone ? 'focus:ring-red-500' : 'focus:ring-blue-500'} focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`}
              placeholder="+63 912 345 6789"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Format: +63 912 345 6789 or 0912 345 6789
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
              placeholder="Additional notes about the customer..."
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
              {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}