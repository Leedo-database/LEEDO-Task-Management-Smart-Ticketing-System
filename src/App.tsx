import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { storage } from "./services/storage";
import { Task, Ticket } from "./types";

import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { Login, FirstLoginPasswordChange } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { TaskList } from "./pages/TaskList";
import { TaskBoard } from "./pages/TaskBoard";
import { CalendarView } from "./pages/CalendarView";
import { ReviewApprovals } from "./pages/ReviewApprovals";
import { SmartTickets } from "./pages/SmartTickets";
import { GroupTasks } from "./pages/GroupTasks";
import { EmployeeMaster } from "./pages/EmployeeMaster";
import { EmployeeImportPreview } from "./pages/EmployeeImportPreview";
import { WorkloadCapacity } from "./pages/WorkloadCapacity";
import { PerformanceReports } from "./pages/PerformanceReports";
import { MeetingActionPoints } from "./pages/MeetingActionPoints";
import { NotificationsCenter } from "./pages/NotificationsCenter";
import { AuditLogs } from "./pages/AuditLogs";
import { SystemSettings } from "./pages/SystemSettings";

import { CreateEditTaskModal } from "./components/tasks/CreateEditTaskModal";
import { TaskDetailsModal } from "./components/tasks/TaskDetailsModal";
import { LeedoAiAssistant } from "./components/ai/LeedoAiAssistant";
import { ShieldAlert, ArrowLeft } from "lucide-react";

const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated, mustChangePassword, canAccessEmployeeDatabase, canViewAllTasks } = useAuth();
  const { t, language } = useLanguage();

  const [currentTab, setCurrentTab] = useState("dashboard");
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // If user is not signed in, show Login
  if (!isAuthenticated || !currentUser) {
    return <Login />;
  }

  // Mandatory first-login password change check
  if (mustChangePassword) {
    return <FirstLoginPasswordChange />;
  }

  const tasks = storage.getTasks();
  const tickets = storage.getTickets();
  const myNotifications = storage.getNotifications(currentUser.eid);

  const pendingReviewCount = tasks.filter((t) => t.status === "Submitted for Review").length;
  const openTicketCount = tickets.filter((tk) => tk.status !== "Closed" && tk.status !== "Resolved").length;
  const unreadNotifsCount = myNotifications.filter((n) => !n.read).length;
  const myTaskCount = tasks.filter((t) => t.assignedToEid === currentUser.eid && t.status !== "Completed").length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Bar adhering to Top Bar Contract */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        unreadNotifsCount={unreadNotifsCount}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Layout Area: Sidebar + Content */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto relative">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingReviewCount={pendingReviewCount}
          openTicketCount={openTicketCount}
          unreadNotifsCount={unreadNotifsCount}
          myTaskCount={myTaskCount}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-8 overflow-y-auto w-full min-w-0">
          {currentTab === "dashboard" && (
            <Dashboard
              onSelectTab={setCurrentTab}
              onOpenTaskDetails={(t) => setSelectedTaskForDetails(t)}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
              onOpenCreateTicket={() => setCurrentTab("tickets")}
            />
          )}

          {currentTab === "my-tasks" && (
            <TaskList
              filterMyTasksOnly={true}
              onOpenTaskDetails={(t) => setSelectedTaskForDetails(t)}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
              onEditTask={(t) => setTaskToEdit(t)}
            />
          )}

          {currentTab === "tasks" && (
            <TaskList
              filterMyTasksOnly={!canViewAllTasks}
              onOpenTaskDetails={(t) => setSelectedTaskForDetails(t)}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
              onEditTask={(t) => setTaskToEdit(t)}
            />
          )}

          {currentTab === "group-tasks" && (
            <GroupTasks />
          )}

          {currentTab === "board" && (
            <TaskBoard
              onOpenTaskDetails={(t) => setSelectedTaskForDetails(t)}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
            />
          )}

          {currentTab === "calendar" && (
            <CalendarView onOpenTaskDetails={(t) => setSelectedTaskForDetails(t)} />
          )}

          {currentTab === "review-approvals" && (
            <ReviewApprovals onOpenTaskDetails={(t) => setSelectedTaskForDetails(t)} />
          )}

          {currentTab === "tickets" && (
            <SmartTickets
              onOpenTaskDetails={(t) => setSelectedTaskForDetails(t)}
            />
          )}

          {/* Employee Database Route Protection: Strictly for Forhad (1001), Kanta (1002), Omar (1057) */}
          {currentTab === "employees" && (
            canAccessEmployeeDatabase ? (
              <EmployeeMaster onOpenImport={() => setCurrentTab("import-employees")} />
            ) : (
              <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">{t("accessDenied")}</h2>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t("accessDeniedDesc")}
                </p>
                <button
                  onClick={() => setCurrentTab("dashboard")}
                  className="mt-6 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t("backToDashboard")}</span>
                </button>
              </div>
            )
          )}

          {currentTab === "import-employees" && (
            canAccessEmployeeDatabase ? (
              <EmployeeImportPreview onBack={() => setCurrentTab("employees")} />
            ) : (
              <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">{t("accessDenied")}</h2>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t("accessDeniedDesc")}
                </p>
                <button
                  onClick={() => setCurrentTab("dashboard")}
                  className="mt-6 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t("backToDashboard")}</span>
                </button>
              </div>
            )
          )}

          {currentTab === "workload" && <WorkloadCapacity />}

          {currentTab === "reports" && <PerformanceReports />}

          {currentTab === "meeting-actions" && <MeetingActionPoints />}

          {currentTab === "notifications" && (
            <NotificationsCenter
              onNavigate={(path) => {
                if (path.includes("review")) setCurrentTab("review-approvals");
                else if (path.includes("tickets")) setCurrentTab("tickets");
                else setCurrentTab("tasks");
              }}
            />
          )}

          {currentTab === "audit-logs" && <AuditLogs />}

          {currentTab === "settings" && <SystemSettings />}

          {currentTab === "change-password" && <FirstLoginPasswordChange />}
        </main>
      </div>

      {/* Floating LEEDO AI Assistant (Integrated for ALL employees) */}
      <LeedoAiAssistant />

      {/* Create / Edit Task Modal */}
      {(isCreateTaskOpen || taskToEdit) && (
        <CreateEditTaskModal
          task={taskToEdit}
          onClose={() => {
            setIsCreateTaskOpen(false);
            setTaskToEdit(null);
          }}
          onSaved={(savedTask) => {
            setIsCreateTaskOpen(false);
            setTaskToEdit(null);
            setSelectedTaskForDetails(savedTask);
          }}
        />
      )}

      {/* Task Details Modal */}
      {selectedTaskForDetails && (
        <TaskDetailsModal
          task={selectedTaskForDetails}
          onClose={() => setSelectedTaskForDetails(null)}
          onTaskUpdated={(updated) => setSelectedTaskForDetails(updated)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
