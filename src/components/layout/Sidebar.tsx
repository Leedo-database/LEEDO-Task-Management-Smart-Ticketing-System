import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Kanban,
  Calendar,
  ClipboardCheck,
  LifeBuoy,
  Users,
  BarChart3,
  FileText,
  NotebookPen,
  Bell,
  ScrollText,
  Settings,
  X,
  ChevronLeft,
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingReviewCount: number;
  openTicketCount: number;
  unreadNotifsCount: number;
  myTaskCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingReviewCount,
  openTicketCount,
  unreadNotifsCount,
  myTaskCount,
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    canAccessEmployeeDatabase,
    canManageSettings,
    isSupervisorOrHigher,
    canViewAllTasks,
  } = useAuth();
  const { t, language } = useLanguage();

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    // On mobile screens, automatically close drawer after navigation
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
    }
  };

  const mainNav = [
    { id: "dashboard", label: t("overview"), icon: LayoutDashboard },
    { id: "my-tasks", label: t("myTasks"), icon: CheckSquare, badge: myTaskCount },
    { id: "group-tasks", label: t("groupTasks"), icon: Users },
    ...(canViewAllTasks
      ? [{ id: "tasks", label: t("tasks"), icon: ListTodo }]
      : []),
    { id: "board", label: t("taskBoard"), icon: Kanban },
    { id: "calendar", label: "Calendar", icon: Calendar },
    {
      id: "review-approvals",
      label: t("approvals"),
      icon: ClipboardCheck,
      badge: pendingReviewCount,
      badgeColor: "bg-amber-500",
      show: isSupervisorOrHigher,
    },
    { id: "tickets", label: t("smartTickets"), icon: LifeBuoy, badge: openTicketCount },
  ];

  const adminNav = [
    { id: "employees", label: t("employeeDatabase"), icon: Users, show: canAccessEmployeeDatabase },
    { id: "workload", label: t("workloadCapacity"), icon: BarChart3, show: isSupervisorOrHigher },
    { id: "reports", label: t("analyticsReports"), icon: FileText, show: true },
    { id: "meeting-actions", label: t("meetingActions"), icon: NotebookPen, show: true },
    { id: "notifications", label: t("notifications"), icon: Bell, badge: unreadNotifsCount },
    { id: "audit-logs", label: t("auditTrail"), icon: ScrollText, show: isSupervisorOrHigher },
    { id: "settings", label: t("settings"), icon: Settings, show: canManageSettings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay (only on screens < lg) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`
          fixed lg:sticky top-0 lg:top-16 left-0 z-50 lg:z-30
          h-screen lg:h-[calc(100vh-4rem)] bg-white border-r border-slate-200
          transition-all duration-300 ease-in-out select-none flex flex-col shrink-0
          ${
            isOpen
              ? "translate-x-0 w-72 sm:w-64 shadow-2xl lg:shadow-none"
              : "-translate-x-full lg:hidden w-0"
          }
        `}
      >
        {/* Mobile Header with Organization Info & Close Button */}
        <div className="lg:hidden p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <img
              src="/public/assets/aistudio/Logo-of-LEEDO-Short-01-746x1024_a345b8a2.png"
              alt="LEEDO"
              className="h-7 w-auto object-contain"
            />
            <div>
              <span className="text-xs font-bold tracking-tight block">
                {t("appName")}
              </span>
              <span className="text-[10px] text-slate-300 block font-mono">
                Bangladesh
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Quick Collapse Bar at top of sidebar */}
        <div className="hidden lg:flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            {language === "bn" ? "মেনু ও বিভাগ" : "Navigation Menu"}
          </span>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-colors"
            title="Hide sidebar menu"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-6">
          {/* Core Work Management */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              {language === "bn" ? "কাজের ব্যবস্থাপনা" : "Work Management"}
            </div>
            <div className="space-y-0.5">
              {mainNav
                .filter((item) => item.show !== false)
                .map((item) => {
                  const Icon = item.icon;
                  const active = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? "bg-red-50 text-red-700 font-semibold shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-red-600" : "text-slate-500"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 font-mono font-bold rounded-full ${
                            item.badgeColor
                              ? `${item.badgeColor} text-white`
                              : active
                              ? "bg-red-600 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Oversight & Administration */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              {language === "bn" ? "তদারকি ও প্রশাসন" : "Oversight & Admin"}
            </div>
            <div className="space-y-0.5">
              {adminNav
                .filter((item) => item.show !== false)
                .map((item) => {
                  const Icon = item.icon;
                  const active = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? "bg-red-50 text-red-700 font-semibold shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-red-600" : "text-slate-500"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 font-mono font-bold rounded-full bg-red-600 text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* User Information Footer in Sidebar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser?.name.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser?.designation}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
