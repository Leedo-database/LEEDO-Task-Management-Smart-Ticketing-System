import React, { useState } from "react";
import { storage } from "../services/storage";
import { useAuth } from "../context/AuthContext";
import { NotificationItem } from "../types";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCheck,
} from "lucide-react";

interface NotificationsCenterProps {
  onNavigate?: (path: string) => void;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const allNotifications = storage.getNotifications();
  const myNotifications = storage.getNotifications(currentUser?.eid);

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const displayedNotifs = myNotifications.filter((n) => (filter === "unread" ? !n.read : true));

  const handleMarkAllRead = () => {
    if (currentUser?.eid) {
      storage.markAllNotificationsRead(currentUser.eid);
    }
  };

  const handleItemClick = (n: NotificationItem) => {
    storage.markNotificationRead(n.id);
    if (n.linkPath && onNavigate) {
      onNavigate(n.linkPath);
    }
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "task_approval":
        return <CheckCircle2 className="w-4 h-4 text-amber-600" />;
      case "deadline_warning":
        return <Clock className="w-4 h-4 text-rose-600" />;
      case "ticket_update":
        return <AlertTriangle className="w-4 h-4 text-sky-600" />;
      default:
        return <Bell className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notifications Center</h1>
          <p className="text-xs text-slate-500">
            Real-time alerts for assignments, supervisor sign-offs, and deadline escalations
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          All ({myNotifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === "unread" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          Unread ({myNotifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
        {displayedNotifs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-700">No notifications to show</p>
            <p className="text-slate-400 mt-0.5">You are completely up to date.</p>
          </div>
        ) : (
          displayedNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`p-4 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                !n.read ? "bg-red-50/20" : ""
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">{getIcon(n.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs ${!n.read ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                    {n.title}
                  </h4>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
              </div>

              {!n.read && <div className="w-2 h-2 rounded-full bg-red-600 shrink-0 mt-2" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
