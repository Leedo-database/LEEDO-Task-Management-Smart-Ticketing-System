export type Role =
  | "admin"
  | "management"
  | "hr_admin"
  | "supervisor"
  | "team_leader"
  | "employee"
  | "auditor";

export type EmploymentStatus =
  | "Active"
  | "Pending Verification"
  | "Inactive"
  | "Archived";

export type ProvisioningStatus =
  | "Not Provisioned"
  | "Provisioning Pending"
  | "Active"
  | "Setup Failed"
  | "Deactivated";

export type TaskStatus =
  | "Draft"
  | "Submitted"
  | "Open"
  | "Assigned"
  | "Accepted"
  | "In Progress"
  | "On Hold"
  | "Blocked"
  | "Submitted for Review"
  | "Revision Required"
  | "Approved"
  | "Completed"
  | "Closed"
  | "Cancelled"
  | "Archived";

export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface Employee {
  eid: string; // e.g. "1001"
  name: string;
  designation: string;
  department: string;
  mobile: string;
  location: string;
  officialEmail?: string;
  alternateEmail?: string;
  organizationalEmail?: string;
  supervisorEid?: string;
  role: Role;
  employmentStatus: EmploymentStatus;
  joiningDate?: string;
  provisioningStatus: ProvisioningStatus;
  mustChangePassword: boolean;
  dataVerificationStatus: "Verified" | "Needs Review";
  passwordHash?: string; // stored hashed or simulated secure credential
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignedToEid?: string;
  dueDate?: string;
  mandatory?: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  uploadedByEid: string;
  uploadedAt: string;
}

export interface TaskComment {
  id: string;
  authorEid: string;
  authorName: string;
  content: string;
  createdAt: string;
  isReviewNote?: boolean;
}

export interface TaskReviewRecord {
  id: string;
  reviewerEid: string;
  reviewerName: string;
  decision: "Approved" | "Revision Required" | "Rejected";
  comments: string;
  timestamp: string;
}

export interface Task {
  id: string; // e.g. "TSK-1042"
  title: string;
  description: string;
  category: string;
  department: string;
  location: string;
  priority: TaskPriority;
  status: TaskStatus;
  creatorEid: string;
  assignedToEid: string;
  supervisorEid?: string;
  approverEid?: string;
  startDate: string;
  dueDate: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  parentTaskId?: string;
  subtasks: Subtask[];
  dependencies: string[]; // Task IDs that must finish first
  attachments: TaskAttachment[];
  comments: TaskComment[];
  progressPercentage: number;
  blockerDescription?: string;
  revisionCount: number;
  reviewHistory: TaskReviewRecord[];
  completionEvidence?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export type TicketStatus =
  | "New"
  | "Triaged"
  | "Assigned"
  | "In Progress"
  | "Waiting for Requester"
  | "Resolved"
  | "Closed";

export interface Ticket {
  id: string; // e.g. "TCK-801"
  requesterEid: string;
  department: string;
  location: string;
  category: string;
  subject: string;
  description: string;
  priority: TaskPriority;
  confidentialityLevel: "Standard" | "Confidential" | "Restricted HR";
  status: TicketStatus;
  assignedSupportTeam: string;
  assignedToEid?: string;
  targetResponseHours: number;
  resolutionDeadline: string;
  createdAt: string;
  updatedAt: string;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  resolutionSummary?: string;
  reopenReason?: string;
  convertedToTaskId?: string;
}

export interface NotificationItem {
  id: string;
  recipientEid: string;
  title: string;
  message: string;
  type: "task_assigned" | "task_approval" | "deadline_warning" | "ticket_update" | "mention" | "system";
  linkPath?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorEid: string;
  actorName: string;
  action: string;
  targetRecordType: "Task" | "Ticket" | "Employee" | "Setting" | "Auth";
  targetRecordId: string;
  details: string;
  timestamp: string;
}

export interface MeetingActionPoint {
  id: string;
  meetingTitle: string;
  date: string;
  actionItem: string;
  description?: string;
  responsibleEid?: string;
  department: string;
  deadline: string;
  priority: TaskPriority;
  status: "Pending" | "Converted to Task" | "Completed";
  convertedTaskId?: string;
}

export interface SystemSettings {
  organizationName: string;
  shortName: string;
  departments: string[];
  locations: string[];
  taskCategories: string[];
  ticketCategories: string[];
  reminderHoursBefore: number[];
  slaHours: Record<TaskPriority, number>;
  allowSelfApproval: boolean;
  requireEvidenceForApproval: boolean;
  escalationSupervisorHours: number;
  escalationDirectorHours: number;
}

export interface GroupTaskMember {
  eid: string;
  name: string;
  designation: string;
  roleInGroup: "Lead" | "Contributor" | "Reviewer";
  joinedAt: string;
}

export interface GroupTaskUpdate {
  id: string;
  authorEid: string;
  authorName: string;
  authorDesignation: string;
  type: "progress_report" | "status_change" | "milestone_complete" | "blocker" | "general_comment";
  content: string;
  progressPercentage?: number;
  timestamp: string;
  attachments?: { name: string; url: string }[];
}

export interface GroupTaskMilestone {
  id: string;
  title: string;
  completed: boolean;
  completedByEid?: string;
  completedByName?: string;
  completedAt?: string;
  dueDate?: string;
}

export interface GroupTask {
  id: string; // e.g. "GRP-101"
  title: string;
  description: string;
  category: string;
  department: string;
  location: string;
  priority: TaskPriority;
  status: "Planning" | "In Progress" | "Under Review" | "Completed" | "On Hold";
  leaderEid: string;
  leaderName: string;
  memberEids: string[];
  members: GroupTaskMember[];
  milestones: GroupTaskMilestone[];
  updates: GroupTaskUpdate[];
  progressPercentage: number;
  startDate: string;
  dueDate: string;
  createdByEid: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}
