import React, { useState } from "react";
import { MeetingActionPoint, Task } from "../types";
import { storage } from "../services/storage";
import { useAuth } from "../context/AuthContext";
import {
  NotebookPen,
  Sparkles,
  Plus,
  Calendar,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
  Check,
} from "lucide-react";

export const MeetingActionPoints: React.FC = () => {
  const { currentUser } = useAuth();
  const employees = storage.getEmployees();

  const [meetingTitle, setMeetingTitle] = useState("Weekly Executive & Field Operations Coordination");
  const [attendees, setAttendees] = useState("Forhad Hossain (1001), Murshida Kanta (1002), Md. Sohel Rana (1013), Tania Akter (1014), Md. Masud (1023)");
  const [notes, setNotes] = useState(
    `Decisions from management session:
1. Tania Akter to inspect Peace Home winter blankets stock and submit requisition for 80 new blankets before Nov 5.
2. Md. Masud to coordinate with Kamalapur railway GRP for security permit for upcoming street medical camp by Oct 29.
3. Rone Ahammed to schedule vehicle fitness check for ambulance van with driver Ibrahim by Nov 2.
4. Azizur Rahman to compile donor draft quarterly progress slides by Oct 30.`
  );

  const [actionPoints, setActionPoints] = useState<MeetingActionPoint[]>([
    {
      id: "ap-1",
      meetingTitle: "Weekly Executive & Field Operations Coordination",
      date: "2026-10-26",
      actionItem: "Inspect Peace Home winter blankets stock and submit requisition",
      description: "Ensure all 80 children at Peace Home have sufficient warm bedding.",
      responsibleEid: "1014",
      department: "Program & Operation",
      deadline: "2026-11-05",
      priority: "High",
      status: "Pending",
    },
    {
      id: "ap-2",
      meetingTitle: "Weekly Executive & Field Operations Coordination",
      date: "2026-10-26",
      actionItem: "Coordinate with Kamalapur railway police for medical camp security",
      description: "Liaise with station master and GRP incharge for shelter outreach safety.",
      responsibleEid: "1023",
      department: "Program & Operation",
      deadline: "2026-10-29",
      priority: "Urgent",
      status: "Pending",
    },
  ]);

  const [aiExtracting, setAiExtracting] = useState(false);

  // Call Gemini backend to parse action points
  const handleExtractWithAi = async () => {
    if (!notes.trim()) {
      alert("Please enter meeting notes first.");
      return;
    }
    setAiExtracting(true);

    try {
      const res = await fetch("/api/gemini/extract-meeting-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingTitle,
          attendees,
          notes,
        }),
      });

      const data = await res.json();
      if (data.actionPoints && Array.isArray(data.actionPoints)) {
        const mapped: MeetingActionPoint[] = data.actionPoints.map((ap: any, i: number) => {
          // Attempt to match assignee to known EID
          const matchedEmp = employees.find(
            (e) =>
              ap.proposedAssignee &&
              (e.name.toLowerCase().includes(ap.proposedAssignee.toLowerCase()) ||
                ap.proposedAssignee.includes(e.eid))
          );

          const days = ap.deadlineDaysFromNow || 5;
          const deadlineDate = new Date(Date.now() + days * 86400000).toISOString().split("T")[0];

          return {
            id: `ap-${Date.now()}-${i}`,
            meetingTitle,
            date: new Date().toISOString().split("T")[0],
            actionItem: ap.title,
            description: ap.description,
            responsibleEid: matchedEmp ? matchedEmp.eid : "1013",
            department: ap.department || "Program & Operation",
            deadline: deadlineDate,
            priority: ap.priority || "Medium",
            status: "Pending",
          };
        });

        setActionPoints((prev) => [...mapped, ...prev]);
      }
    } catch (err) {
      console.error("AI error:", err);
      alert("Failed to extract action items via AI. You can add them manually.");
    } finally {
      setAiExtracting(false);
    }
  };

  // Convert an action point into an authoritative Task
  const handleConvertToTask = (ap: MeetingActionPoint) => {
    const newTask: Task = {
      id: `TSK-${Math.floor(1000 + Math.random() * 9000)}`,
      title: ap.actionItem,
      description: `Action point from meeting: "${ap.meetingTitle}" (${ap.date})\n${ap.description || ""}`,
      category: "Meeting & Reporting",
      department: ap.department,
      location: "Head Office",
      priority: ap.priority,
      status: "In Progress",
      creatorEid: currentUser?.eid || "1001",
      assignedToEid: ap.responsibleEid || "1013",
      supervisorEid: currentUser?.eid || "1001",
      approverEid: currentUser?.eid || "1001",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: ap.deadline,
      estimatedHours: 8,
      tags: ["MeetingAction", "Executive"],
      subtasks: [
        { id: "st-ap1", title: ap.actionItem, completed: false, mandatory: true },
        { id: "st-ap2", title: "Submit completion status to executive meeting coordinator", completed: false, mandatory: true },
      ],
      dependencies: [],
      attachments: [],
      comments: [],
      progressPercentage: 0,
      revisionCount: 0,
      reviewHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveTask(newTask, currentUser?.eid);

    setActionPoints((prev) =>
      prev.map((item) =>
        item.id === ap.id
          ? { ...item, status: "Converted to Task", convertedTaskId: newTask.id }
          : item
      )
    );

    alert(`Task ${newTask.id} successfully created from meeting action point!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Meeting Action Points Module</h1>
        <p className="text-xs text-slate-500">
          Capture management decisions, extract actionable deliverables with Gemini AI, and convert directly to tasks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Meeting Notes & AI Extractor (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Meeting Notes & Decisions</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Title</label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Participants</label>
            <input
              type="text"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Discussion Notes & Resolutions
            </label>
            <textarea
              rows={7}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste raw meeting notes, action items discussed..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono"
            />
          </div>

          <button
            onClick={handleExtractWithAi}
            disabled={aiExtracting}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>{aiExtracting ? "Extracting with Gemini..." : "Extract Action Items with AI"}</span>
          </button>
        </div>

        {/* Right: Extracted Action Points List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Tracked Action Points ({actionPoints.length})
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">1-Click Convert to Task</span>
          </div>

          <div className="space-y-3">
            {actionPoints.map((ap) => {
              const respEmp = storage.getEmployeeByEid(ap.responsibleEid || "");

              return (
                <div
                  key={ap.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                        {ap.department}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">{ap.actionItem}</h4>
                      {ap.description && (
                        <p className="text-[11px] text-slate-600 mt-0.5">{ap.description}</p>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        ap.priority === "Urgent"
                          ? "bg-red-100 text-red-800"
                          : ap.priority === "High"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {ap.priority}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>
                        Responsible: <strong>{respEmp?.name || ap.responsibleEid}</strong>
                      </span>
                      <span>·</span>
                      <span className="font-mono">Deadline: {ap.deadline}</span>
                    </div>

                    {ap.status === "Converted to Task" ? (
                      <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1 font-mono">
                        <Check className="w-3.5 h-3.5" />
                        <span>Task {ap.convertedTaskId}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConvertToTask(ap)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>Create Task</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
