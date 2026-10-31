import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { Bell, ChevronDown, LogOut, KeyRound, Menu, X, PanelLeft, PanelLeftClose } from "lucide-react";

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unreadNotifsCount: number;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  unreadNotifsCount,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const { currentUser, logout, canViewAllTasks } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 shadow-2xs">
      {/* Zone 1: Sidebar Toggle & Brand Logo */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-red-500"
          title={isSidebarOpen ? "Hide sidebar menu" : "Show sidebar menu"}
          aria-label="Toggle menu bar"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5 text-red-600 hidden lg:block" />
          ) : (
            <PanelLeft className="w-5 h-5 text-slate-700 hidden lg:block" />
          )}
          <Menu className="w-5 h-5 text-slate-800 lg:hidden" />
        </button>

        <div
          onClick={() => onSelectTab("dashboard")}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <img
            src="/public/assets/aistudio/Logo-of-LEEDO-Short-01-746x1024_a345b8a2.png"
            alt="LEEDO Logo"
            className="h-8 sm:h-10 w-auto object-contain shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
              {t("appName")}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 whitespace-nowrap hidden sm:block">
              {t("orgSubtitle")}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Desktop Quick Navigation Links */}
      <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-slate-600">
        <button
          onClick={() => onSelectTab("dashboard")}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === "dashboard" ? "text-red-600 font-bold border-b-2 border-red-600" : ""
          }`}
        >
          {t("overview")}
        </button>
        <button
          onClick={() => onSelectTab("my-tasks")}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === "my-tasks" ? "text-red-600 font-bold border-b-2 border-red-600" : ""
          }`}
        >
          {t("myTasks")}
        </button>
        <button
          onClick={() => onSelectTab("group-tasks")}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === "group-tasks" ? "text-red-600 font-bold border-b-2 border-red-600" : ""
          }`}
        >
          {t("groupTasks")}
        </button>
        {canViewAllTasks && (
          <button
            onClick={() => onSelectTab("tasks")}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              currentTab === "tasks" ? "text-red-600 font-bold border-b-2 border-red-600" : ""
            }`}
          >
            {t("tasks")}
          </button>
        )}
        <button
          onClick={() => onSelectTab("board")}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === "board" ? "text-red-600 font-bold border-b-2 border-red-600" : ""
          }`}
        >
          {t("taskBoard")}
        </button>
        <button
          onClick={() => onSelectTab("tickets")}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === "tickets" ? "text-red-600 font-bold border-b-2 border-red-600" : ""
          }`}
        >
          {t("smartTickets")}
        </button>
        <button
          onClick={() => onSelectTab("reports")}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === "reports" ? "text-red-600 font-bold border-b-2 border-red-600" : ""
          }`}
        >
          {t("analyticsReports")}
        </button>
      </nav>

      {/* Zone 3: Actions Cluster: Language Toggle + Notifications + User Menu */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Bilingual Language Switcher (EN | বাংলা) */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] sm:text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md transition-colors ${
              language === "en"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage("bn")}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md transition-colors ${
              language === "bn"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            বাংলা
          </button>
        </div>

        {/* Notifications Button */}
        <button
          onClick={() => onSelectTab("notifications")}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title={t("notifications")}
          aria-label={t("notifications")}
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadNotifsCount > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[9px] sm:text-[10px] font-bold text-white bg-red-600 rounded-full flex items-center justify-center">
              {unreadNotifsCount > 9 ? "9+" : unreadNotifsCount}
            </span>
          )}
        </button>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser?.name.charAt(0) || "U"}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                {currentUser?.name}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                EID: {currentUser?.eid}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xs:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.designation}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.location}</p>
                <span className="inline-block mt-1 text-[10px] font-mono font-medium px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                  EID: {currentUser?.eid}
                </span>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onSelectTab("change-password");
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>{t("changePassword")}</span>
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium"
              >
                <LogOut className="w-3.5 h-3.5 text-red-600" />
                <span>{t("signOut")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
