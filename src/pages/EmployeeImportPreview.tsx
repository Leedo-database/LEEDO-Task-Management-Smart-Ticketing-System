import React, { useState } from "react";
import { Employee, Role } from "../types";
import { storage } from "../services/storage";
import { useAuth } from "../context/AuthContext";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  FileSpreadsheet,
  Trash2,
  ShieldAlert,
} from "lucide-react";

interface EmployeeImportPreviewProps {
  onBack: () => void;
}

interface ParsedRow {
  rowId: number;
  eid: string;
  name: string;
  designation: string;
  department: string;
  location: string;
  mobile: string;
  email: string;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  isValid: boolean;
  selected: boolean;
}

export const EmployeeImportPreview: React.FC<EmployeeImportPreviewProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const existingEmployees = storage.getEmployees();
  const existingEids = new Set(existingEmployees.map((e) => e.eid));

  const [rawText, setRawText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<"input" | "preview" | "summary">("input");
  const [importSummary, setImportSummary] = useState<{
    total: number;
    success: number;
    duplicates: number;
    errors: number;
  } | null>(null);

  // Sample import data template matching user's spreadsheet format
  const loadSampleTemplate = () => {
    setRawText(`1050\tTanvir Ahmed\tJunior Accountant\tAdmin & Finance\t01711-223344\tHead Office\ttanvir.leedo@gmail.com
1051\tShirin Sultana\tStreet Educator\tProgram & Operation\t01822-334455\tKamalapur\tshirin.leedo@gmail.com
1053\tRafiqul Islam\tVocational Instructor\tProgram & Operation\t01933-445566\tInclusive School\trafiqul@leedobd.org
1001\tForhad Hossain Duplicate Test\tFounder\tAdmin & Finance\t01819-291567\tHead Office\tforhad@leedo.org`);
  };

  const handleParse = () => {
    if (!rawText.trim()) {
      alert("Please enter or paste tabular employee rows first.");
      return;
    }

    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const rows: ParsedRow[] = [];

    lines.forEach((line, idx) => {
      // Split on tabs or commas
      const parts = line.includes("\t")
        ? line.split("\t").map((p) => p.trim())
        : line.split(",").map((p) => p.trim());

      const eid = parts[0] || "";
      const name = parts[1] || "";
      const designation = parts[2] || "Officer";
      const department = parts[3] || "Program & Operation";
      const mobile = parts[4] || "01700-000000";
      const location = parts[5] || "Head Office";
      const email = parts[6] || "";

      const errors: string[] = [];
      const warnings: string[] = [];
      const isDuplicate = existingEids.has(eid);

      if (!eid) errors.push("Missing Employee ID (EID)");
      if (!name) errors.push("Missing Employee Name");
      if (isDuplicate) warnings.push(`EID ${eid} already exists in database`);
      if (email && !email.includes("@")) warnings.push("Email format seems ambiguous");
      if (!mobile.startsWith("01")) warnings.push("Phone number may lack standard 01 prefix");

      rows.push({
        rowId: idx + 1,
        eid,
        name,
        designation,
        department,
        location,
        mobile,
        email,
        errors,
        warnings,
        isDuplicate,
        isValid: errors.length === 0 && !isDuplicate,
        selected: errors.length === 0 && !isDuplicate,
      });
    });

    setParsedRows(rows);
    setStep("preview");
  };

  const handleToggleSelect = (rowId: number) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleExecuteImport = () => {
    const toImport = parsedRows.filter((r) => r.selected && r.isValid);
    if (toImport.length === 0) {
      alert("No valid rows selected for import.");
      return;
    }

    const employeesToAdd: Employee[] = toImport.map((r) => ({
      eid: r.eid,
      name: r.name,
      designation: r.designation,
      department: r.department,
      location: r.location,
      mobile: r.mobile,
      officialEmail: r.email,
      role: "employee",
      employmentStatus: "Active",
      provisioningStatus: "Active",
      mustChangePassword: true, // initial password equals EID!
      dataVerificationStatus: "Verified",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const result = storage.bulkImportEmployees(employeesToAdd, currentUser?.eid || "1057");

    setImportSummary({
      total: parsedRows.length,
      success: result.successCount,
      duplicates: result.duplicateCount,
      errors: parsedRows.filter((r) => r.errors.length > 0).length,
    });
    setStep("summary");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Personnel CSV / Spreadsheet Import
          </h1>
          <p className="text-xs text-slate-500">
            Multi-stage validation: preview rows, check duplicate EIDs, flag ambiguous records, and verify before commit
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to Directory
        </button>
      </div>

      {/* Stage 1: Input */}
      {step === "input" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Paste Spreadsheet Data (Tab or Comma Separated)
            </h2>
            <button
              onClick={loadSampleTemplate}
              className="text-xs text-red-600 hover:text-red-700 font-semibold"
            >
              Load Sample Data
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Expected column order:{" "}
            <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">
              EID &lt;tab&gt; Name &lt;tab&gt; Designation &lt;tab&gt; Department &lt;tab&gt; Mobile &lt;tab&gt; Location &lt;tab&gt; Email
            </code>
          </p>

          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw Excel or Google Sheets rows here..."
            className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <div className="flex justify-end">
            <button
              onClick={handleParse}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs"
            >
              <span>Validate & Preview Rows</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stage 2: Preview & Deduplication */}
      {step === "preview" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Pre-Import Verification ({parsedRows.length} rows detected)
              </h2>
              <p className="text-xs text-slate-500">
                {parsedRows.filter((r) => r.isValid).length} ready for import ·{" "}
                {parsedRows.filter((r) => r.isDuplicate).length} duplicates flagged ·{" "}
                {parsedRows.filter((r) => r.errors.length > 0).length} format errors
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep("input")}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700"
              >
                Re-paste
              </button>
              <button
                onClick={handleExecuteImport}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Confirm & Write to Database
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] text-slate-700 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Import</th>
                  <th className="py-2.5 px-3">EID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Status / Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((r) => (
                  <tr
                    key={r.rowId}
                    className={
                      r.isDuplicate
                        ? "bg-amber-50/40"
                        : r.errors.length > 0
                        ? "bg-red-50/40"
                        : "hover:bg-slate-50"
                    }
                  >
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={r.selected}
                        disabled={!r.isValid}
                        onChange={() => handleToggleSelect(r.rowId)}
                        className="rounded text-red-600"
                      />
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{r.eid}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{r.name}</td>
                    <td className="py-2 px-3">{r.designation}</td>
                    <td className="py-2 px-3">{r.department}</td>
                    <td className="py-2 px-3">{r.location}</td>
                    <td className="py-2 px-3">
                      {r.isDuplicate && (
                        <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Duplicate EID</span>
                        </span>
                      )}
                      {r.errors.length > 0 && (
                        <span className="text-[10px] text-red-600 font-semibold">
                          {r.errors.join(", ")}
                        </span>
                      )}
                      {r.isValid && (
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Valid for Import</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stage 3: Summary */}
      {step === "summary" && importSummary && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-bold text-slate-900">Personnel Database Import Complete</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The master employee repository has been updated with full audit trail logging.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-center pt-2">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-lg font-bold text-emerald-700 font-mono">
                {importSummary.success}
              </div>
              <div className="text-[11px] text-emerald-800 font-medium">Added</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="text-lg font-bold text-amber-700 font-mono">
                {importSummary.duplicates}
              </div>
              <div className="text-[11px] text-amber-800 font-medium">Skipped Duplicates</div>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <div className="text-lg font-bold text-red-700 font-mono">
                {importSummary.errors}
              </div>
              <div className="text-[11px] text-red-800 font-medium">Invalid Format</div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              Return to Employee Master
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
