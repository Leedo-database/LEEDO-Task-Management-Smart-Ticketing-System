import React, { useState } from "react";
import { storage } from "../services/storage";
import { Task } from "../types";
import {
  FileText,
  Sparkles,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  TrendingUp,
  Building,
  MapPin,
  AlertCircle,
} from "lucide-react";

export const PerformanceReports: React.FC = () => {
  const tasks = storage.getTasks();
  const settings = storage.getSettings();

  const [selectedDept, setSelectedDept] = useState("All");
  const [reportPeriod, setReportPeriod] = useState("Current Month (October 2026)");

  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiReport, setAiReport] = useState<{
    reportTitle?: string;
    executiveSummary?: string;
    keyHighlights?: string[];
    bottlenecks?: string;
    recommendations?: string[];
    aiPowered?: boolean;
  } | null>(null);

  const filteredTasks = tasks.filter((t) => {
    if (selectedDept !== "All" && t.department !== selectedDept) return false;
    return true;
  });

  const totalAssigned = filteredTasks.length;
  const totalApproved = filteredTasks.filter((t) => t.status === "Approved" || t.status === "Completed").length;
  const totalOverdue = filteredTasks.filter(
    (t) =>
      new Date(t.dueDate).getTime() < Date.now() &&
      t.status !== "Completed" &&
      t.status !== "Approved"
  ).length;

  const onTimeRate = totalAssigned > 0 ? Math.round((totalApproved / totalAssigned) * 100) : 100;

  // Generate Report with Gemini AI
  const handleGenerateAiReport = async () => {
    setAiReportLoading(true);
    try {
      const res = await fetch("/api/gemini/generate-progress-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "LEEDO Operational Task Performance",
          department: selectedDept,
          stats: {
            totalTasks: totalAssigned,
            approved: totalApproved,
            overdue: totalOverdue,
            onTimeRate: `${onTimeRate}%`,
          },
          taskCount: totalAssigned,
        }),
      });

      const data = await res.json();
      setAiReport(data);
    } catch (err) {
      console.error("AI report error:", err);
    } finally {
      setAiReportLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Performance Reports & Analytics</h1>
          <p className="text-xs text-slate-500">
            Decision-support reporting, milestone completion rates, and AI-synthesized executive briefings
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleGenerateAiReport}
            disabled={aiReportLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{aiReportLoading ? "Drafting Report with Gemini..." : "Generate AI Briefing"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Total Monitored Tasks</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalAssigned}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{selectedDept} scope</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Approved & Completed</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {totalApproved}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">Verified deliverables</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">On-Time Completion Rate</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {onTimeRate}%
          </div>
          <div className="text-[11px] text-slate-500">Based on verified milestones</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Overdue Items</div>
          <div className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
            {totalOverdue}
          </div>
          <div className="text-[11px] text-rose-600 font-medium">Flagged for revision</div>
        </div>
      </div>

      {/* AI Generated Executive Report (if triggered) */}
      {aiReport && (
        <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-red-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {aiReport.reportTitle || "LEEDO Operational Briefing"}
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
              Gemini 3.8 Flash Synthesized
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-1">Executive Summary</h4>
            <p className="text-xs text-slate-800 leading-relaxed bg-red-50/40 p-3.5 rounded-xl border border-red-100">
              {aiReport.executiveSummary}
            </p>
          </div>

          {aiReport.keyHighlights && aiReport.keyHighlights.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-1">Key Operational Highlights</h4>
              <ul className="space-y-1 text-xs text-slate-700 list-disc pl-5">
                {aiReport.keyHighlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          {aiReport.bottlenecks && (
            <div>
              <h4 className="text-xs font-bold text-amber-800 mb-1">Identified Operational Bottlenecks</h4>
              <p className="text-xs text-slate-700 bg-amber-50/60 p-3 rounded-lg border border-amber-200">
                {aiReport.bottlenecks}
              </p>
            </div>
          )}

          {aiReport.recommendations && aiReport.recommendations.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-1">Management Recommendations</h4>
              <ul className="space-y-1 text-xs text-slate-700 list-decimal pl-5">
                {aiReport.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Location-Specific Performance Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Field Location Delivery Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {[
            "Head Office",
            "Peace Home",
            "Inclusive School",
            "Kamalapur",
            "Kodomtoli",
            "Mirpur",
          ].map((loc) => {
            const locTasks = tasks.filter((t) => t.location === loc);
            const comp = locTasks.filter((t) => t.status === "Approved" || t.status === "Completed").length;
            const rate = locTasks.length > 0 ? Math.round((comp / locTasks.length) * 100) : 100;

            return (
              <div key={loc} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span>{loc}</span>
                  </span>
                  <span className="font-mono text-slate-600">{locTasks.length} tasks</span>
                </div>

                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Completion Rate</span>
                  <span className="font-mono font-bold text-slate-800">{rate}%</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
