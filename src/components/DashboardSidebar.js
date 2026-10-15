"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  ReceiptText,
  Settings,
  LogOut,
  Zap,
  ChevronRight,
  ChevronsUpDown,
  Building2,
  Check,
  Plus,
  Users,
  FileSignature,
  MessageSquare,
  BarChart3,
  Menu,
  X
} from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { workspaces, activeWorkspace, switchWorkspace, isLoading } = useWorkspace();
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isFreelancer = session?.user?.role !== "client";

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
    { name: "Projects", href: "/dashboard/projects", icon: FolderKanban, exact: false },
    { name: "Clients", href: "/dashboard/clients", icon: Users, exact: false },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare, exact: false },
    { name: "Documents", href: "/dashboard/documents", icon: FileSignature, exact: false },
    { name: "Invoices", href: "/dashboard/invoices", icon: ReceiptText, exact: false },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3, exact: false },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, exact: false },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsWorkspaceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile Menu Toggle Button (Fixed on top of DashboardHeader) */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-3 left-4 z-50 p-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg shadow-sm"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        h-screen w-64 flex-col bg-slate-900 border-r border-slate-800 fixed top-0 left-0 z-40 transition-transform duration-300
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        flex
      `}>
      
      {/* Workspace Switcher */}
      <div className="p-4 border-b border-slate-800 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
          className="w-full flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 px-3 py-2.5 rounded-lg border border-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center shrink-0">
              <Building2 size={16} className="text-white" />
            </div>
            <div className="text-left truncate">
              <span className="block text-sm font-semibold text-slate-100 truncate">
                {isLoading ? "Loading..." : activeWorkspace?.name || "No Workspace"}
              </span>
              <span className="block text-xs text-slate-400 capitalize">
                {activeWorkspace?.subscription?.plan || "Free"} Plan
              </span>
            </div>
          </div>
          <ChevronsUpDown size={16} className="text-slate-500 shrink-0 ml-2" />
        </button>

        {/* Dropdown Menu */}
        {isWorkspaceDropdownOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
            <div className="max-h-48 overflow-y-auto py-1">
              {workspaces.map((ws) => (
                <button
                  key={ws._id}
                  onClick={() => {
                    switchWorkspace(ws);
                    setIsWorkspaceDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                    activeWorkspace?._id === ws._id
                      ? "bg-indigo-600/10 text-indigo-400"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  <span className="truncate pr-2">{ws.name}</span>
                  {activeWorkspace?._id === ws._id && <Check size={14} className="shrink-0" />}
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-slate-700">
              <button className="w-full flex items-center gap-2 px-2 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors">
                <Plus size={16} />
                <span>Create Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-5 gap-1">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Main Menu
        </div>
        {navigation.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={"group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all " + (
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={"h-4.5 w-4.5 shrink-0 " + (isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} size={18} />
                {item.name}
              </div>
              {isActive && <ChevronRight size={14} className="text-indigo-200" />}
            </Link>
          );
        })}
      </div>

      {/* User + Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        {session?.user && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-sm font-bold shrink-0">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-sm font-semibold truncate">{session.user.name}</p>
              <p className="text-slate-500 text-xs truncate">{session.user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="group flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 border border-slate-700/50 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all shadow-sm"
        >
          <LogOut className="h-4 w-4 shrink-0" size={16} />
          Sign Out
        </button>
      </div>
    </div>
    </>
  );
}
