import React, { useState } from "react";
import { Task, TaskComment, TaskAttachment, TaskStatus } from "../../types";
import { storage } from "../../services/storage";
import { useAuth } from "../../context/AuthContext";
import {
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Sparkles,
  Paperclip,
  MessageSquare,
  FileText,
  ShieldCheck,
  Send,
  CheckSquare,
  Square,
  CornerDownRight,
} from "lucide-react";

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  onTaskUpdated: (updatedTask: Task) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task: initialTask,
  onClose,
  onTaskUpdated,
}) => {
  const { currentUser, isSupervisorOrHigher, canApproveTasks } = useAuth();
  const [task, setTask] = useState<Task>(initialTask);

  const [commentText, setCommentText] = useState("");
  const [blockerText, setBlockerText] = useState("");
  const [showBlockerInput, setShowBlockerInput] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [showEvidenceInput, setShowEvidenceInput] = useState(false);

  // AI summary state
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<{
    summary?: string;
    blockersOrRisks?: string;
    recommendedNextStep?: string;
    aiPowered?: boolean;
  } | null>(null);

  const assignee = storage.getEmployeeByEid(task.assignedToEid);
  const creator = storage.getEmployeeByEid(task.creatorEid);
  const supervisor = storage.getEmployeeByEid(task.supervisorEid || "");

  // Update task helper
  const updateTaskData = (updated: Task) => {
    setTask(updated);
    storage.saveTask(updated, currentUser?.eid);
    onTaskUpdated(updated);
  };

  // Toggle Subtask
  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const completedCount = updatedSubtasks.filter((st) => st.completed).length;
    const progress = Math.round((completedCount / (updatedSubtasks.length || 1)) * 100);

    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
      progressPercentage: progress,
    };
    updateTaskData(updatedTask);
  };

  // Add Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: TaskComment = {
      id: `cmt-${Date.now()}`,
      authorEid: currentUser?.eid || "1001",
      authorName: currentUser?.name || "LEEDO Staff",
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedTask: Task = {
      ...task,
      comments: [...task.comments, newComment],
    };
    updateTaskData(updatedTask);
    setCommentText("");
  };

  // Add mock file attachment
  const handleAddAttachment = () => {
    const fileName = prompt("Enter attachment document title (e.g. Field_Inspection_Proof.pdf):");
    if (!fileName) return;

    const newAtt: TaskAttachment = {
      id: `att-${Date.now()}`,
      name: fileName.trim(),
      size: "1.2 MB",
      type: "application/pdf",
      url: "#",
      uploadedByEid: currentUser?.eid || "1001",
      uploadedAt: new Date().toISOString(),
    };

    const updatedTask: Task = {
      ...task,
      attachments: [...task.attachments, newAtt],
    };
    updateTaskData(updatedTask);
  };

  // Status transitions
  const handleStartTask = () => {
    const updated: Task = { ...task, status: "In Progress" };
    updateTaskData(updated);
  };

  const handleSubmitForReview = () => {
    // Check if mandatory subtasks are completed
    const uncompletedMandatory = task.subtasks.filter((st) => st.mandatory && !st.completed);
    if (uncompletedMandatory.length > 0) {
      alert(`Cannot submit for review: ${uncompletedMandatory.length} mandatory subtasks are still incomplete.`);
      return;
    }

    const updated: Task = {
      ...task,
      status: "Submitted for Review",
      completionEvidence: evidenceNote || task.completionEvidence || "Task completed and verified by assignee.",
      progressPercentage: 100,
    };
    updateTaskData(updated);
    setShowEvidenceInput(false);

    // Notify supervisor
    if (task.supervisorEid) {
      storage.createNotification({
        recipientEid: task.supervisorEid,
        title: "Task Submitted for Review",
        message: `${currentUser?.name} submitted task ${task.id} ("${task.title}") for your approval.`,
        type: "task_approval",
        linkPath: "/review-approvals",
      });
    }
  };

  const handleReportBlocker = () => {
    if (!blockerText.trim()) return;
    const updated: Task = {
      ...task,
      status: "Blocked",
      blockerDescription: blockerText.trim(),
    };
    updateTaskData(updated);
    setShowBlockerInput(false);
    setBlockerText("");

    if (task.supervisorEid) {
      storage.createNotification({
        recipientEid: task.supervisorEid,
        title: "Task Blocked Alert",
        message: `Task ${task.id} is blocked: "${blockerText}"`,
        type: "deadline_warning",
        linkPath: "/tasks",
      });
    }
  };

  const handleResolveBlocker = () => {
    const updated: Task = {
      ...task,
      status: "In Progress",
      blockerDescription: undefined,
    };
    updateTaskData(updated);
  };

  const handleApproveTask = () => {
    const reviewRecord = {
      id: `rev-${Date.now()}`,
      reviewerEid: currentUser?.eid || "1001",
      reviewerName: currentUser?.name || "Supervisor",
      decision: "Approved" as const,
      comments: "Verified deliverables, subtasks and evidence compliant with LEEDO requirements.",
      timestamp: new Date().toISOString(),
    };

    const updated: Task = {
      ...task,
      status: "Approved",
      approverEid: currentUser?.eid,
      reviewHistory: [...task.reviewHistory, reviewRecord],
      closedAt: new Date().toISOString(),
    };
    updateTaskData(updated);

    storage.createNotification({
      recipientEid: task.assignedToEid,
      title: "Task Approved",
      message: `Your task ${task.id} ("${task.title}") has been approved by ${currentUser?.name}.`,
      type: "task_assigned",
      linkPath: "/tasks",
    });
  };

  const handleReturnRevision = () => {
    if (!revisionReason.trim()) return;
    const reviewRecord = {
      id: `rev-${Date.now()}`,
      reviewerEid: currentUser?.eid || "1001",
      reviewerName: currentUser?.name || "Supervisor",
      decision: "Revision Required" as const,
      comments: revisionReason.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated: Task = {
      ...task,
      status: "Revision Required",
      revisionCount: (task.revisionCount || 0) + 1,
      reviewHistory: [...task.reviewHistory, reviewRecord],
    };
    updateTaskData(updated);
    setShowRevisionInput(false);
    setRevisionReason("");

    storage.createNotification({
      recipientEid: task.assignedToEid,
      title: "Revision Requested on Task",
      message: `Supervisor ${currentUser?.name} requested changes on ${task.id}: "${revisionReason}"`,
      type: "task_approval",
      linkPath: "/tasks",
    });
  };

  // AI Summary fetcher
  const handleGenerateSummary = async () => {
    setAiSummaryLoading(true);
    try {
      const res = await fetch("/api/gemini/summarize-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          status: task.status,
          subtasks: task.subtasks,
          comments: task.comments,
        }),
      });
      const data = await res.json();
      setAiSummary(data);
    } catch (err) {
      console.error("AI summary error:", err);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const priorityColors = {
    Urgent: "bg-red-100 text-red-800 border-red-200",
    High: "bg-amber-100 text-amber-800 border-amber-200",
    Medium: "bg-blue-100 text-blue-800 border-blue-200",
    Low: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const statusColors: Record<TaskStatus, string> = {
    Draft: "bg-slate-100 text-slate-700",
    Submitted: "bg-purple-100 text-purple-700",
    Open: "bg-sky-100 text-sky-700",
    Assigned: "bg-indigo-100 text-indigo-700",
    Accepted: "bg-teal-100 text-teal-700",
    "In Progress": "bg-blue-100 text-blue-700",
    "On Hold": "bg-yellow-100 text-yellow-700",
    Blocked: "bg-red-100 text-red-700",
    "Submitted for Review": "bg-amber-100 text-amber-800",
    "Revision Required": "bg-rose-100 text-rose-800",
    Approved: "bg-emerald-100 text-emerald-800",
    Completed: "bg-green-100 text-green-800",
    Closed: "bg-slate-200 text-slate-800",
    Cancelled: "bg-stone-200 text-stone-700",
    Archived: "bg-neutral-200 text-neutral-600",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
              {task.id}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                priorityColors[task.priority]
              }`}
            >
              {task.priority} Priority
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                statusColors[task.status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {task.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateSummary}
              disabled={aiSummaryLoading}
              className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors"
              title="Generate Executive AI Summary"
            >
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>{aiSummaryLoading ? "Summarizing..." : "Gemini Summary"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Title & Metadata Strip */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">{task.title}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                <span>Assignee:</span>
                <strong className="text-slate-900">
                  {assignee?.name || "Unassigned"} ({task.assignedToEid})
                </strong>
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Supervisor:</span>
                <span className="text-slate-800">{supervisor?.name || "ED Office"}</span>
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{task.location}</span>
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Due:</span>
                <strong className="font-mono text-slate-900">{task.dueDate}</strong>
              </div>
            </div>
          </div>

          {/* AI Executive Summary Card (if triggered) */}
          {aiSummary && (
            <div className="p-4 bg-red-50/50 border border-red-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-red-900">
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>Executive AI Summary</span>
              </div>
              <p className="text-slate-800 leading-relaxed">{aiSummary.summary}</p>
              {aiSummary.blockersOrRisks && (
                <p className="text-slate-700">
                  <strong>Risk Assessment:</strong> {aiSummary.blockersOrRisks}
                </p>
              )}
              {aiSummary.recommendedNextStep && (
                <p className="text-slate-700">
                  <strong>Next Action:</strong> {aiSummary.recommendedNextStep}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              Task Scope & Description
            </h4>
            <p className="text-sm text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed">
              {task.description || "No specific detailed instructions recorded."}
            </p>
          </div>

          {/* Blocker Notice (if blocked) */}
          {task.status === "Blocked" && task.blockerDescription && (
            <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Current Operational Blocker:</p>
                <p className="mt-0.5">{task.blockerDescription}</p>
              </div>
            </div>
          )}

          {/* Subtasks & Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Milestones & Subtasks ({task.subtasks.filter((s) => s.completed).length}/
                {task.subtasks.length})
              </h4>
              <span className="font-mono text-xs font-bold text-slate-700">
                {task.progressPercentage}% Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  task.progressPercentage === 100 ? "bg-emerald-600" : "bg-red-600"
                }`}
                style={{ width: `${task.progressPercentage}%` }}
              />
            </div>

            <div className="space-y-2">
              {task.subtasks.map((st) => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => handleToggleSubtask(st.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-colors flex items-center justify-between text-xs ${
                    st.completed
                      ? "bg-emerald-50/40 border-emerald-200 text-slate-700"
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {st.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={st.completed ? "line-through text-slate-500" : "font-medium"}>
                      {st.title}
                    </span>
                  </div>
                  {st.mandatory && (
                    <span className="text-[10px] font-mono text-amber-700 font-semibold px-1.5 py-0.5 bg-amber-50 rounded">
                      Required
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence of Completion (if present) */}
          {task.completionEvidence && (
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-1">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Completion Evidence Documented</span>
              </p>
              <p className="text-slate-700">{task.completionEvidence}</p>
            </div>
          )}

          {/* Attachments Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Attachments & Supporting Documents ({task.attachments.length})
              </h4>
              <button
                type="button"
                onClick={handleAddAttachment}
                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Attach Document</span>
              </button>
            </div>

            {task.attachments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No files attached to this task yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {task.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{att.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0">{att.size}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review History (if revisions/approvals happened) */}
          {task.reviewHistory && task.reviewHistory.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                Supervisor Review & Audit Trail ({task.reviewHistory.length})
              </h4>
              <div className="space-y-2">
                {task.reviewHistory.map((rh) => (
                  <div
                    key={rh.id}
                    className={`p-3 rounded-lg border text-xs ${
                      rh.decision === "Approved"
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-rose-50 border-rose-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>
                        {rh.reviewerName} · Decision: {rh.decision}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {new Date(rh.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-700 mt-1">{rh.comments}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments & Discussion */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
              Activity & Discussion ({task.comments.length})
            </h4>
            <div className="space-y-2.5 mb-3">
              {task.comments.map((cmt) => (
                <div key={cmt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{cmt.authorName}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(cmt.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-700">{cmt.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write an operational comment or update..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* Workflow Action Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
          {/* Sub-inputs if needed */}
          {showBlockerInput && (
            <div className="mb-3 p-3 bg-white rounded-xl border border-red-300 space-y-2">
              <p className="text-xs font-semibold text-red-800">Describe the operational blocker:</p>
              <textarea
                rows={2}
                value={blockerText}
                onChange={(e) => setBlockerText(e.target.value)}
                placeholder="Explain missing resources, transport failure, or dependency..."
                className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowBlockerInput(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportBlocker}
                  className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded"
                >
                  Confirm Blocker
                </button>
              </div>
            </div>
          )}

          {showRevisionInput && (
            <div className="mb-3 p-3 bg-white rounded-xl border border-rose-300 space-y-2">
              <p className="text-xs font-semibold text-rose-800">
                Supervisor Feedback (Explain why revision is needed):
              </p>
              <textarea
                rows={2}
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="e.g. Please attach signed attendance sheet and photograph from field camp..."
                className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRevisionInput(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturnRevision}
                  className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded"
                >
                  Submit Revision Request
                </button>
              </div>
            </div>
          )}

          {showEvidenceInput && (
            <div className="mb-3 p-3 bg-white rounded-xl border border-emerald-300 space-y-2">
              <p className="text-xs font-semibold text-emerald-800">
                Completion Note / Evidence Statement:
              </p>
              <textarea
                rows={2}
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                placeholder="Describe completed deliverables for supervisor inspection..."
                className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowEvidenceInput(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitForReview}
                  className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded"
                >
                  Send for Review
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {task.status === "Open" && (
                <button
                  onClick={handleStartTask}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Start Progress
                </button>
              )}

              {task.status === "In Progress" && (
                <>
                  <button
                    onClick={() => setShowEvidenceInput(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  >
                    Submit for Review
                  </button>
                  <button
                    onClick={() => setShowBlockerInput(true)}
                    className="px-3 py-2 bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Report Blocker
                  </button>
                </>
              )}

              {task.status === "Blocked" && (
                <button
                  onClick={handleResolveBlocker}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Mark Blocker Resolved
                </button>
              )}

              {task.status === "Revision Required" && (
                <button
                  onClick={handleStartTask}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Resume Work on Revisions
                </button>
              )}

              {/* Supervisor Actions */}
              {task.status === "Submitted for Review" && canApproveTasks && (
                <>
                  <button
                    onClick={handleApproveTask}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Task</span>
                  </button>
                  <button
                    onClick={() => setShowRevisionInput(true)}
                    className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Request Revision
                  </button>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
