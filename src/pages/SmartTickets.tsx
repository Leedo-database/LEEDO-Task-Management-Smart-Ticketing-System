import React, { useState } from "react";
import { Ticket, TaskPriority, TicketStatus, Task } from "../types";
import { storage } from "../services/storage";
import { useAuth } from "../context/AuthContext";
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Send,
  X,
  FileCheck2,
} from "lucide-react";

interface SmartTicketsProps {
  onOpenTaskDetails?: (task: Task) => void;
}

export const SmartTickets: React.FC<SmartTicketsProps> = ({ onOpenTaskDetails }) => {
  const { currentUser, isSupervisorOrHigher } = useAuth();
  const tickets = storage.getTickets();
  const settings = storage.getSettings();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // New ticket state
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("IT Support");
  const [location, setLocation] = useState(currentUser?.location || "Head Office");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [confidentialityLevel, setConfidentialityLevel] = useState<Ticket["confidentialityLevel"]>("Standard");

  // Comment state
  const [ticketComment, setTicketComment] = useState("");

  const filteredTickets = tickets.filter((t) => {
    if (categoryFilter !== "All" && t.category !== categoryFilter) return false;
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = t.subject.toLowerCase().includes(q);
      const matchId = t.id.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      if (!matchSubject && !matchId && !matchDesc) return false;
    }
    return true;
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      alert("Please enter a subject.");
      return;
    }

    const newTicket: Ticket = {
      id: `TCK-${Math.floor(800 + Math.random() * 200)}`,
      requesterEid: currentUser?.eid || "1001",
      department: currentUser?.department || "Program & Operation",
      location,
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      confidentialityLevel,
      status: "New",
      assignedSupportTeam: category.includes("IT")
        ? "ICT & Digital Systems"
        : category.includes("Transport")
        ? "Transport & Fleet"
        : category.includes("Maintenance")
        ? "Logistics & Maintenance"
        : "HR & Operations",
      targetResponseHours: priority === "Urgent" ? 12 : 48,
      resolutionDeadline: new Date(Date.now() + 48 * 3600000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      attachments: [],
    };

    const saved = storage.saveTicket(newTicket, currentUser?.eid);
    setShowCreateModal(false);
    setSubject("");
    setDescription("");
    setSelectedTicket(saved);
  };

  const handleAddTicketComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketComment.trim()) return;

    const newComment = {
      id: `tc-${Date.now()}`,
      authorEid: currentUser?.eid || "1001",
      authorName: currentUser?.name || "Staff",
      content: ticketComment.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated: Ticket = {
      ...selectedTicket,
      comments: [...selectedTicket.comments, newComment],
      status: selectedTicket.status === "New" ? "In Progress" : selectedTicket.status,
    };

    storage.saveTicket(updated, currentUser?.eid);
    setSelectedTicket(updated);
    setTicketComment("");
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    const updated: Ticket = {
      ...selectedTicket,
      status: newStatus,
      resolutionSummary: newStatus === "Resolved" ? "Request completed and service delivered." : undefined,
    };
    storage.saveTicket(updated, currentUser?.eid);
    setSelectedTicket(updated);
  };

  // Convert Ticket into an actual Task
  const handleConvertToTask = () => {
    if (!selectedTicket) return;

    const newTask: Task = {
      id: `TSK-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `[From ${selectedTicket.id}] ${selectedTicket.subject}`,
      description: `Originating internal ticket description:\n${selectedTicket.description}`,
      category: "General Request",
      department: selectedTicket.department,
      location: selectedTicket.location,
      priority: selectedTicket.priority,
      status: "In Progress",
      creatorEid: selectedTicket.requesterEid,
      assignedToEid: selectedTicket.assignedToEid || currentUser?.eid || "1009",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: selectedTicket.resolutionDeadline.split("T")[0],
      tags: ["FromTicket", selectedTicket.category.replace(/\s+/g, "")],
      subtasks: [
        { id: "st-t1", title: `Address internal request: ${selectedTicket.subject}`, completed: false, mandatory: true },
        { id: "st-t2", title: "Submit resolution report and close ticket", completed: false, mandatory: true },
      ],
      dependencies: [],
      attachments: selectedTicket.attachments,
      comments: [],
      progressPercentage: 10,
      revisionCount: 0,
      reviewHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveTask(newTask, currentUser?.eid);

    const updatedTicket: Ticket = {
      ...selectedTicket,
      status: "In Progress",
      convertedToTaskId: newTask.id,
    };
    storage.saveTicket(updatedTicket, currentUser?.eid);
    setSelectedTicket(updatedTicket);

    alert(`Ticket successfully converted to Task ${newTask.id}!`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Smart Internal Ticketing</h1>
          <p className="text-xs text-slate-500">
            Submit IT support, transport, facility repair, logistics, or HR service requests
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Raise New Ticket</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID, subject, or description..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
          >
            <option value="All">All Categories</option>
            {settings.ticketCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Grid: Tickets List (Left) + Details View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ticket List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 font-mono">
              MATCHED TICKETS ({filteredTickets.length})
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No tickets found for this query.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const requester = storage.getEmployeeByEid(t.requesterEid);
                const isSelected = selectedTicket?.id === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                      isSelected ? "bg-red-50/40 border-l-4 border-red-600" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-700">{t.id}</span>
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
                        {t.confidentialityLevel !== "Standard" && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span>{t.confidentialityLevel}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{t.subject}</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{t.description}</p>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span>Requester: <strong>{requester?.name || t.requesterEid}</strong></span>
                        <span>·</span>
                        <span>{t.location}</span>
                      </div>
                      <span className="font-semibold text-slate-700 px-2 py-0.5 bg-slate-100 rounded text-[10px]">
                        {t.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Ticket Details Drawer (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs sticky top-20">
          {!selectedTicket ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <LifeBuoy className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">Select a ticket from the left</p>
              <p className="text-slate-400 mt-0.5">View resolution progress, discuss, or convert to task</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-500">{selectedTicket.id}</span>
                  <span className="ml-2 text-xs font-semibold text-slate-700">
                    Category: {selectedTicket.category}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">{selectedTicket.subject}</h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span>Location: {selectedTicket.location}</span>
                  <span>·</span>
                  <span>Team: {selectedTicket.assignedSupportTeam}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap">
                {selectedTicket.description}
              </div>

              {/* Converted Task Link (if converted) */}
              {selectedTicket.convertedToTaskId && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <FileCheck2 className="w-4 h-4 text-indigo-600" />
                    <span>Linked Task: {selectedTicket.convertedToTaskId}</span>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-mono">
                    Tracking in Progress
                  </span>
                </div>
              )}

              {/* Status Controls */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Update Resolution Status:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(["Assigned", "In Progress", "Resolved", "Closed"] as TicketStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                        selectedTicket.status === st
                          ? "bg-slate-900 text-white font-semibold"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Convert to Task CTA */}
              {!selectedTicket.convertedToTaskId && (
                <button
                  onClick={handleConvertToTask}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Convert Ticket to Organizational Task</span>
                </button>
              )}

              {/* Discussion Feed */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                  Resolution Comments ({selectedTicket.comments.length})
                </h4>

                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {selectedTicket.comments.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-800 mb-0.5">
                        <span>{c.authorName}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-slate-600">{c.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddTicketComment} className="flex gap-2">
                  <input
                    type="text"
                    value={ticketComment}
                    onChange={(e) => setTicketComment(e.target.value)}
                    placeholder="Add update or technician note..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    Reply
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Raise Internal Service Ticket</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject / Service Need *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Broken RO water filter cartridge at Peace Home"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  {settings.ticketCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
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
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Urgent">Urgent (SLA: 12 hrs)</option>
                    <option value="High">High (SLA: 24 hrs)</option>
                    <option value="Medium">Medium (SLA: 48 hrs)</option>
                    <option value="Low">Low (SLA: 96 hrs)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Description & Requirements
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe problem, affected staff/children, emergency status..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
