"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, MessageCircle, CheckCircle2, FileText, FolderKanban, X } from "lucide-react";
import { useRouter } from "next/navigation";

const ICON_MAP = {
  message: MessageCircle,
  task_assigned: CheckCircle2,
  task_due: CheckCircle2,
  invoice_overdue: FileText,
  document_signed: FileText,
  project_created: FolderKanban,
  comment: MessageCircle,
};

export default function NotificationDropdown() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications");
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notif._id }),
      });
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (notif.href) router.push(notif.href);
  };

  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-[380px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h3 className="font-semibold text-white text-sm">Notifications</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-800/50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="mx-auto text-slate-700 mb-3" size={28} />
                <p className="text-slate-500 text-sm">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = ICON_MAP[notif.type] || Bell;
                return (
                  <button
                    key={notif._id}
                    onClick={() => handleClick(notif)}
                    className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-800/50 ${
                      !notif.isRead ? "bg-indigo-600/5" : ""
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      !notif.isRead
                        ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400"
                        : "bg-slate-800 border-slate-700 text-slate-500"
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${!notif.isRead ? "text-white" : "text-slate-300"}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-600 shrink-0">{formatTime(notif.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5"></div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
