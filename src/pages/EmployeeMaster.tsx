import React, { useState } from "react";
import { Employee, Role, EmploymentStatus, ProvisioningStatus } from "../types";
import { storage } from "../services/storage";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Search,
  Plus,
  Download,
  Upload,
  UserCheck,
  Shield,
  Phone,
  Mail,
  MapPin,
  Building,
  Edit,
  Eye,
  X,
  AlertCircle,
  KeyRound,
  UserX,
} from "lucide-react";

interface EmployeeMasterProps {
  onOpenImport: () => void;
}

export const EmployeeMaster: React.FC<EmployeeMasterProps> = ({ onOpenImport }) => {
  const { currentUser, canManageEmployees } = useAuth();
  const employees = storage.getEmployees();
  const settings = storage.getSettings();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedLoc, setSelectedLoc] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({});

  const filtered = employees.filter((e) => {
    if (selectedDept !== "All" && e.department !== selectedDept) return false;
    if (selectedLoc !== "All" && e.location !== selectedLoc) return false;
    if (selectedStatus !== "All" && e.employmentStatus !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = e.name.toLowerCase().includes(q);
      const matchEid = e.eid.includes(q);
      const matchDesig = e.designation.toLowerCase().includes(q);
      const matchMobile = e.mobile.includes(q);
      if (!matchName && !matchEid && !matchDesig && !matchMobile) return false;
    }
    return true;
  });

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditFormData(emp);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !editFormData.name) return;

    const updated: Employee = {
      ...selectedEmployee,
      ...editFormData,
      name: editFormData.name || selectedEmployee.name,
      designation: editFormData.designation || selectedEmployee.designation,
      department: editFormData.department || selectedEmployee.department,
      location: editFormData.location || selectedEmployee.location,
      mobile: editFormData.mobile || selectedEmployee.mobile,
      role: (editFormData.role as Role) || selectedEmployee.role,
      supervisorEid: editFormData.supervisorEid || selectedEmployee.supervisorEid,
      employmentStatus: (editFormData.employmentStatus as EmploymentStatus) || selectedEmployee.employmentStatus,
      provisioningStatus: (editFormData.provisioningStatus as ProvisioningStatus) || selectedEmployee.provisioningStatus,
      updatedAt: new Date().toISOString(),
    };

    storage.saveEmployee(updated, currentUser?.eid);
    setSelectedEmployee(updated);
    setIsEditing(false);
  };

  const handleExportCSV = () => {
    const headers = [
      "EID",
      "Employee Name",
      "Designation",
      "Department",
      "Location",
      "Mobile",
      "Official Mail",
      "Supervisor EID",
      "Role",
      "Employment Status",
      "Account Provisioning",
      "Verification Status",
    ];

    const rows = filtered.map((e) => [
      e.eid,
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.designation.replace(/"/g, '""')}"`,
      `"${e.department}"`,
      `"${e.location}"`,
      `"${e.mobile}"`,
      `"${e.officialEmail || ""}"`,
      `"${e.supervisorEid || ""}"`,
      e.role,
      e.employmentStatus,
      e.provisioningStatus,
      e.dataVerificationStatus,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LEEDO_Employee_Master_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employee Master Database</h1>
          <p className="text-xs text-slate-500">
            {employees.length} registered personnel across LEEDO shelters, schools, and field outreach hubs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {canManageEmployees && (
            <button
              onClick={onOpenImport}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Import Personnel (HR)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Employee ID, name, designation, or phone number..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
          />
        </div>

        <div className="w-full md:w-52">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
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
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
          >
            <option value="All">All Locations</option>
            {settings.locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-40">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Inactive">Inactive</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">EID</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((emp) => (
                <tr
                  key={emp.eid}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedEmployee(emp);
                    setIsEditing(false);
                  }}
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {emp.eid}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {emp.name}
                  </td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{emp.designation}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{emp.department}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{emp.location}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">{emp.mobile}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium">
                      {emp.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        emp.employmentStatus === "Active"
                          ? "bg-emerald-100 text-emerald-800"
                          : emp.employmentStatus === "Pending Verification"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {emp.employmentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setIsEditing(false);
                      }}
                      className="px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded-md font-medium"
                    >
                      Profile
                    </button>
                    {canManageEmployees && (
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="ml-1 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Profile / Edit Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  EID: {selectedEmployee.eid}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {isEditing ? "Edit Personnel Record" : selectedEmployee.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedEmployee(null);
                  setIsEditing(false);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editFormData.name || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={editFormData.designation || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, designation: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile</label>
                    <input
                      type="text"
                      value={editFormData.mobile || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department</label>
                    <select
                      value={editFormData.department || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, department: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {settings.departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Location</label>
                    <select
                      value={editFormData.location || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, location: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {settings.locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                    <select
                      value={editFormData.role || "employee"}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, role: e.target.value as Role })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white uppercase font-mono"
                    >
                      <option value="management">Management</option>
                      <option value="hr_admin">HR Admin</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="team_leader">Team Leader</option>
                      <option value="employee">Employee</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Supervisor EID</label>
                    <input
                      type="text"
                      value={editFormData.supervisorEid || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, supervisorEid: e.target.value })
                      }
                      placeholder="e.g. 1013, 1002"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Employment Status</label>
                    <select
                      value={editFormData.employmentStatus || "Active"}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          employmentStatus: e.target.value as EmploymentStatus,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending Verification">Pending Verification</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account Access</label>
                    <select
                      value={editFormData.provisioningStatus || "Active"}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          provisioningStatus: e.target.value as ProvisioningStatus,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Not Provisioned">Not Provisioned</option>
                      <option value="Deactivated">Deactivated</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Designation:</span>
                    <strong className="text-slate-900">{selectedEmployee.designation}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Department:</span>
                    <strong className="text-slate-900">{selectedEmployee.department}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Location:</span>
                    <strong className="text-slate-900">{selectedEmployee.location}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Contact Phone:</span>
                    <strong className="text-slate-900 font-mono">{selectedEmployee.mobile}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Role Permission:</span>
                    <strong className="text-slate-900 uppercase font-mono">{selectedEmployee.role}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Supervisor:</span>
                    <strong className="text-slate-900 font-mono">
                      {selectedEmployee.supervisorEid ? `EID ${selectedEmployee.supervisorEid}` : "Management"}
                    </strong>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Official Communications</h4>
                  <div className="space-y-1 text-slate-600">
                    <div>
                      Official Mail: <strong className="font-mono text-slate-800">{selectedEmployee.officialEmail || "None recorded"}</strong>
                    </div>
                    {selectedEmployee.alternateEmail && (
                      <div>
                        Alternate Mail: <span className="font-mono">{selectedEmployee.alternateEmail}</span>
                      </div>
                    )}
                    {selectedEmployee.organizationalEmail && (
                      <div>
                        Organizational O365: <span className="font-mono">{selectedEmployee.organizationalEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Security & Password Policy</p>
                    <p className="text-[11px] mt-0.5">
                      First-login password equals Employee ID ({selectedEmployee.eid}).
                      {selectedEmployee.mustChangePassword ? " Pending user password update." : " Password verified and secured."}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  {canManageEmployees && (
                    <button
                      onClick={() => handleOpenEdit(selectedEmployee)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Master Details</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
