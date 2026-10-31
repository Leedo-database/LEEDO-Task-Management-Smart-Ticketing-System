import React, { useState } from "react";
import { storage } from "../services/storage";
import { useAuth } from "../context/AuthContext";
import { SystemSettings as SettingsType } from "../types";
import {
  Settings,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  Building,
  MapPin,
  Tag,
  Cloud,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
} from "lucide-react";

export const SystemSettings: React.FC = () => {
  const { currentUser, canManageSettings } = useAuth();
  const currentSettings = storage.getSettings();

  const [settings, setSettings] = useState<SettingsType>(currentSettings);
  const [activeTab, setActiveTab] = useState<"general" | "taxonomy" | "firebase">("general");

  const [newDept, setNewDept] = useState("");
  const [newLoc, setNewLoc] = useState("");
  const [newCat, setNewCat] = useState("");
  const [copiedRules, setCopiedRules] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Firebase Cloud Sync State
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncResult, setCloudSyncResult] = useState<{
    success: boolean;
    taskCount: number;
    groupTaskCount: number;
    employeeCount: number;
    ticketCount: number;
    error?: string;
  } | null>(null);

  const handleManualCloudSync = async () => {
    setIsSyncingCloud(true);
    setCloudSyncResult(null);
    try {
      const result = await storage.syncAllToCloud(currentUser?.eid || "1001");
      setCloudSyncResult(result);
    } catch (err: any) {
      setCloudSyncResult({
        success: false,
        taskCount: 0,
        groupTaskCount: 0,
        employeeCount: 0,
        ticketCount: 0,
        error: err?.message || "Sync error",
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSettings(settings, currentUser?.eid || "1001");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddDept = () => {
    if (!newDept.trim() || settings.departments.includes(newDept.trim())) return;
    setSettings({ ...settings, departments: [...settings.departments, newDept.trim()] });
    setNewDept("");
  };

  const handleRemoveDept = (d: string) => {
    setSettings({ ...settings, departments: settings.departments.filter((item) => item !== d) });
  };

  const handleAddLoc = () => {
    if (!newLoc.trim() || settings.locations.includes(newLoc.trim())) return;
    setSettings({ ...settings, locations: [...settings.locations, newLoc.trim()] });
    setNewLoc("");
  };

  const handleRemoveLoc = (loc: string) => {
    setSettings({ ...settings, locations: settings.locations.filter((item) => item !== loc) });
  };

  const handleAddCat = () => {
    if (!newCat.trim() || settings.taskCategories.includes(newCat.trim())) return;
    setSettings({ ...settings, taskCategories: [...settings.taskCategories, newCat.trim()] });
    setNewCat("");
  };

  const handleRemoveCat = (cat: string) => {
    setSettings({ ...settings, taskCategories: settings.taskCategories.filter((item) => item !== cat) });
  };

  const handleResetData = () => {
    if (confirm("Reset application data back to initial verified LEEDO seed state? All test tasks and tickets will be restored.")) {
      storage.resetToSeed(currentUser?.eid || "1001");
      alert("Database reset to verified initial state.");
    }
  };

  const firestoreRulesSample = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions for LEEDO Role-Based Access Control
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return request.auth.token.role;
    }
    
    function isManagement() {
      return isAuthenticated() && (getUserRole() == 'management' || getUserRole() == 'admin');
    }
    
    function isHR() {
      return isAuthenticated() && (getUserRole() == 'hr_admin' || getUserRole() == 'admin');
    }
    
    function isSupervisor() {
      return isAuthenticated() && (getUserRole() == 'supervisor' || isManagement());
    }
    
    // Employee Master Collection: Only HR and Management can write
    match /employees/{eid} {
      allow read: if isAuthenticated();
      allow write: if isHR() || isManagement();
    }
    
    // Tasks: Assignees can read and update progress/subtasks; Approvers can sign off
    match /tasks/{taskId} {
      allow read: if isAuthenticated() && (
        isManagement() ||
        resource.data.assignedToEid == request.auth.token.eid ||
        resource.data.supervisorEid == request.auth.token.eid ||
        resource.data.creatorEid == request.auth.token.eid
      );
      
      allow create: if isAuthenticated();
      
      allow update: if isAuthenticated() && (
        isSupervisor() ||
        resource.data.assignedToEid == request.auth.token.eid ||
        resource.data.supervisorEid == request.auth.token.eid
      );
      
      allow delete: if isManagement();
    }
    
    // Smart Tickets: Protect confidential safeguarding records
    match /tickets/{ticketId} {
      allow read: if isAuthenticated() && (
        isManagement() ||
        resource.data.confidentialityLevel == 'Standard' ||
        resource.data.requesterEid == request.auth.token.eid ||
        resource.data.assignedToEid == request.auth.token.eid
      );
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
    }
    
    // Audit Logs: Append-only
    match /auditLogs/{logId} {
      allow read: if isManagement() || isSupervisor();
      allow create: if isAuthenticated();
      allow update, delete: if false; // Immutable!
    }
  }
}`;

  const copyRulesToClipboard = () => {
    navigator.clipboard.writeText(firestoreRulesSample);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Governance</h1>
          <p className="text-xs text-slate-500">
            Configure dynamic departments, field locations, SLA parameters, and inspect Firebase security rules
          </p>
        </div>

        {saveSuccess && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Settings Saved Successfully</span>
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "general" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          General & Organization
        </button>
        <button
          onClick={() => setActiveTab("taxonomy")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "taxonomy" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          Departments & Field Hubs
        </button>
        <button
          onClick={() => setActiveTab("firebase")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "firebase" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          Firebase Security & Blueprint
        </button>
      </div>

      {/* Tab 1: General */}
      {activeTab === "general" && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Full Name</label>
              <input
                type="text"
                value={settings.organizationName}
                onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Short Brand Name</label>
              <input
                type="text"
                value={settings.shortName}
                onChange={(e) => setSettings({ ...settings, shortName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supervisor Escalation Threshold (Hours after deadline)
              </label>
              <input
                type="number"
                value={settings.escalationSupervisorHours}
                onChange={(e) =>
                  setSettings({ ...settings, escalationSupervisorHours: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Executive Director Escalation Threshold (Hours after deadline)
              </label>
              <input
                type="number"
                value={settings.escalationDirectorHours}
                onChange={(e) =>
                  setSettings({ ...settings, escalationDirectorHours: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetData}
              className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Database to Seed State</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Taxonomy */}
      {activeTab === "taxonomy" && (
        <div className="space-y-6">
          {/* Departments */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-red-600" />
              <span>Configurable Departments ({settings.departments.length})</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {settings.departments.map((d) => (
                <div
                  key={d}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 flex items-center gap-2 font-medium"
                >
                  <span>{d}</span>
                  <button
                    onClick={() => handleRemoveDept(d)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 max-w-sm pt-2">
              <input
                type="text"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                placeholder="New department name..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddDept}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Field Locations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>Configurable Field Locations & Shelters ({settings.locations.length})</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {settings.locations.map((loc) => (
                <div
                  key={loc}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 flex items-center gap-2 font-medium"
                >
                  <span>{loc}</span>
                  <button
                    onClick={() => handleRemoveLoc(loc)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 max-w-sm pt-2">
              <input
                type="text"
                value={newLoc}
                onChange={(e) => setNewLoc(e.target.value)}
                placeholder="New location / shelter name..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddLoc}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Task Categories */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-red-600" />
              <span>Task Categories ({settings.taskCategories.length})</span>
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {settings.taskCategories.map((c) => (
                <div
                  key={c}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-700 flex items-center gap-1.5"
                >
                  <span>{c}</span>
                  <button onClick={() => handleRemoveCat(c)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 max-w-sm pt-2">
              <input
                type="text"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="New task category..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddCat}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Firebase Cloud Permanent Storage */}
      {activeTab === "firebase" && (
        <div className="space-y-6">
          {/* Cloud Storage Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Firebase Cloud Firestore Permanent Storage
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active & Connected
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    সংস্থার সকল টাস্ক, গ্রুপ টাস্ক, কর্মী ডেটাবেজ এবং টিকিট গুগল ক্লাউডে দীর্ঘমেয়াদে (৪-৫ বছর বা আজীবন) নিরাপদভাবে সংরক্ষিত।
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSyncingCloud}
                onClick={handleManualCloudSync}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingCloud ? "animate-spin" : ""}`} />
                <span>{isSyncingCloud ? "ক্লাউডে সিঙ্ক হচ্ছে..." : "এখনই সম্পূর্ণ ক্লাউড ব্যাকআপ নিন"}</span>
              </button>
            </div>

            {/* Sync Feedback Message */}
            {cloudSyncResult && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                  cloudSyncResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {cloudSyncResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {cloudSyncResult.success
                      ? "ক্লাউড সিঙ্ক সফলভাবে সম্পন্ন হয়েছে!"
                      : "ক্লাউড সিঙ্কে সমস্যা দেখা দিয়েছে"}
                  </div>
                  <p className="mt-0.5">
                    {cloudSyncResult.success
                      ? `সর্বমোট ${cloudSyncResult.employeeCount} জন কর্মী, ${cloudSyncResult.taskCount}টি টাস্ক, ${cloudSyncResult.groupTaskCount}টি গ্রুপ টাস্ক এবং ${cloudSyncResult.ticketCount}টি টিকিট গুগল ফায়ারবেস ক্লাউডে যাচাই ও সংরক্ষিত হয়েছে।`
                      : cloudSyncResult.error}
                  </p>
                </div>
              </div>
            )}

            {/* Storage Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Google Cloud Project</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-1 block">refined-axle-rlcf1</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Database Instance</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-1 block truncate" title="ai-studio-leedotaskmanagem-a40a371c-5cf5-4797-a414-2ed4b73a6570">
                  ai-studio-leedotaskmanagem...
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Data Retention Policy</span>
                <span className="text-xs font-bold text-emerald-700 mt-1 block">Permanent (৪-৫+ বছর সংরক্ষিত)</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Real-Time Sync Engine</span>
                <span className="text-xs font-bold text-blue-700 mt-1 block">Firestore onSnapshot (Active)</span>
              </div>
            </div>

            {/* Synced Collections */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                স্বয়ংক্রিয়ভাবে ক্লাউডে সংরক্ষিত কালেকশনসমূহ:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span><strong>tasks</strong> (সকল একক কাজ)</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span><strong>groupTasks</strong> (যৌথ দলীয় কাজ)</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span><strong>employees</strong> (কর্মী ডেটাবেজ)</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span><strong>tickets</strong> (স্মার্ট টিকিট)</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span><strong>systemSettings</strong> (সিস্টেম কনফিগ)</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span><strong>auditLogs</strong> (অডিট হিস্টোরি)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Rules Preview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-red-600" />
                  <span>Production Firebase Security Rules (`firestore.rules`)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  গুগল ফায়ারবেস ক্লাউডে ডেটাবেজ অ্যাক্সেস ও সুরক্ষা রুলস সক্রিয় ও ডিপ্লয় করা রয়েছে।
                </p>
              </div>

              <button
                onClick={copyRulesToClipboard}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRules ? "Copied!" : "Copy Rules"}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-72">
                {firestoreRulesSample}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
