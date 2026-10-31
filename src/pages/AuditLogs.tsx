import React, { useState } from "react";
import { storage } from "../services/storage";
import { AuditLogItem } from "../types";
import { ScrollText, Search, ShieldCheck, Download, Filter } from "lucide-react";

export const AuditLogs: React.FC = () => {
  const auditLogs = storage.getAuditLogs();
  const [searchQuery, setSearchQuery] = useState("");
  const [recordTypeFilter, setRecordTypeFilter] = useState("All");

  const filteredLogs = auditLogs.filter((log) => {
    if (recordTypeFilter !== "All" && log.targetRecordType !== recordTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchActor = log.actorName.toLowerCase().includes(q) || log.actorEid.includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchTarget = log.targetRecordId.toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchDetails && !matchTarget) return false;
    }
    return true;
  });

  const handleExportAudit = () => {
    const headers = ["Timestamp", "Actor Name", "Actor EID", "Action", "Target Type", "Target ID", "Details"];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      `"${l.actorName}"`,
      l.actorEid,
      l.action,
      l.targetRecordType,
      l.targetRecordId,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LEEDO_Audit_Trail_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Trail</h1>
          <p className="text-xs text-slate-500">
            Immutable organizational event log for task approvals, personnel modifications, and security actions
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log (CSV)</span>
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
            placeholder="Search audit trail by actor name, action, or record ID..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div className="w-full md:w-52">
          <select
            value={recordTypeFilter}
            onChange={(e) => setRecordTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
          >
            <option value="All">All Record Types</option>
            <option value="Task">Task Events</option>
            <option value="Ticket">Ticket Events</option>
            <option value="Employee">Employee Master Events</option>
            <option value="Auth">Authentication Events</option>
            <option value="Setting">Setting Changes</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Type</th>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Action Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 tabular-nums">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 font-sans">{log.actorName}</span>
                    <span className="text-[10px] text-slate-400 block">EID: {log.actorEid}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                      {log.targetRecordType}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800">
                    {log.targetRecordId}
                  </td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-700 max-w-md">
                    {log.details}
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
