import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { storage } from "../services/storage";
import { GroupTask, GroupTaskUpdate, GroupTaskMilestone, TaskPriority } from "../types";
import {
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  MapPin,
  Building2,
  Send,
  Flag,
  Sparkles,
  Cloud,
  ChevronRight,
  X,
  MessageSquare,
  CheckSquare,
  Sliders,
  UserPlus,
  Flame,
  Check,
  TrendingUp,
  Share2,
} from "lucide-react";

export const GroupTasks: React.FC = () => {
  const { currentUser, canViewAllOrgData } = useAuth();
  const { language, t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");

  const [selectedTask, setSelectedTask] = useState<GroupTask | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Storage data
  const groupTasks = storage.getGroupTasks();
  const allEmployees = storage.getEmployees();
  const settings = storage.getSettings();

  // Filtered tasks
  const filteredTasks = groupTasks.filter((task) => {
    // If regular user (not 1001/1002/1057), default tab or toggle shows tasks they are part of
    const isMember =
      currentUser &&
      (task.leaderEid === currentUser.eid ||
        task.createdByEid === currentUser.eid ||
        (task.memberEids && task.memberEids.includes(currentUser.eid)));

    if (activeTab === "my" && !isMember) {
      return false;
    }

    if (filterLocation !== "all" && task.location !== filterLocation) {
      return false;
    }

    if (filterStatus !== "all" && task.status !== filterStatus) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      const matchLeader = task.leaderName.toLowerCase().includes(q);
      const matchMember = task.members?.some((m) => m.name.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchLeader && !matchMember) {
        return false;
      }
    }

    return true;
  });

  // Counters
  const totalCount = groupTasks.length;
  const inProgressCount = groupTasks.filter((t) => t.status === "In Progress").length;
  const underReviewCount = groupTasks.filter((t) => t.status === "Under Review").length;
  const completedCount = groupTasks.filter((t) => t.status === "Completed").length;
  const myCount = groupTasks.filter(
    (t) =>
      currentUser &&
      (t.leaderEid === currentUser.eid ||
        t.createdByEid === currentUser.eid ||
        (t.memberEids && t.memberEids.includes(currentUser.eid)))
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {language === "bn" ? "গ্রুপ টাস্ক ও দলীয় সমন্বয়" : "Group Tasks & Collaboration"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  {language === "bn" ? "ক্লাউডে সংরক্ষিত" : "Cloud Synced"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === "bn"
                  ? "যেখানে দলের সবাই একসাথে কাজ করতে পারে, আপডেট প্রদান করতে পারে এবং রিয়েল-টাইমে অগ্রগতি দেখতে পারে"
                  : "Collaborative space where team members manage shared objectives and post live updates"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {language === "bn" ? "নতুন গ্রুপ টাস্ক খুলুন" : "Open Group Task"}
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">
            {language === "bn" ? "সর্বমোট গ্রুপ টাস্ক" : "Total Group Tasks"}
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-blue-600 block">
            {language === "bn" ? "চলমান কাজ" : "In Progress"}
          </span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">{inProgressCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-amber-600 block">
            {language === "bn" ? "পর্যালোচনায়" : "Under Review"}
          </span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">{underReviewCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-600 block">
            {language === "bn" ? "সম্পন্ন" : "Completed"}
          </span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{completedCount}</span>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-red-50/50 p-4 rounded-xl border border-red-200/60 shadow-2xs">
          <span className="text-[11px] font-medium text-red-700 block">
            {language === "bn" ? "আমার অংশগ্রহণ" : "My Participations"}
          </span>
          <span className="text-2xl font-bold text-red-700 mt-1 block">{myCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Toggle Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {language === "bn" ? "সকল গ্রুপ টাস্ক" : "All Group Tasks"} ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "my" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {language === "bn" ? "আমার যুক্ত কাজ" : "My Group Tasks"} ({myCount})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === "bn" ? "খুঁজুন (নাম, দায়িত্বপ্রাপ্ত...)" : "Search group tasks..."}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>

          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">{language === "bn" ? "সকল কেন্দ্র / লোকেশন" : "All Locations"}</option>
            {settings.locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">{language === "bn" ? "সকল স্ট্যাটাস" : "All Statuses"}</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Under Review">Under Review</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Group Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {language === "bn" ? "কোনো গ্রুপ টাস্ক পাওয়া যায়নি" : "No Group Tasks Found"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {language === "bn"
              ? "দলের সাথে যৌথ কাজের সমন্বয় ও আপডেট দেওয়ার জন্য উপরে 'নতুন গ্রুপ টাস্ক খুলুন' বাটনে ক্লিক করুন।"
              : "Create a shared group task so everyone on the team can contribute and post updates."}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            {language === "bn" ? "গ্রুপ টাস্ক খুলুন" : "Create Group Task"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const completedMilestones = (task.milestones || []).filter((m) => m.completed).length;
            const totalMilestones = (task.milestones || []).length;
            const updateCount = (task.updates || []).length;
            const latestUpdate = task.updates && task.updates.length > 0 ? task.updates[0] : null;

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === "Urgent"
                          ? "bg-red-100 text-red-700"
                          : task.priority === "High"
                          ? "bg-amber-100 text-amber-700"
                          : task.priority === "Medium"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {task.priority}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        task.status === "Completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : task.status === "Under Review"
                          ? "bg-amber-100 text-amber-800"
                          : task.status === "In Progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {task.location}
                    </span>
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {task.dueDate}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="font-semibold text-slate-600">
                        {language === "bn" ? "অগ্রগতি" : "Progress"}
                      </span>
                      <span className="font-bold text-slate-900">{task.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          task.progressPercentage >= 100
                            ? "bg-emerald-500"
                            : task.progressPercentage >= 50
                            ? "bg-blue-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${task.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Latest Update Snippet if available */}
                  {latestUpdate && (
                    <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200/70 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="font-semibold text-slate-700">{latestUpdate.authorName}</span>
                        <span>{new Date(latestUpdate.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="truncate italic">"{latestUpdate.content}"</p>
                    </div>
                  )}
                </div>

                {/* Footer: Coordinator & Team Stack */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {(task.members || []).slice(0, 4).map((m, i) => (
                        <div
                          key={i}
                          title={`${m.name} (${m.designation})`}
                          className="w-6 h-6 rounded-full bg-slate-800 text-white border-2 border-white flex items-center justify-center text-[10px] font-bold"
                        >
                          {m.name.charAt(0)}
                        </div>
                      ))}
                      {(task.members || []).length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 border-2 border-white flex items-center justify-center text-[10px] font-bold">
                          +{task.members.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {task.members?.length || 0} {language === "bn" ? "সদস্য" : "members"}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 group-hover:translate-x-0.5 transition-transform">
                    {updateCount} {language === "bn" ? "আপডেট" : "updates"}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Collaborative Detail & Update Workspace Modal */}
      {selectedTask && (
        <GroupTaskWorkspaceModal
          task={selectedTask}
          currentUser={currentUser}
          language={language}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={(updated) => setSelectedTask(updated)}
        />
      )}

      {/* Create Group Task Modal */}
      {isCreateModalOpen && (
        <CreateGroupTaskModal
          allEmployees={allEmployees}
          locations={settings.locations}
          departments={settings.departments}
          categories={settings.taskCategories}
          currentUser={currentUser}
          language={language}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(newTask) => {
            setIsCreateModalOpen(false);
            setSelectedTask(newTask);
          }}
        />
      )}
    </div>
  );
};

// ==========================================
// Collaborative Workspace Modal (Update Feed & Progress)
// ==========================================
interface GroupTaskWorkspaceModalProps {
  task: GroupTask;
  currentUser: any;
  language: "en" | "bn";
  onClose: () => void;
  onTaskUpdated: (updated: GroupTask) => void;
}

const GroupTaskWorkspaceModal: React.FC<GroupTaskWorkspaceModalProps> = ({
  task,
  currentUser,
  language,
  onClose,
  onTaskUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"updates" | "milestones" | "members">("updates");

  // New update form state
  const [updateContent, setUpdateContent] = useState("");
  const [updateType, setUpdateType] = useState<GroupTaskUpdate["type"]>("progress_report");
  const [progressVal, setProgressVal] = useState(task.progressPercentage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New milestone form state
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateContent.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const updated = storage.addGroupTaskUpdate(
        task.id,
        {
          authorEid: currentUser.eid,
          authorName: currentUser.name,
          authorDesignation: currentUser.designation,
          type: updateType,
          content: updateContent.trim(),
          progressPercentage: progressVal,
        },
        currentUser.eid
      );

      if (updated) {
        onTaskUpdated(updated);
        setUpdateContent("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMilestone = (milestoneId: string) => {
    if (!currentUser) return;
    const updated = storage.toggleGroupTaskMilestone(task.id, milestoneId, currentUser.eid);
    if (updated) {
      onTaskUpdated(updated);
      setProgressVal(updated.progressPercentage);
    }
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !currentUser) return;

    const newMilestone: GroupTaskMilestone = {
      id: "MS-" + Date.now().toString(36),
      title: newMilestoneTitle.trim(),
      completed: false,
    };

    const updatedTask: GroupTask = {
      ...task,
      milestones: [...(task.milestones || []), newMilestone],
    };

    const saved = storage.saveGroupTask(updatedTask, currentUser.eid);
    onTaskUpdated(saved);
    setNewMilestoneTitle("");
  };

  const handleQuickStatusChange = (status: GroupTask["status"]) => {
    if (!currentUser) return;
    const updatedTask: GroupTask = {
      ...task,
      status,
      progressPercentage: status === "Completed" ? 100 : task.progressPercentage,
    };
    const saved = storage.saveGroupTask(updatedTask, currentUser.eid);
    onTaskUpdated(saved);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-red-600">{task.id}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    task.status === "Completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {task.status}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Cloud className="w-3 h-3" />
                  Cloud Synced
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {task.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Body: Split layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left Column: Task Overview, Milestones, Members */}
          <div className="md:col-span-5 p-5 space-y-5 bg-white">
            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {language === "bn" ? "কাজের বিবরণ ও উদ্দেশ্য" : "Objective & Scope"}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {task.description}
              </p>
            </div>

            {/* Overall Progress Indicator */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  {language === "bn" ? "যৌথ অগ্রগতি" : "Shared Progress"}
                </span>
                <span className="text-sm font-extrabold text-red-600">
                  {task.progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    task.progressPercentage >= 100
                      ? "bg-emerald-500"
                      : task.progressPercentage >= 50
                      ? "bg-blue-600"
                      : "bg-red-600"
                  }`}
                  style={{ width: `${task.progressPercentage}%` }}
                ></div>
              </div>

              {/* Status change actions */}
              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-200">
                <span className="text-[11px] text-slate-500">
                  {language === "bn" ? "অবস্থা পরিবর্তন:" : "Mark status:"}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickStatusChange("In Progress")}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                    task.status === "In Progress"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStatusChange("Completed")}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                    task.status === "Completed"
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {/* Milestones / Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-slate-500" />
                  {language === "bn" ? "মাইলস্টোন ও চেকলিস্ট" : "Milestones Checklist"}
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  {(task.milestones || []).filter((m) => m.completed).length}/
                  {(task.milestones || []).length}
                </span>
              </div>

              <div className="space-y-1.5">
                {(task.milestones || []).map((ms) => (
                  <label
                    key={ms.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={ms.completed}
                      onChange={() => handleToggleMilestone(ms.id)}
                      className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-xs block ${
                          ms.completed ? "line-through text-slate-400" : "text-slate-800 font-medium"
                        }`}
                      >
                        {ms.title}
                      </span>
                      {ms.completedByName && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3" />
                          {ms.completedByName}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Add milestone inline */}
              <form onSubmit={handleAddMilestone} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  placeholder={language === "bn" ? "+ নতুন মাইলস্টোন যোগ করুন..." : "+ Add new milestone..."}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="submit"
                  disabled={!newMilestoneTitle.trim()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {language === "bn" ? "যোগ করুন" : "Add"}
                </button>
              </form>
            </div>

            {/* Team Members List */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                {language === "bn" ? "দলের সদস্যবৃন্দ" : "Assigned Team Members"} (
                {task.members?.length || 0})
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {(task.members || []).map((member) => (
                  <div
                    key={member.eid}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {member.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {member.designation}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                      EID: {member.eid}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Collaborative Updates Feed */}
          <div className="md:col-span-7 flex flex-col h-full bg-slate-50/50">
            {/* Updates Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-red-600" />
                  {language === "bn" ? "যৌথ আপডেট ও চলমান আলোচনা" : "Collaborative Updates & Live Feed"}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {language === "bn"
                    ? "দলের যেকোনো সদস্য এখান থেকে মাঠপর্যায়ের কাজের অগ্রগতি পোস্ট করতে পারেন"
                    : "Any member can post progress notes, milestone alerts, or blockers"}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                {task.updates?.length || 0} {language === "bn" ? "টি আপডেট" : "updates"}
              </span>
            </div>

            {/* Post Update Form */}
            <form onSubmit={handlePostUpdate} className="p-4 bg-white border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  {language === "bn" ? "আপডেটের ধরণ:" : "Update Type:"}
                </span>
                <select
                  value={updateType}
                  onChange={(e) => setUpdateType(e.target.value as any)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="progress_report">
                    {language === "bn" ? "অগ্রগতি প্রতিবেদন" : "Progress Report"}
                  </option>
                  <option value="milestone_complete">
                    {language === "bn" ? "মাইলস্টোন সম্পন্ন" : "Milestone Completed"}
                  </option>
                  <option value="blocker">{language === "bn" ? "সমস্যা বা বাধা" : "Blocker / Issue"}</option>
                  <option value="general_comment">
                    {language === "bn" ? "সাধারণ নোট" : "General Note"}
                  </option>
                </select>
              </div>

              <textarea
                rows={3}
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
                placeholder={
                  language === "bn"
                    ? "মাঠপর্যায়ের কাজের কী অগ্রগতি হয়েছে বিস্তারিত লিখুন..."
                    : "Post what was accomplished, field findings, or next steps..."
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white resize-none"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                {/* Optional progress percentage slider */}
                <div className="flex items-center gap-2 w-full sm:w-auto text-xs text-slate-600">
                  <span className="text-[11px] font-medium whitespace-nowrap">
                    {language === "bn" ? "নতুন অগ্রগতি (%):" : "Update Progress (%):"}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressVal}
                    onChange={(e) => setProgressVal(Number(e.target.value))}
                    className="w-24 accent-red-600 cursor-pointer"
                  />
                  <span className="font-bold text-slate-900 text-xs w-8">{progressVal}%</span>
                </div>

                <button
                  type="submit"
                  disabled={!updateContent.trim() || isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {language === "bn" ? "আপডেট পোস্ট করুন" : "Post Live Update"}
                </button>
              </div>
            </form>

            {/* Updates Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[300px]">
              {(!task.updates || task.updates.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs font-medium">
                    {language === "bn"
                      ? "এখনো কোনো আপডেট নেই। সবার সাথে কাজের অগ্রগতি জানাতে প্রথম আপডেট দিন!"
                      : "No updates yet. Post the first update to keep your team aligned!"}
                  </p>
                </div>
              ) : (
                task.updates.map((upd) => (
                  <div
                    key={upd.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                          {upd.authorName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block leading-tight">
                            {upd.authorName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {upd.authorDesignation} • EID: {upd.authorEid}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            upd.type === "blocker"
                              ? "bg-red-100 text-red-700"
                              : upd.type === "milestone_complete"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {upd.type.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(upd.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed pl-8">
                      {upd.content}
                    </p>

                    {typeof upd.progressPercentage === "number" && (
                      <div className="pl-8 pt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <TrendingUp className="w-3 h-3 text-red-600" />
                        <span>
                          {language === "bn" ? "অগ্রগতি সেট করা হয়েছে:" : "Progress updated to:"}{" "}
                          <strong className="text-slate-800">{upd.progressPercentage}%</strong>
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Create Group Task Modal
// ==========================================
interface CreateGroupTaskModalProps {
  allEmployees: any[];
  locations: string[];
  departments: string[];
  categories: string[];
  currentUser: any;
  language: "en" | "bn";
  onClose: () => void;
  onCreated: (newTask: GroupTask) => void;
}

const CreateGroupTaskModal: React.FC<CreateGroupTaskModalProps> = ({
  allEmployees,
  locations,
  departments,
  categories,
  currentUser,
  language,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0] || "Program Operations");
  const [department, setDepartment] = useState(departments[0] || "Program & Operation");
  const [location, setLocation] = useState(locations[0] || "Head Office");
  const [priority, setPriority] = useState<TaskPriority>("High");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });

  const [leaderEid, setLeaderEid] = useState(currentUser?.eid || "1001");
  const [selectedMemberEids, setSelectedMemberEids] = useState<string[]>([currentUser?.eid || "1001"]);
  const [memberSearch, setMemberSearch] = useState("");

  const [milestonesText, setMilestonesText] = useState(
    "Field visit and preliminary assessment\nStaff coordination meeting\nExecution and reporting"
  );

  const toggleMember = (eid: string) => {
    if (selectedMemberEids.includes(eid)) {
      setSelectedMemberEids(selectedMemberEids.filter((id) => id !== eid));
    } else {
      setSelectedMemberEids([...selectedMemberEids, eid]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser) return;

    const leader = allEmployees.find((e) => e.eid === leaderEid) || currentUser;

    // Build members array
    const members = selectedMemberEids.map((eid) => {
      const emp = allEmployees.find((e) => e.eid === eid);
      return {
        eid,
        name: emp?.name || eid,
        designation: emp?.designation || "Staff Member",
        roleInGroup: (eid === leaderEid ? "Lead" : "Contributor") as any,
        joinedAt: new Date().toISOString(),
      };
    });

    // Parse milestones
    const milestones: GroupTaskMilestone[] = milestonesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((title, idx) => ({
        id: "MS-" + (idx + 1),
        title,
        completed: false,
      }));

    const newTask: GroupTask = {
      id: "GRP-" + Math.floor(100 + Math.random() * 900),
      title: title.trim(),
      description: description.trim(),
      category,
      department,
      location,
      priority,
      status: "Planning",
      leaderEid: leader.eid,
      leaderName: leader.name,
      memberEids: selectedMemberEids,
      members,
      milestones,
      updates: [
        {
          id: "UPD-1",
          authorEid: currentUser.eid,
          authorName: currentUser.name,
          authorDesignation: currentUser.designation,
          type: "general_comment",
          content: "Group task opened and collaborative team space initialized.",
          timestamp: new Date().toISOString(),
          progressPercentage: 0,
        },
      ],
      progressPercentage: 0,
      startDate: new Date().toISOString().split("T")[0],
      dueDate,
      createdByEid: currentUser.eid,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = storage.saveGroupTask(newTask, currentUser.eid);
    onCreated(saved);
  };

  const filteredEmployees = allEmployees.filter((emp) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.eid.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q) ||
      emp.location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === "bn" ? "নতুন গ্রুপ টাস্ক খুলুন" : "Create New Group Task"}
              </h2>
              <p className="text-xs text-slate-500">
                {language === "bn"
                  ? "যেখানে দলের একাধিক সদস্য যুক্ত হয়ে নিয়মিত আপডেট শেয়ার করতে পারবেন"
                  : "Empower multiple team members to collaborate and post updates"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === "bn" ? "গ্রুপ টাস্কের নাম *" : "Group Task Title *"}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Street Children Winter Clothes Distribution Drive 2026"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === "bn" ? "কাজের বিবরণ ও উদ্দেশ্য *" : "Description & Objectives *"}
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the goals, roles, and instructions for team members..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === "bn" ? "কেন্দ্র / লোকেশন" : "Location"}
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-500"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === "bn" ? "অগ্রাধিকার" : "Priority"}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-500"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === "bn" ? "টার্গেট সমাপ্তির তারিখ" : "Target Due Date"}
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Team Coordinator / Lead */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === "bn" ? "টিম লিডার / সমন্বয়ক" : "Team Lead / Coordinator"}
            </label>
            <select
              value={leaderEid}
              onChange={(e) => {
                setLeaderEid(e.target.value);
                if (!selectedMemberEids.includes(e.target.value)) {
                  setSelectedMemberEids([...selectedMemberEids, e.target.value]);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-500"
            >
              {allEmployees.map((emp) => (
                <option key={emp.eid} value={emp.eid}>
                  {emp.name} ({emp.designation}) - EID {emp.eid}
                </option>
              ))}
            </select>
          </div>

          {/* Assign Team Members (Multi-select) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {language === "bn" ? "দলের সদস্য নির্বাচন করুন (একাধিক)" : "Assign Team Members"}
              </label>
              <span className="text-[11px] font-bold text-red-600">
                {selectedMemberEids.length} {language === "bn" ? "জন নির্বাচিত" : "selected"}
              </span>
            </div>

            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Filter employees by name or location..."
              className="w-full px-3 py-1.5 mb-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-red-500"
            />

            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1 bg-slate-50/50">
              {filteredEmployees.map((emp) => {
                const isSelected = selectedMemberEids.includes(emp.eid);
                return (
                  <div
                    key={emp.eid}
                    onClick={() => toggleMember(emp.eid)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-red-50 border border-red-200" : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by div click
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <div className="truncate">
                        <span className="text-xs font-semibold text-slate-900 block truncate">
                          {emp.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {emp.designation} • {emp.location}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                      EID: {emp.eid}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Initial Milestones / Checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === "bn"
                ? "প্রাথমিক মাইলস্টোন বা চেকলিস্ট (প্রতি লাইনে একটি)"
                : "Initial Milestones / Checklist (One per line)"}
            </label>
            <textarea
              rows={3}
              value={milestonesText}
              onChange={(e) => setMilestonesText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              {language === "bn" ? "বাতিল" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {language === "bn" ? "গ্রুপ টাস্ক খুলুন" : "Create & Save to Cloud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
