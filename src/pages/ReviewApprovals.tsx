import React, { useState } from "react";
import { Task } from "../types";
import { storage } from "../services/storage";
import { useAuth } from "../context/AuthContext";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  User,
  MapPin,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

interface ReviewApprovalsProps {
  onOpenTaskDetails: (task: Task) => void;
}

export const ReviewApprovals: React.FC<ReviewApprovalsProps> = ({ onOpenTaskDetails }) => {
  const { currentUser, canApproveTasks } = useAuth();
  const allTasks = storage.getTasks();

  const [revisionNote, setRevisionNote] = useState<Record<string, string>>({});
  const [activeRevisionTaskId, setActiveRevisionTaskId] = useState<string | null>(null);

  const pendingTasks = allTasks.filter((t) => t.status === "Submitted for Review");
  const approvedTasks = allTasks.filter((t) => t.status === "Approved" || t.status === "Completed");

  const handleApprove = (task: Task) => {
    if (!canApproveTasks) {
      alert("You do not have approval permissions.");
      return;
    }

    const reviewRecord = {
      id: `rev-${Date.now()}`,
      reviewerEid: currentUser?.eid || "1001",
      reviewerName: currentUser?.name || "Supervisor",
      decision: "Approved" as const,
      comments: "Approved deliverables and evidence verified against standards.",
      timestamp: new Date().toISOString(),
    };

    const updated: Task = {
      ...task,
      status: "Approved",
      approverEid: currentUser?.eid,
      reviewHistory: [...task.reviewHistory, reviewRecord],
      closedAt: new Date().toISOString(),
    };

    storage.saveTask(updated, currentUser?.eid);
    storage.createNotification({
      recipientEid: task.assignedToEid,
      title: "Task Approved by Supervisor",
      message: `Your task ${task.id} ("${task.title}") has been officially approved.`,
      type: "task_assigned",
      linkPath: "/tasks",
    });
  };

  const handleRevision = (task: Task) => {
    const note = revisionNote[task.id] || "";
    if (!note.trim()) {
      alert("Please provide specific feedback on what revisions are required.");
      return;
    }

    const reviewRecord = {
      id: `rev-${Date.now()}`,
      reviewerEid: currentUser?.eid || "1001",
      reviewerName: currentUser?.name || "Supervisor",
      decision: "Revision Required" as const,
      comments: note.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated: Task = {
      ...task,
      status: "Revision Required",
      revisionCount: (task.revisionCount || 0) + 1,
      reviewHistory: [...task.reviewHistory, reviewRecord],
    };

    storage.saveTask(updated, currentUser?.eid);
    setActiveRevisionTaskId(null);

    storage.createNotification({
      recipientEid: task.assignedToEid,
      title: "Revision Requested on Task",
      message: `Supervisor ${currentUser?.name} requested revisions on ${task.id}: "${note.trim()}"`,
      type: "task_approval",
      linkPath: "/tasks",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Supervisor Review & Approvals</h1>
        <p className="text-xs text-slate-500">
          Scrutinize submitted deliverables, field evidence, and audit checklists before sign-off
        </p>
      </div>

      {/* Main Review Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Pending Review Queue ({pendingTasks.length})
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Authorization Level: {currentUser?.role.toUpperCase()}
          </span>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-medium text-slate-700">No tasks currently waiting for review!</p>
            <p className="text-slate-400 mt-0.5">All submitted deliverables have been processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTasks.map((t) => {
              const emp = storage.getEmployeeByEid(t.assignedToEid);
              const uncompletedCount = t.subtasks.filter((s) => !s.completed).length;

              return (
                <div
                  key={t.id}
                  className="p-5 rounded-xl border border-amber-200 bg-amber-50/20 space-y-4 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                          {t.id}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Submitted by: <strong>{emp?.name || t.assignedToEid}</strong></span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.location}</span>
                        </span>
                        <span>·</span>
                        <span className="font-mono">Due: {t.dueDate}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenTaskDetails(t)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
                    >
                      View Full Details
                    </button>
                  </div>

                  {/* Evidence Statement */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                    <p className="font-semibold text-slate-700 mb-0.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>Completion Evidence / Handover Note:</span>
                    </p>
                    <p className="text-slate-600">{t.completionEvidence || "Assignee marked all subtasks complete."}</p>
                  </div>

                  {/* Subtasks progress */}
                  <div className="text-xs flex items-center justify-between text-slate-600">
                    <span className="font-medium">
                      Subtasks: {t.subtasks.filter((s) => s.completed).length}/{t.subtasks.length} Completed
                    </span>
                    {uncompletedCount > 0 ? (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{uncompletedCount} subtasks still open</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>All mandatory subtasks fulfilled</span>
                      </span>
                    )}
                  </div>

                  {/* Revision input dialog if toggled */}
                  {activeRevisionTaskId === t.id && (
                    <div className="p-3 bg-white rounded-xl border border-rose-300 space-y-2">
                      <label className="block text-xs font-semibold text-rose-800">
                        Explanation of required changes or missing verification:
                      </label>
                      <textarea
                        rows={2}
                        value={revisionNote[t.id] || ""}
                        onChange={(e) =>
                          setRevisionNote({ ...revisionNote, [t.id]: e.target.value })
                        }
                        placeholder="e.g. Please upload doctor's signed camp register..."
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setActiveRevisionTaskId(null)}
                          className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRevision(t)}
                          className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded"
                        >
                          Send Revision Order
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => setActiveRevisionTaskId(t.id)}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg transition-colors border border-rose-200"
                    >
                      Return for Revision
                    </button>
                    <button
                      onClick={() => handleApprove(t)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Sign-Off</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approved History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Recently Approved Tasks ({approvedTasks.length})
        </h3>
        <div className="divide-y divide-slate-100 text-xs">
          {approvedTasks.slice(0, 5).map((t) => (
            <div
              key={t.id}
              onClick={() => onOpenTaskDetails(t)}
              className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer"
            >
              <div>
                <span className="font-mono font-bold text-slate-700 mr-2">{t.id}</span>
                <span className="font-semibold text-slate-900">{t.title}</span>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Location: {t.location} · Closed: {t.closedAt ? new Date(t.closedAt).toLocaleDateString() : t.dueDate}
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Approved
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
