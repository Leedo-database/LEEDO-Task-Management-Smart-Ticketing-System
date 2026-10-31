import React, { useState } from "react";
import { Task, TaskStatus } from "../types";
import { storage } from "../services/storage";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface TaskBoardProps {
  onOpenTaskDetails: (task: Task) => void;
  onOpenCreateTask: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ onOpenTaskDetails, onOpenCreateTask }) => {
  const { currentUser, isSupervisorOrHigher, canApproveTasks, canViewAllTasks } = useAuth();
  const allTasks = storage.getTasks();
  const settings = storage.getSettings();

  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedLoc, setSelectedLoc] = useState("All");

  const filteredTasks = allTasks.filter((t) => {
    if (!canViewAllTasks && t.assignedToEid !== currentUser?.eid) return false;
    if (selectedDept !== "All" && t.department !== selectedDept) return false;
    if (selectedLoc !== "All" && t.location !== selectedLoc) return false;
    return true;
  });

  const columns: { title: string; status: TaskStatus; badgeColor: string }[] = [
    { title: "To Do / Open", status: "Open", badgeColor: "bg-slate-200 text-slate-800" },
    { title: "In Progress", status: "In Progress", badgeColor: "bg-blue-100 text-blue-800" },
    { title: "Blocked", status: "Blocked", badgeColor: "bg-red-100 text-red-800" },
    { title: "Review Queue", status: "Submitted for Review", badgeColor: "bg-amber-100 text-amber-800" },
    { title: "Approved & Completed", status: "Approved", badgeColor: "bg-emerald-100 text-emerald-800" },
  ];

  const handleMoveStatus = (task: Task, newStatus: TaskStatus, e: React.MouseEvent) => {
    e.stopPropagation();

    if (newStatus === "Approved" && !canApproveTasks) {
      alert("Only authorized supervisors or management can approve tasks.");
      return;
    }

    const updated: Task = {
      ...task,
      status: newStatus,
      progressPercentage: newStatus === "Approved" ? 100 : task.progressPercentage,
    };
    storage.saveTask(updated, currentUser?.eid);
  };

  return (
    <div className="space-y-5">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kanban Task Board</h1>
          <p className="text-xs text-slate-500">
            Interactive visual workflow tracking for LEEDO field operations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
          >
            <option value="All">All Departments</option>
            {settings.departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={selectedLoc}
            onChange={(e) => setSelectedLoc(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
          >
            <option value="All">All Locations</option>
            {settings.locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenCreateTask}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Columns Grid with mobile horizontal swipe */}
      <div className="flex md:grid md:grid-cols-5 gap-4 overflow-x-auto min-h-[550px] items-start pb-6">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => {
            if (col.status === "Approved") {
              return t.status === "Approved" || t.status === "Completed";
            }
            return t.status === col.status;
          });

          return (
            <div
              key={col.status}
              className="bg-slate-100/80 border border-slate-200 rounded-xl p-3 flex flex-col w-[280px] md:w-auto shrink-0 md:shrink max-h-[75vh]"
            >
              {/* Column Title */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800">{col.title}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    No tasks in {col.title}
                  </div>
                ) : (
                  colTasks.map((t) => {
                    const assignee = storage.getEmployeeByEid(t.assignedToEid);
                    const isOverdue =
                      new Date(t.dueDate).getTime() < Date.now() &&
                      t.status !== "Completed" &&
                      t.status !== "Approved";

                    return (
                      <div
                        key={t.id}
                        onClick={() => onOpenTaskDetails(t)}
                        className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer space-y-2.5"
                      >
                        {/* Top: ID & Priority */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-slate-500">{t.id}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                              t.priority === "Urgent"
                                ? "bg-red-100 text-red-800"
                                : t.priority === "High"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                          {t.title}
                        </h4>

                        {/* Assignee & Location */}
                        <div className="text-[11px] text-slate-500 space-y-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-800 truncate">
                              {assignee?.name || t.assignedToEid}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{t.location}</span>
                          </div>
                        </div>

                        {/* Progress & Due Date */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 text-slate-500 font-mono">
                            <span>
                              {t.subtasks.filter((s) => s.completed).length}/{t.subtasks.length} subtasks
                            </span>
                          </div>
                          <div className={`font-mono font-medium ${isOverdue ? "text-red-600 font-bold" : "text-slate-500"}`}>
                            {t.dueDate}
                          </div>
                        </div>

                        {/* Quick Mover Bar */}
                        <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                          {col.status === "Open" && (
                            <button
                              onClick={(e) => handleMoveStatus(t, "In Progress", e)}
                              className="w-full text-center py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded transition-colors"
                            >
                              Start →
                            </button>
                          )}
                          {col.status === "In Progress" && (
                            <div className="flex w-full gap-1">
                              <button
                                onClick={(e) => handleMoveStatus(t, "Blocked", e)}
                                className="flex-1 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded"
                              >
                                Block
                              </button>
                              <button
                                onClick={(e) => handleMoveStatus(t, "Submitted for Review", e)}
                                className="flex-1 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded"
                              >
                                Submit Review →
                              </button>
                            </div>
                          )}
                          {col.status === "Blocked" && (
                            <button
                              onClick={(e) => handleMoveStatus(t, "In Progress", e)}
                              className="w-full py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded"
                            >
                              Resume Progress →
                            </button>
                          )}
                          {col.status === "Submitted for Review" && canApproveTasks && (
                            <button
                              onClick={(e) => handleMoveStatus(t, "Approved", e)}
                              className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded"
                            >
                              Approve & Complete ✓
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
