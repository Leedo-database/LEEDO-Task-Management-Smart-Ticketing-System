import React, { useState } from "react";
import { Task, TaskPriority, TaskStatus } from "../types";
import { storage } from "../services/storage";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Filter,
  Plus,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  MoreVertical,
  MapPin,
  User,
} from "lucide-react";

interface TaskListProps {
  filterMyTasksOnly?: boolean;
  onOpenTaskDetails: (task: Task) => void;
  onOpenCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  filterMyTasksOnly = false,
  onOpenTaskDetails,
  onOpenCreateTask,
  onEditTask,
}) => {
  const { currentUser, isSupervisorOrHigher, canViewAllTasks } = useAuth();
  const allTasks = storage.getTasks();
  const settings = storage.getSettings();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedLoc, setSelectedLoc] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Filtering: Only EID 1001, 1002, 1057 can see all tasks; others only see assigned tasks
  const filteredTasks = allTasks.filter((t) => {
    if ((filterMyTasksOnly || !canViewAllTasks) && t.assignedToEid !== currentUser?.eid) {
      return false;
    }
    if (selectedDept !== "All" && t.department !== selectedDept) {
      return false;
    }
    if (selectedLoc !== "All" && t.location !== selectedLoc) {
      return false;
    }
    if (selectedPriority !== "All" && t.priority !== selectedPriority) {
      return false;
    }
    if (selectedStatus !== "All" && t.status !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchId = t.id.toLowerCase().includes(q);
      const matchTags = t.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchAssignee = t.assignedToEid.includes(q);
      if (!matchTitle && !matchId && !matchTags && !matchAssignee) {
        return false;
      }
    }
    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Task ID",
      "Title",
      "Department",
      "Location",
      "Priority",
      "Status",
      "Assignee EID",
      "Due Date",
      "Progress %",
    ];
    const rows = filteredTasks.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.department,
      t.location,
      t.priority,
      t.status,
      t.assignedToEid,
      t.dueDate,
      t.progressPercentage,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LEEDO_Tasks_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const priorityBadge = (priority: TaskPriority) => {
    const styles = {
      Urgent: "bg-red-100 text-red-800 border-red-200",
      High: "bg-amber-100 text-amber-800 border-amber-200",
      Medium: "bg-blue-100 text-blue-800 border-blue-200",
      Low: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[priority]}`}>
        {priority}
      </span>
    );
  };

  const statusBadge = (status: TaskStatus) => {
    const styles: Record<string, string> = {
      "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
      Blocked: "bg-red-50 text-red-700 border-red-200 font-semibold",
      "Submitted for Review": "bg-amber-50 text-amber-800 border-amber-200 font-semibold",
      "Revision Required": "bg-rose-50 text-rose-800 border-rose-200",
      Approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
      Completed: "bg-green-50 text-green-800 border-green-200",
      Open: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return (
      <span
        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
          styles[status] || "bg-slate-100 text-slate-700 border-slate-200"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {filterMyTasksOnly ? "My Tasks Queue" : "Organizational Task Registry"}
          </h1>
          <p className="text-xs text-slate-500">
            {filteredTasks.length} tasks matched across verified LEEDO programs and shelters
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenCreateTask}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, task ID, tags, or assignee EID..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-44">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="All">All Departments</option>
              {settings.departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="w-full md:w-44">
            <select
              value={selectedLoc}
              onChange={(e) => setSelectedLoc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="All">All Locations</option>
              {settings.locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-40">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted for Review">In Review</option>
              <option value="Blocked">Blocked</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Title & Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Progress</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No tasks found matching current search criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const emp = storage.getEmployeeByEid(t.assignedToEid);
                  const isOverdue =
                    new Date(t.dueDate).getTime() < Date.now() &&
                    t.status !== "Completed" &&
                    t.status !== "Closed" &&
                    t.status !== "Approved";

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => onOpenTaskDetails(t)}
                    >
                      {/* Task ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {t.id}
                      </td>

                      {/* Title & Category */}
                      <td className="py-3 px-4 min-w-[240px]">
                        <div className="font-semibold text-slate-900 line-clamp-1">{t.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{t.category}</span>
                          <span>·</span>
                          <span>{t.department}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.location}</span>
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{emp?.name || t.assignedToEid}</div>
                        <div className="text-[10px] text-slate-400 font-mono">EID: {t.assignedToEid}</div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">{priorityBadge(t.priority)}</td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">{statusBadge(t.status)}</td>

                      {/* Due Date */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums">
                        <span className={isOverdue ? "text-red-600 font-bold flex items-center gap-1" : "text-slate-700"}>
                          {isOverdue && <Clock className="w-3.5 h-3.5" />}
                          {t.dueDate}
                        </span>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-red-600 h-1.5 rounded-full"
                              style={{ width: `${t.progressPercentage}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] tabular-nums font-semibold text-slate-700">
                            {t.progressPercentage}%
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenTaskDetails(t)}
                            className="px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded-md font-medium transition-colors"
                          >
                            Details
                          </button>
                          {isSupervisorOrHigher && (
                            <button
                              onClick={() => onEditTask(t)}
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md font-medium transition-colors"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
