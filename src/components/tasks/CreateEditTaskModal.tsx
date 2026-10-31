import React, { useState } from "react";
import { Task, TaskPriority, Employee, Subtask } from "../../types";
import { storage } from "../../services/storage";
import { useAuth } from "../../context/AuthContext";
import { X, Sparkles, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";

interface CreateEditTaskModalProps {
  task?: Task | null;
  onClose: () => void;
  onSaved: (savedTask: Task) => void;
}

export const CreateEditTaskModal: React.FC<CreateEditTaskModalProps> = ({ task, onClose, onSaved }) => {
  const { currentUser } = useAuth();
  const settings = storage.getSettings();
  const employees = storage.getEmployees().filter((e) => e.employmentStatus === "Active");

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [department, setDepartment] = useState(task?.department || "Program & Operation");
  const [location, setLocation] = useState(task?.location || "Head Office");
  const [category, setCategory] = useState(task?.category || "Program Operations");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "Medium");
  const [assignedToEid, setAssignedToEid] = useState(task?.assignedToEid || "1023");
  const [startDate, setStartDate] = useState(task?.startDate || new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(task?.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
  const [estimatedHours, setEstimatedHours] = useState<number>(task?.estimatedHours || 16);
  const [tagsInput, setTagsInput] = useState(task?.tags?.join(", ") || "Field, Operational");
  
  // Subtasks list
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || [
    { id: "st-1", title: "Conduct initial site coordination", completed: false, mandatory: true },
    { id: "st-2", title: "Complete operational milestone deliverable", completed: false, mandatory: true },
    { id: "st-3", title: "Upload completion evidence report", completed: false, mandatory: true },
  ]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // AI Assistance state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    suggestedCategory?: string;
    suggestedPriority?: string;
    priorityReasoning?: string;
    missingInfo?: string[];
    suggestedSubtasks?: string[];
    aiPowered?: boolean;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Gemini AI Suggestion caller
  const handleAiSuggest = async () => {
    if (!title.trim()) {
      setError("Please enter a task title first so Gemini can analyze it.");
      return;
    }
    setError(null);
    setAiLoading(true);

    try {
      const res = await fetch("/api/gemini/suggest-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          department,
          location,
        }),
      });
      const data = await res.json();
      setAiSuggestions(data);

      if (data.suggestedCategory && settings.taskCategories.includes(data.suggestedCategory)) {
        setCategory(data.suggestedCategory);
      }
      if (data.suggestedPriority) {
        setPriority(data.suggestedPriority as TaskPriority);
      }
      if (data.suggestedSubtasks && data.suggestedSubtasks.length > 0) {
        // Option to add suggestions
      }
    } catch (err: any) {
      console.error("AI error:", err);
      setError("AI service unavailable right now. You can continue manually.");
    } finally {
      setAiLoading(false);
    }
  };

  const addAiSubtask = (text: string) => {
    setSubtasks((prev) => [
      ...prev,
      {
        id: `st-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        title: text,
        completed: false,
        mandatory: true,
      },
    ]);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id: `st-${Date.now()}`,
        title: newSubtaskTitle.trim(),
        completed: false,
        mandatory: true,
      },
    ]);
    setNewSubtaskTitle("");
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }
    if (!dueDate) {
      setError("Due date is required.");
      return;
    }
    if (!assignedToEid) {
      setError("An eligible employee must be assigned.");
      return;
    }

    const assignedEmp = storage.getEmployeeByEid(assignedToEid);
    const supervisorEid = assignedEmp?.supervisorEid || "1013";

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const taskData: Task = {
      id: task?.id || "",
      title: title.trim(),
      description: description.trim(),
      category,
      department,
      location,
      priority,
      status: task?.status || "Open",
      creatorEid: task?.creatorEid || currentUser?.eid || "1001",
      assignedToEid,
      supervisorEid,
      approverEid: supervisorEid,
      startDate,
      dueDate,
      estimatedHours: Number(estimatedHours) || 8,
      tags,
      subtasks,
      dependencies: task?.dependencies || [],
      attachments: task?.attachments || [],
      comments: task?.comments || [],
      progressPercentage: task?.progressPercentage || 0,
      revisionCount: task?.revisionCount || 0,
      reviewHistory: task?.reviewHistory || [],
      createdAt: task?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = storage.saveTask(taskData, currentUser?.eid);
    onSaved(saved);
  };

  // Get current workload for the selected employee
  const selectedEmp = storage.getEmployeeByEid(assignedToEid);
  const openTasksForAssignee = storage
    .getTasks()
    .filter((t) => t.assignedToEid === assignedToEid && t.status !== "Completed" && t.status !== "Closed");

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {task ? `Edit Task (${task.id})` : "Create New Organizational Task"}
            </h3>
            <p className="text-xs text-slate-500">
              LEEDO Task Management & Accountability System
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Title & AI Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Task Title <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-red-600" />
                <span>{aiLoading ? "Analyzing with Gemini..." : "Gemini AI Assistant"}</span>
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Peace Home Children Winter Clothing Distribution & Sizing"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* AI Suggestions Box (if triggered) */}
          {aiSuggestions && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>Gemini Analysis & Recommendations</span>
              </div>
              {aiSuggestions.priorityReasoning && (
                <p className="text-slate-600">
                  <strong>Priority Reason:</strong> {aiSuggestions.priorityReasoning}
                </p>
              )}
              {aiSuggestions.missingInfo && aiSuggestions.missingInfo.length > 0 && (
                <div>
                  <span className="font-semibold text-amber-800">Potential Missing Info:</span>
                  <ul className="list-disc pl-4 text-slate-600 mt-0.5 space-y-0.5">
                    {aiSuggestions.missingInfo.map((info, i) => (
                      <li key={i}>{info}</li>
                    ))}
                  </ul>
                </div>
              )}
              {aiSuggestions.suggestedSubtasks && aiSuggestions.suggestedSubtasks.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-700">Suggested Action Items:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {aiSuggestions.suggestedSubtasks.map((st, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => addAiSubtask(st)}
                        className="text-[11px] bg-white border border-slate-300 hover:border-red-500 hover:text-red-700 px-2 py-0.5 rounded text-slate-700 flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{st}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Detailed Description & Objectives
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail deliverables, target children count, safety procedures, or specific outcomes expected..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Department, Location & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {settings.departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Field Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {settings.locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {settings.taskCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Assignee Workload Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["Low", "Medium", "High", "Urgent"] as TaskPriority[]).map((p) => {
                  const isSel = priority === p;
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        isSel
                          ? p === "Urgent"
                            ? "bg-red-600 text-white border-red-600"
                            : p === "High"
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Employee (with Live Workload)
              </label>
              <select
                value={assignedToEid}
                onChange={(e) => setAssignedToEid(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              >
                {employees.map((emp) => (
                  <option key={emp.eid} value={emp.eid}>
                    {emp.name} (EID: {emp.eid} · {emp.location})
                  </option>
                ))}
              </select>
              {selectedEmp && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Current Open Tasks: <strong className="text-slate-800">{openTasksForAssignee.length}</strong> ·
                  Supervisor: EID {selectedEmp.supervisorEid || "1001"}
                </p>
              )}
            </div>
          </div>

          {/* Dates & Effort */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Effort (Hours)
              </label>
              <input
                type="number"
                min={1}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
            </div>
          </div>

          {/* Subtasks Builder */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Subtasks & Required Milestones ({subtasks.length})
            </label>
            <div className="space-y-1.5 mb-2">
              {subtasks.map((st, idx) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400">{idx + 1}.</span>
                    <span className="text-slate-800">{st.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add actionable subtask..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Outreach, Nutrition, PeaceHome, Safeguarding"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              {task ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
