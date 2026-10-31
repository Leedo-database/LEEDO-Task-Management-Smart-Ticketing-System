import React, { useState } from "react";
import { storage } from "../services/storage";
import { Employee, Task } from "../types";
import {
  BarChart3,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  TrendingUp,
  Search,
} from "lucide-react";

export const WorkloadCapacity: React.FC = () => {
  const employees = storage.getEmployees().filter((e) => e.employmentStatus === "Active");
  const tasks = storage.getTasks();
  const settings = storage.getSettings();

  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedLoc, setSelectedLoc] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmployees = employees.filter((emp) => {
    if (selectedDept !== "All" && emp.department !== selectedDept) return false;
    if (selectedLoc !== "All" && emp.location !== selectedLoc) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!emp.name.toLowerCase().includes(q) && !emp.eid.includes(q)) return false;
    }
    return true;
  });

  // Calculate workloads for each employee
  const employeeWorkloads = filteredEmployees.map((emp) => {
    const empTasks = tasks.filter((t) => t.assignedToEid === emp.eid);
    const openTasks = empTasks.filter((t) => t.status !== "Completed" && t.status !== "Closed");
    const inProgress = empTasks.filter((t) => t.status === "In Progress");
    const overdue = empTasks.filter(
      (t) =>
        new Date(t.dueDate).getTime() < Date.now() &&
        t.status !== "Completed" &&
        t.status !== "Closed" &&
        t.status !== "Approved"
    );
    const blocked = empTasks.filter((t) => t.status === "Blocked");
    const urgentHigh = empTasks.filter(
      (t) => (t.priority === "Urgent" || t.priority === "High") && t.status !== "Completed" && t.status !== "Closed"
    );
    const totalEstHours = openTasks.reduce((acc, t) => acc + (t.estimatedHours || 8), 0);

    const isOverloaded = openTasks.length > 3 || urgentHigh.length >= 2;

    return {
      employee: emp,
      openCount: openTasks.length,
      inProgressCount: inProgress.length,
      overdueCount: overdue.length,
      blockedCount: blocked.length,
      urgentHighCount: urgentHigh.length,
      totalEstHours,
      isOverloaded,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Workload & Capacity Management
        </h1>
        <p className="text-xs text-slate-500">
          Monitor staff task distribution, flag bandwidth overload, and prevent burnout across field teams
        </p>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Active Personnel</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {employees.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across 9 centers</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Staff with Overdue Tasks</div>
          <div className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
            {employeeWorkloads.filter((w) => w.overdueCount > 0).length}
          </div>
          <div className="text-[11px] text-rose-600 font-medium">Require deadline re-planning</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Potentially Overloaded Staff</div>
          <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
            {employeeWorkloads.filter((w) => w.isOverloaded).length}
          </div>
          <div className="text-[11px] text-amber-700 font-medium">&gt; 3 active tasks or multiple urgencies</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Total Estimated Work Hours</div>
          <div className="text-2xl font-bold text-slate-800 font-mono tabular-nums">
            {employeeWorkloads.reduce((acc, w) => acc + w.totalEstHours, 0)} hrs
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Open operational demand</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter staff by name or EID..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div className="w-full md:w-52">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
          >
            <option value="All">All Departments</option>
            {settings.departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            value={selectedLoc}
            onChange={(e) => setSelectedLoc(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
          >
            <option value="All">All Locations</option>
            {settings.locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Workload Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Open Tasks</th>
                <th className="py-3 px-4 text-center">In Progress</th>
                <th className="py-3 px-4 text-center">Overdue</th>
                <th className="py-3 px-4 text-center">Blocked</th>
                <th className="py-3 px-4 text-center">Est. Hours</th>
                <th className="py-3 px-4 text-right">Capacity Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeeWorkloads.map((w) => (
                <tr key={w.employee.eid} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{w.employee.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      EID: {w.employee.eid} · {w.employee.designation}
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{w.employee.location}</span>
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 tabular-nums">
                    {w.openCount}
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-blue-700 tabular-nums font-semibold">
                    {w.inProgressCount}
                  </td>

                  <td className="py-3 px-4 text-center font-mono tabular-nums">
                    <span className={w.overdueCount > 0 ? "text-rose-600 font-bold" : "text-slate-400"}>
                      {w.overdueCount}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center font-mono tabular-nums">
                    <span className={w.blockedCount > 0 ? "text-red-600 font-bold" : "text-slate-400"}>
                      {w.blockedCount}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-slate-700 tabular-nums">
                    {w.totalEstHours}h
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {w.isOverloaded ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 justify-end w-max ml-auto">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>High Workload</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Balanced
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
