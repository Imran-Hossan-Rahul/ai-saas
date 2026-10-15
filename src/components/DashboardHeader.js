"use client";

import { usePathname } from "next/navigation";
import NotificationDropdown from "./NotificationDropdown";

const PAGE_TITLES = {
  "/dashboard": "Overview",
  "/dashboard/projects": "Projects",
  "/dashboard/clients": "Clients",
  "/dashboard/documents": "Proposals & Contracts",
  "/dashboard/invoices": "Invoices",
  "/dashboard/messages": "Messages",
  "/dashboard/settings": "Settings",
};

export default function DashboardHeader({ session }) {
  const pathname = usePathname();

  // Find the best matching title — O(n) on a tiny map, effectively O(1)
  const title = Object.entries(PAGE_TITLES)
    .filter(([key]) => pathname === key || pathname.startsWith(key + "/"))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] || "Dashboard";

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      {/* Page Title */}
      <h2 className="text-sm font-semibold text-slate-300 tracking-wide pl-10 md:pl-0">{title}</h2>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <NotificationDropdown />

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-sm font-bold ml-1">
          {session?.user?.name?.charAt(0).toUpperCase() || "?"}
        </div>
      </div>
    </header>
  );
}
