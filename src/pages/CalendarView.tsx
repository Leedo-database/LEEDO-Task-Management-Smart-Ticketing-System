import React, { useState } from "react";
import { Task } from "../types";
import { storage } from "../services/storage";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from "lucide-react";

import { useAuth } from "../context/AuthContext";

interface CalendarViewProps {
  onOpenTaskDetails: (task: Task) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenTaskDetails }) => {
  const { currentUser, canViewAllTasks } = useAuth();
  const allTasks = storage.getTasks();
  const settings = storage.getSettings();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 26)); // Oct 2026 based on metadata
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedLoc, setSelectedLoc] = useState("All");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Month days computation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const filteredTasks = allTasks.filter((t) => {
    if (!canViewAllTasks && t.assignedToEid !== currentUser?.eid) return false;
    if (selectedDept !== "All" && t.department !== selectedDept) return false;
    if (selectedLoc !== "All" && t.location !== selectedLoc) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operational Calendar</h1>
          <p className="text-xs text-slate-500">
            Task milestones, field activity deadlines, and delivery schedules
          </p>
        </div>

        <div className="flex items-center gap-3">
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

          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-900 font-mono">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center font-mono text-[11px] font-bold text-slate-600 py-2.5">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[550px]">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-50/50 p-2 min-h-[90px]" />
          ))}

          {/* Actual days */}
          {Array.from({ length: totalDaysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const dayTasks = filteredTasks.filter((t) => t.dueDate === formattedDate);
            const isToday = dayNum === 26 && month === 9 && year === 2026;

            return (
              <div
                key={dayNum}
                className={`p-2 min-h-[95px] flex flex-col justify-between transition-colors ${
                  isToday ? "bg-red-50/40" : "hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isToday
                        ? "w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px]"
                        : "text-slate-700"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {dayTasks.length} due
                    </span>
                  )}
                </div>

                {/* Day tasks pill list */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onOpenTaskDetails(t)}
                      className={`px-1.5 py-1 rounded text-[10px] font-semibold truncate cursor-pointer transition-colors ${
                        t.priority === "Urgent"
                          ? "bg-red-100 text-red-900 hover:bg-red-200"
                          : t.priority === "High"
                          ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                          : "bg-blue-50 text-blue-900 hover:bg-blue-100"
                      }`}
                      title={`${t.id}: ${t.title} (${t.location})`}
                    >
                      <span className="font-mono mr-1">{t.id}:</span>
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
