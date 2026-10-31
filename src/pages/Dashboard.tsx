import React from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { storage } from "../services/storage";
import { Task } from "../types";
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LifeBuoy,
  Plus,
  ArrowRight,
  MapPin,
  CheckSquare,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";

interface DashboardProps {
  onSelectTab: (tab: string) => void;
  onOpenTaskDetails: (task: Task) => void;
  onOpenCreateTask: () => void;
  onOpenCreateTicket: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectTab,
  onOpenTaskDetails,
  onOpenCreateTask,
  onOpenCreateTicket,
}) => {
  const { currentUser, isSupervisorOrHigher, canViewAllTasks } = useAuth();
  const { t, language } = useLanguage();

  const allTasks = storage.getTasks();
  const allTickets = storage.getTickets();
  const auditLogs = storage.getAuditLogs().slice(0, 6);

  // My tasks
  const myTasks = allTasks.filter((t) => t.assignedToEid === currentUser?.eid);
  const myActiveTasks = myTasks.filter((t) => t.status !== "Completed" && t.status !== "Closed");
  const myCompletedTasks = myTasks.filter((t) => t.status === "Completed" || t.status === "Closed");
  const myOverdueTasks = myTasks.filter(
    (t) =>
      new Date(t.dueDate).getTime() < Date.now() &&
      t.status !== "Completed" &&
      t.status !== "Closed" &&
      t.status !== "Approved"
  );
  const myBlockedTasks = myTasks.filter((t) => t.status === "Blocked");
  const myInProgressTasks = myTasks.filter((t) => t.status === "In Progress");

  // Organization-wide (Only for 1001, 1002, 1057)
  const orgActiveTasks = allTasks.filter((t) => t.status !== "Completed" && t.status !== "Closed");
  const orgPendingApprovals = allTasks.filter((t) => t.status === "Submitted for Review");
  const orgOverdueTasks = allTasks.filter(
    (t) =>
      new Date(t.dueDate).getTime() < Date.now() &&
      t.status !== "Completed" &&
      t.status !== "Closed" &&
      t.status !== "Approved"
  );
  const orgBlockedTasks = allTasks.filter((t) => t.status === "Blocked");
  const openTickets = allTickets.filter((tk) => tk.status !== "Closed" && tk.status !== "Resolved");
  const highPriorityTasks = allTasks.filter(
    (t) => (t.priority === "Urgent" || t.priority === "High") && t.status !== "Closed" && t.status !== "Completed"
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700/50">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wider font-mono">
            <span>{t("appName")}</span>
            <span>·</span>
            <span>Bangladesh</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-1">
            {t("welcomeBack")}, {currentUser?.name}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            <span className="font-semibold text-white">{currentUser?.designation}</span> · {currentUser?.department} ({currentUser?.location}).{" "}
            {canViewAllTasks ? (
              <span>
                {language === "bn"
                  ? "আপনার কাছে পুরো সংস্থার সকল কার্যক্রম তদারকির বিশেষ অধিকার রয়েছে।"
                  : "You have executive organization-wide oversight across all 9 locations."}
              </span>
            ) : (
              <span>
                {language === "bn"
                  ? `আপনার অধীনে বর্তমানে ${myActiveTasks.length}টি সক্রিয় কাজ রয়েছে।`
                  : `You currently have ${myActiveTasks.length} active tasks assigned to you.`}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onSelectTab("group-tasks")}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4 text-red-400" />
            <span>{t("groupTasks")}</span>
          </button>
          <button
            onClick={onOpenCreateTask}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("createTask")}</span>
          </button>
          <button
            onClick={onOpenCreateTicket}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>{t("submitTicket")}</span>
          </button>
        </div>
      </div>

      {/* EXECUTIVE VIEW: Only Forhad Hossain (1001), Murshida Akhter Kanta (1002), and Md. Omar Faruque (1057) */}
      {canViewAllTasks ? (
        <>
          {/* Executive KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">{t("totalActiveTasks")}</span>
                <ListTodo className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {orgActiveTasks.length}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">{t("acrossAllLocations")}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">{t("pendingApprovals")}</span>
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
                {orgPendingApprovals.length}
              </div>
              <button
                onClick={() => onSelectTab("review-approvals")}
                className="mt-1 text-[11px] text-amber-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{t("reviewQueue")}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">{t("overdueDeadlines")}</span>
                <Clock className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
                {orgOverdueTasks.length}
              </div>
              <div className="mt-1 text-[11px] text-rose-600 font-medium">
                {language === "bn" ? "তাত্ক্ষণিক তদারকি প্রয়োজন" : "Requires supervisor follow-up"}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">{t("blockedWork")}</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600 font-mono tabular-nums">
                {orgBlockedTasks.length}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {language === "bn" ? "লজিস্টিক বা সিদ্ধান্ত সংক্রান্ত" : "Logistics/Material blockers"}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 md:col-span-1">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">{t("openSupportTickets")}</span>
                <LifeBuoy className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-bold text-sky-600 font-mono tabular-nums">
                {openTickets.length}
              </div>
              <button
                onClick={() => onSelectTab("tickets")}
                className="mt-1 text-[11px] text-sky-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{t("manageTickets")}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Executive Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Critical & High Priority Tasks Across LEEDO */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {t("criticalHighPriority")} ({highPriorityTasks.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => onSelectTab("tasks")}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    {t("tasks")}
                  </button>
                </div>

                <div className="space-y-2.5">
                  {highPriorityTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onOpenTaskDetails(task)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              task.priority === "Urgent"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                          <h4 className="text-xs font-semibold text-slate-900">{task.title}</h4>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2.5">
                          <span>{task.location}</span>
                          <span>·</span>
                          <span>EID {task.assignedToEid}</span>
                          <span>·</span>
                          <span className="font-mono">Due: {task.dueDate}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {task.progressPercentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* My Own Tasks for Executive */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-slate-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {t("myTasks")} ({myActiveTasks.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => onSelectTab("my-tasks")}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    {t("myTasks")}
                  </button>
                </div>

                {myTasks.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    {language === "bn" ? "আপনার কোনো ব্যক্তিগত কাজ নির্ধারিত নেই।" : "No personal tasks assigned."}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {myTasks.slice(0, 4).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onOpenTaskDetails(task)}
                        className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <span className="text-xs font-semibold text-slate-900 truncate block">
                            {task.title}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span className="capitalize">{task.status}</span>
                            <span>·</span>
                            <span className="font-mono">Due: {task.dueDate}</span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          {task.progressPercentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Location Distribution & Accountability Log */}
            <div className="space-y-6">
              {/* Field Locations */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span>{t("fieldLocations")}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">9 Active Hubs</span>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { name: "Head Office", count: allTasks.filter((t) => t.location === "Head Office").length },
                    { name: "Peace Home", count: allTasks.filter((t) => t.location === "Peace Home").length },
                    { name: "Kamalapur", count: allTasks.filter((t) => t.location === "Kamalapur").length },
                    { name: "Inclusive School", count: allTasks.filter((t) => t.location === "Inclusive School").length },
                    { name: "Kodomtoli", count: allTasks.filter((t) => t.location === "Kodomtoli").length },
                    { name: "Tejgoan", count: allTasks.filter((t) => t.location === "Tejgoan").length },
                  ].map((loc) => (
                    <div key={loc.name} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-none">
                      <span className="font-medium text-slate-700">{loc.name}</span>
                      <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                        {loc.count} tasks
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accountability Audit Trail */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">{t("recentAuditTrail")}</h3>
                  <button
                    onClick={() => onSelectTab("audit-logs")}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                  >
                    {t("auditTrail")}
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="pb-2.5 border-b border-slate-100 last:border-none">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                        <span className="font-semibold text-slate-700">{log.actorName}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-600 line-clamp-2 text-[11px]">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* REGULAR EMPLOYEE VIEW: strictly limited to their assigned tasks count & personal summary */
        <>
          {/* Personal KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">{t("myActiveTasks")}</span>
                <CheckSquare className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
                {myActiveTasks.length}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">{t("personalScope")}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">
                  {language === "bn" ? "চলমান কাজ" : "In Progress"}
                </span>
                <ListTodo className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-blue-600 font-mono tabular-nums">
                {myInProgressTasks.length}
              </div>
              <div className="mt-1 text-[11px] text-blue-600 font-medium">
                {language === "bn" ? "বর্তমানে কাজ চলছে" : "Currently working on"}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">{t("myOverdue")}</span>
                <Clock className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-3xl font-bold text-rose-600 font-mono tabular-nums">
                {myOverdueTasks.length}
              </div>
              <div className="mt-1 text-[11px] text-rose-600 font-medium">
                {language === "bn" ? "জরুরি শেষ করা প্রয়োজন" : "Immediate action required"}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">{t("myBlocked")}</span>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-amber-600 font-mono tabular-nums">
                {myBlockedTasks.length}
              </div>
              <div className="mt-1 text-[11px] text-amber-600 font-medium">
                {language === "bn" ? "সহায়তা প্রয়োজন" : "Needs supervisor support"}
              </div>
            </div>
          </div>

          {/* Personal Task Performance & Action Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {language === "bn" ? "আমার নির্ধারিত কাজের তালিকা" : "My Assigned Tasks & Status"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === "bn"
                    ? "এখানে শুধুমাত্র আপনার জন্য নির্ধারিত কাজের বিবরণ ও অগ্রগতি প্রদর্শিত হচ্ছে।"
                    : "Listing only tasks assigned to your employee account."}
                </p>
              </div>

              <button
                onClick={() => onSelectTab("my-tasks")}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>{t("myTasks")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {myTasks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">
                  {language === "bn" ? "কোনো বকেয়া কাজ নেই" : "No Pending Tasks"}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {language === "bn"
                    ? "আপনার অ্যাকাউন্টে বর্তমানে কোনো নতুন কাজ অর্পিত হয়নি।"
                    : "You currently have no tasks assigned to you. Contact your supervisor if needed."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[620px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                      <th className="py-3 px-3">ID</th>
                      <th className="py-3 px-3">{language === "bn" ? "কাজের শিরোনাম" : "Task Title"}</th>
                      <th className="py-3 px-3">{language === "bn" ? "বিভাগ / স্থান" : "Dept / Location"}</th>
                      <th className="py-3 px-3">{language === "bn" ? "অগ্রাধিকার" : "Priority"}</th>
                      <th className="py-3 px-3">{language === "bn" ? "মিয়াদ" : "Due Date"}</th>
                      <th className="py-3 px-3">{language === "bn" ? "অবস্থা" : "Status"}</th>
                      <th className="py-3 px-3 text-right">{language === "bn" ? "অগ্রগতি" : "Progress"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myTasks.map((task) => (
                      <tr
                        key={task.id}
                        onClick={() => onOpenTaskDetails(task)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-600">{task.id}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">
                          {task.title}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {task.department} · {task.location}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              task.priority === "Urgent"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "High"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{task.dueDate}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium">
                            {task.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                          {task.progressPercentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
