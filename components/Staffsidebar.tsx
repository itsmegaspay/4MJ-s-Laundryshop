"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { WashingMachine, ClipboardList, LayoutDashboard, Users } from 'lucide-react';
import { useAuthActions } from "@convex-dev/auth/react";

interface StaffSidebarProps {
  userName?: string;
  userEmail?: string;
}

export default function StaffSidebar({ userName, userEmail }: StaffSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();

  const navItems = [
    { href: "/staff", label: "Dashboard", icon: LayoutDashboard },
    { href: "/staff/manage-laundry", label: "Manage Laundry", icon: ClipboardList },
    { href: "/staff/manage-customers", label: "Manage Customers", icon: Users },
  ];

  return (
    <aside className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col h-screen sticky top-0">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          <WashingMachine size={27} strokeWidth={2.5}/>
          4MJ's
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Staff Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info & Sign Out */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="mb-3 px-4 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {userName || userEmail}
          </p>
        </div>
        <button
          className="w-full bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          onClick={() =>
            void signOut().then(() => {
              router.push("/signin");
            })
          }
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}