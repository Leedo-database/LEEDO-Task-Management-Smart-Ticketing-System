import {
  Employee,
  Task,
  Ticket,
  AuditLogItem,
  NotificationItem,
  MeetingActionPoint,
  SystemSettings,
  Role,
  GroupTask,
  GroupTaskUpdate,
  GroupTaskMilestone,
} from "../types";
import { db } from "./firebase";
import { doc, setDoc, deleteDoc, collection, onSnapshot, getDocs, getDoc } from "firebase/firestore";

async function syncToFirestore(collectionName: string, id: string, data: any) {
  try {
    if (db && id) {
      await setDoc(doc(db, collectionName, String(id)), data, { merge: true });
    }
  } catch (err) {
    // Graceful offline handling
    console.debug(`Firestore sync for ${collectionName}/${id}:`, err);
  }
}

async function deleteFromFirestore(collectionName: string, id: string) {
  try {
    if (db && id) {
      await deleteDoc(doc(db, collectionName, String(id)));
    }
  } catch (err) {
    console.debug(`Firestore delete for ${collectionName}/${id}:`, err);
  }
}

const STORAGE_KEYS = {
  EMPLOYEES: "leedo_employees_v1",
  TASKS: "leedo_tasks_v1",
  GROUP_TASKS: "leedo_group_tasks_v1",
  TICKETS: "leedo_tickets_v1",
  NOTIFICATIONS: "leedo_notifications_v1",
  AUDIT_LOGS: "leedo_audit_logs_v1",
  MEETINGS: "leedo_meetings_v1",
  SETTINGS: "leedo_settings_v1",
  CURRENT_USER_EID: "leedo_session_eid_v1",
};

// Default LEEDO organizational settings
export const DEFAULT_SETTINGS: SystemSettings = {
  organizationName: "Local Education and Economic Development Organization",
  shortName: "LEEDO",
  departments: [
    "Admin & Finance",
    "Program & Operation",
    "Partnership",
    "Communication & Media",
    "Monitoring & Evaluation",
  ],
  locations: [
    "Head Office",
    "Peace Home",
    "Inclusive School",
    "Kamalapur",
    "Kodomtoli",
    "Mirpur",
    "Tejgoan",
    "RayerBazar",
    "Airport",
  ],
  taskCategories: [
    "HR & Administration",
    "Finance & Accounts",
    "Procurement & Logistics",
    "Program Operations",
    "Street Connected Children",
    "Shelter Management",
    "Inclusive Education",
    "Partnership & Fundraising",
    "Communication & Media",
    "ICT & Digital Systems",
    "Monitoring & Evaluation",
    "Compliance & Audit",
    "Meeting & Reporting",
    "Field Visit",
    "Maintenance",
    "General Request",
  ],
  ticketCategories: [
    "IT Support",
    "HR Request",
    "Leave or Attendance Issue",
    "Finance Request",
    "Procurement Request",
    "Logistics Support",
    "Facility Maintenance",
    "Transport Request",
    "Document or Approval Request",
    "Programme Support",
    "Data Correction",
    "Other Internal Request",
  ],
  reminderHoursBefore: [48, 24, 4],
  slaHours: {
    Urgent: 12,
    High: 24,
    Medium: 48,
    Low: 96,
  },
  allowSelfApproval: false,
  requireEvidenceForApproval: true,
  escalationSupervisorHours: 24,
  escalationDirectorHours: 48,
};

// 54 Verified Employees from LEEDO Master Database
export const SEED_EMPLOYEES: Employee[] = [
  {
    eid: "1001",
    name: "Forhad Hossain",
    designation: "Founder & ED",
    department: "Executive Management",
    mobile: "01819-291567",
    location: "Head Office",
    officialEmail: "forhad.hossain@leedobd.org",
    alternateEmail: "helpstreetchildren4survive@gmail.com",
    organizationalEmail: "Admin@leedobd.onmicrosoft.com",
    role: "management",
    employmentStatus: "Active",
    joiningDate: "2010-01-01",
    provisioningStatus: "Active",
    mustChangePassword: false,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1002",
    name: "Murshida Akhter Kanta",
    designation: "Director - Admin & Finance",
    department: "Admin & Finance",
    mobile: "01861-676979",
    location: "Head Office",
    officialEmail: "Kanta@leedobd.org",
    alternateEmail: "kanta.leedo@gmail.com",
    role: "management",
    employmentStatus: "Active",
    joiningDate: "2012-04-15",
    provisioningStatus: "Active",
    mustChangePassword: false,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1004",
    name: "Md. Habibur Rahman",
    designation: "Accountant",
    department: "Admin & Finance",
    mobile: "01733-336365",
    location: "Head Office",
    officialEmail: "accounts@leedobd.org",
    alternateEmail: "habibrleedo@gmail.com",
    supervisorEid: "1002",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1007",
    name: "Athui Marma",
    designation: "Monitoring Officer",
    department: "Program & Operation",
    mobile: "01533-650126",
    location: "Head Office",
    officialEmail: "athoileedo26@gmail.com",
    supervisorEid: "1013",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1008",
    name: "Tawhid Ahmeed",
    designation: "Young Volunteer",
    department: "Program & Operation",
    mobile: "01893-636383",
    location: "Head Office",
    officialEmail: "Monitoring@leedobd.org",
    alternateEmail: "youngleader.leedobd2000@gmail.com",
    supervisorEid: "1013",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1009",
    name: "Rone Ahammed",
    designation: "Logistics Officer",
    department: "Admin & Finance",
    mobile: "01818-202173",
    location: "Head Office",
    officialEmail: "youth.leader@leedobd.org",
    alternateEmail: "logistic.leedo@gmail.com",
    organizationalEmail: "info@leedobd.org",
    supervisorEid: "1002",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1010",
    name: "Ibrahim",
    designation: "Driver",
    department: "Admin & Finance",
    mobile: "01764-614539",
    location: "Head Office",
    officialEmail: "logistics@leedobd.org",
    supervisorEid: "1009",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1013",
    name: "Md. Sohel Rana",
    designation: "Manager",
    department: "Program & Operation",
    mobile: "01728-790037",
    location: "Head Office",
    officialEmail: "sohelrana.leedo@gmail.com",
    supervisorEid: "1001",
    role: "supervisor",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: false,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1014",
    name: "Tania Akter",
    designation: "Assistant Home Super",
    department: "Program & Operation",
    mobile: "01952-509518",
    location: "Peace Home",
    officialEmail: "sohel.rana@leedobd.org",
    alternateEmail: "tania.leedo18@gmail.com",
    supervisorEid: "1013",
    role: "team_leader",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1015",
    name: "Parvin Akter",
    designation: "Mother",
    department: "Program & Operation",
    mobile: "01919-490307",
    location: "Peace Home",
    officialEmail: "peacehome@leedobd.org",
    alternateEmail: "parveen.leedo07@gmail.com",
    supervisorEid: "1014",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1016",
    name: "Vulu Rani Mollik",
    designation: "Cook",
    department: "Program & Operation",
    mobile: "01752-841427",
    location: "Peace Home",
    supervisorEid: "1014",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1017",
    name: "Nargis Akhter",
    designation: "Psycho-social Facilitator",
    department: "Program & Operation",
    mobile: "01712-884445",
    location: "Peace Home",
    officialEmail: "asknargis@gmail.com",
    supervisorEid: "1014",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1018",
    name: "Md. Tajudddin",
    designation: "Music Teacher",
    department: "Program & Operation",
    mobile: "019157-11125",
    location: "Peace Home",
    supervisorEid: "1014",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1019",
    name: "Happy Akter",
    designation: "Music Teacher",
    department: "Program & Operation",
    mobile: "013122-45976",
    location: "Peace Home",
    supervisorEid: "1014",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1022",
    name: "Sahela Khan Rimu",
    designation: "Mother",
    department: "Program & Operation",
    mobile: "01813-253769",
    location: "Kamalapur",
    officialEmail: "rimu.leedo69@gmail.com",
    supervisorEid: "1023",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1023",
    name: "Md. Masud",
    designation: "Social Mobilizer (Incharge)",
    department: "Program & Operation",
    mobile: "01304-035081",
    location: "Kamalapur",
    officialEmail: "kamalapur@leedobd.org",
    alternateEmail: "masud.leedo81@gmail.com",
    supervisorEid: "1013",
    role: "team_leader",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: false,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1028",
    name: "Saidur Rahman Sajan",
    designation: "Social Mobilizer",
    department: "Program & Operation",
    mobile: "01632-147709",
    location: "Kodomtoli",
    officialEmail: "kamalapur@leedobd.org",
    alternateEmail: "said.leedo14@gmail.com",
    supervisorEid: "1023",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1030",
    name: "Shahnaz Parvin",
    designation: "Cook",
    department: "Program & Operation",
    mobile: "01934-229459",
    location: "Kodomtoli",
    officialEmail: "Kadamtali@leedobd.org",
    supervisorEid: "1023",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1032",
    name: "Nazirul Islam Opu",
    designation: "Senior Social Mobilizer (Incharge)",
    department: "Program & Operation",
    mobile: "01615-190173",
    location: "Mirpur",
    officialEmail: "Kadamtali@leedobd.org",
    alternateEmail: "nazirulopu.leedo2019@gmail.com",
    supervisorEid: "1013",
    role: "team_leader",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1034",
    name: "Leo Gomes",
    designation: "Street Educator",
    department: "Program & Operation",
    mobile: "01618-235848",
    location: "Tejgoan",
    officialEmail: "leo.leedo48@gmail.com",
    supervisorEid: "1013",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1035",
    name: "Shuchitra Rani Barman",
    designation: "Street Educator",
    department: "Program & Operation",
    mobile: "01939-849787",
    location: "RayerBazar",
    officialEmail: "airport@leedobd.org",
    supervisorEid: "1013",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1036",
    name: "Md. Nizam Hossain",
    designation: "Street Educator",
    department: "Program & Operation",
    mobile: "01782-327102",
    location: "RayerBazar",
    officialEmail: "mirpur@leedobd.org",
    alternateEmail: "nizamhossain7102@gmail.com",
    supervisorEid: "1013",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1037",
    name: "Jesmin Akter",
    designation: "Office Assistant",
    department: "Program & Operation",
    mobile: "01950-880717",
    location: "Peace Home",
    officialEmail: "tejgaon@leedobd.org",
    alternateEmail: "jesminrisberg@gmail.com",
    supervisorEid: "1014",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1038",
    name: "Kazi Tahmin Sultana",
    designation: "Special Educator",
    department: "Program & Operation",
    mobile: "01619-845002",
    location: "Inclusive School",
    officialEmail: "rayerbazar@leedobd.org",
    alternateEmail: "ktahmin.leedo02@gmail.com",
    supervisorEid: "1013",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1039",
    name: "Tahmina Haque Tonima",
    designation: "Special Educator",
    department: "Program & Operation",
    mobile: "01962-678701",
    location: "Inclusive School",
    officialEmail: "rayerbazar@leedobd.org",
    alternateEmail: "tonima.leedo81@gmail.com",
    supervisorEid: "1013",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1040",
    name: "Ruksana Akter",
    designation: "Sewing Teacher",
    department: "Program & Operation",
    mobile: "0189-3468570",
    location: "Inclusive School",
    supervisorEid: "1013",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1043",
    name: "Sobuj",
    designation: "Security Guard",
    department: "Program & Operation",
    mobile: "01700-000000",
    location: "Peace Home",
    officialEmail: "inclusive.school@leedobd.org",
    supervisorEid: "1014",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1044",
    name: "Rehana Parvin",
    designation: "Street Educator",
    department: "Program & Operation",
    mobile: "01710-494058",
    location: "Kamalapur",
    officialEmail: "inclusive.school@leedobd.org",
    supervisorEid: "1023",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1052",
    name: "AKM Azizur Rahman",
    designation: "Co-ordinator, Partnership",
    department: "Partnership",
    mobile: "01999-690906",
    location: "Head Office",
    officialEmail: "azizrahman.leedo@gmail.com",
    alternateEmail: "01675-633010",
    supervisorEid: "1001",
    role: "supervisor",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1057",
    name: "Md. Omar Faruque",
    designation: "Manager HR & Admin",
    department: "Admin & Finance",
    mobile: "016714-32484",
    location: "Head Office",
    officialEmail: "hr.leedo2000@gmail.com",
    supervisorEid: "1002",
    role: "hr_admin",
    employmentStatus: "Active",
    joiningDate: "2018-03-01",
    provisioningStatus: "Active",
    mustChangePassword: false,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1059",
    name: "Mim Akter Oishi",
    designation: "Teacher",
    department: "Program & Operation",
    mobile: "01929-540167",
    location: "Peace Home",
    supervisorEid: "1014",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1061",
    name: "Sharmin Akter",
    designation: "Sewing Teacher",
    department: "Program & Operation",
    mobile: "01623-841818",
    location: "Kodomtoli",
    supervisorEid: "1023",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1062",
    name: "Sharmin Akter Puspo",
    designation: "Beautification Teacher",
    department: "Program & Operation",
    mobile: "01798-852216",
    location: "Kodomtoli",
    officialEmail: "airport@leedobd.org",
    supervisorEid: "1023",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1063",
    name: "Mohammed Sakaitul Hideer",
    designation: "Football Couch",
    department: "Program & Operation",
    mobile: "01830-381677",
    location: "Airport",
    officialEmail: "airport@leedobd.org",
    supervisorEid: "1013",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1064",
    name: "Maloti Bishwas",
    designation: "Cook",
    department: "Program & Operation",
    mobile: "0133-9257825",
    location: "Kamalapur",
    supervisorEid: "1023",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1067",
    name: "Md. Rayhan Khan Hira",
    designation: "Communication & Media Manager",
    department: "Program & Operation",
    mobile: "0133-4112941",
    location: "Head Office",
    officialEmail: "aziz@leedobd.org",
    alternateEmail: "communicationmedialeedo@gmail.com",
    supervisorEid: "1001",
    role: "supervisor",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1068",
    name: "Wahid Hasan Niloy",
    designation: "ICT Instructor",
    department: "Program & Operation",
    mobile: "0179-7654700",
    location: "Kodomtoli",
    officialEmail: "hr@leedobd.org",
    supervisorEid: "1057",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1069",
    name: "Soumitra Kumar Shil",
    designation: "Street Educator",
    department: "Program & Operation",
    mobile: "0172-2271624",
    location: "Kodomtoli",
    supervisorEid: "1023",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1070",
    name: "Forhad Ali",
    designation: "Social Mobilizer",
    department: "Program & Operation",
    mobile: "01516-097997",
    location: "Kamalapur",
    supervisorEid: "1023",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1071",
    name: "Md. Asadullah",
    designation: "Cricket Coach",
    department: "Program & Operation",
    mobile: "01797-038112",
    location: "Peace Home",
    supervisorEid: "1014",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1075",
    name: "Farhana Akter",
    designation: "Program Coordinator",
    department: "Program & Operation",
    mobile: "01617-155535",
    location: "Head Office",
    supervisorEid: "1013",
    role: "supervisor",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1079",
    name: "Sazzad Hosen",
    designation: "Assistant Accountant",
    department: "Admin & Finance",
    mobile: "01680-882718",
    location: "Head Office",
    supervisorEid: "1004",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1080",
    name: "Belal Ahmed",
    designation: "Documentation Coordinator",
    department: "Program & Operation",
    mobile: "01749-692780",
    location: "Head Office",
    supervisorEid: "1013",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1088",
    name: "Abdullah Al Nafi",
    designation: "Content Creator",
    department: "Program & Operation",
    mobile: "01595-047832",
    location: "Head Office",
    officialEmail: "communication.media@leedobd.org",
    supervisorEid: "1067",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1089",
    name: "A.K.M. Mizanur Rahman",
    designation: "Fund Acquisition Manager",
    department: "Program & Operation",
    mobile: "0197-9805641",
    location: "Head Office",
    supervisorEid: "1052",
    role: "supervisor",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1090",
    name: "Fabliha Mahfuz",
    designation: "Fund Acquisition Manager",
    department: "Program & Operation",
    mobile: "01763-433819",
    location: "Head Office",
    officialEmail: "fablihaleedo@gmail.com",
    supervisorEid: "1052",
    role: "supervisor",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1091",
    name: "Nargis Akter",
    designation: "Cook",
    department: "Program & Operation",
    mobile: "01913-550484",
    location: "Peace Home",
    officialEmail: "kamalapur@leedobd.org",
    supervisorEid: "1014",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1093",
    name: "Milton Miya",
    designation: "Street Educator",
    department: "Program & Operation",
    mobile: "01317-192291",
    location: "Kodomtoli",
    supervisorEid: "1023",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1096",
    name: "Nabila Akter",
    designation: "Street Educator",
    department: "Program & Operation",
    mobile: "01815-452923",
    location: "Mirpur",
    supervisorEid: "1032",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1097",
    name: "Monirul Islam",
    designation: "Security Guard",
    department: "Program & Operation",
    mobile: "01700-000001",
    location: "Head Office",
    supervisorEid: "1009",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1098",
    name: "Mst. Laily",
    designation: "Office Assistant",
    department: "Program & Operation",
    mobile: "01933-182700",
    location: "Head Office",
    supervisorEid: "1009",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1099",
    name: "Dr. Borhan Uddin",
    designation: "Doctor",
    department: "Program & Operation",
    mobile: "01740-886977",
    location: "Kamalapur",
    supervisorEid: "1013",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1100",
    name: "Mim Akter",
    designation: "Assistant Mother",
    department: "Program & Operation",
    mobile: "01300-000000",
    location: "Kodomtoli",
    supervisorEid: "1023",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Needs Review",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    eid: "1101",
    name: "Aleya Akter",
    designation: "Assistant Social Mobilizer",
    department: "Program & Operation",
    mobile: "01319-782473",
    location: "Kodomtoli",
    supervisorEid: "1023",
    role: "employee",
    employmentStatus: "Active",
    provisioningStatus: "Active",
    mustChangePassword: true,
    dataVerificationStatus: "Verified",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// Initial Tasks: Clean slate (Demo tasks deleted)
export const SEED_TASKS: Task[] = [];

// Initial Smart Tickets
export const SEED_TICKETS: Ticket[] = [
  {
    id: "TCK-801",
    requesterEid: "1014",
    department: "Program & Operation",
    location: "Peace Home",
    category: "Facility Maintenance",
    subject: "Water Purifier Filter Replacement in Dining Hall",
    description: "The primary RO water filter at Peace Home children's dining hall has an alarm beeping and flow rate has slowed down significantly. We need immediate technician service or replacement cartridge.",
    priority: "Urgent",
    confidentialityLevel: "Standard",
    status: "Assigned",
    assignedSupportTeam: "Logistics & Maintenance",
    assignedToEid: "1009",
    targetResponseHours: 12,
    resolutionDeadline: "2026-10-27T18:00:00Z",
    createdAt: "2026-10-26T08:30:00Z",
    updatedAt: "2026-10-26T09:15:00Z",
    comments: [
      {
        id: "tc-1",
        authorEid: "1009",
        authorName: "Rone Ahammed",
        content: "Vendor contacted. Technician scheduled to visit Peace Home today at 3:00 PM with replacement membrane.",
        createdAt: "2026-10-26T09:15:00Z",
      },
    ],
    attachments: [],
  },
  {
    id: "TCK-802",
    requesterEid: "1034",
    department: "Program & Operation",
    location: "Tejgoan",
    category: "Transport Request",
    subject: "Emergency Transport for 2 Rescued Children from Tejgaon Overbridge",
    description: "Two young boys (approx 8 and 10 years old) rescued from Tejgaon railway overbridge under severe fever and distress. Need transport vehicle to transfer them to Peace Home isolation unit.",
    priority: "Urgent",
    confidentialityLevel: "Confidential",
    status: "In Progress",
    assignedSupportTeam: "Transport & Shelter",
    assignedToEid: "1010",
    targetResponseHours: 4,
    resolutionDeadline: "2026-10-26T14:00:00Z",
    createdAt: "2026-10-26T09:00:00Z",
    updatedAt: "2026-10-26T09:20:00Z",
    comments: [
      {
        id: "tc-2",
        authorEid: "1010",
        authorName: "Ibrahim",
        content: "Ambulance dispatched from Head Office. Estimated arrival at Tejgaon point in 25 minutes.",
        createdAt: "2026-10-26T09:20:00Z",
      },
    ],
    attachments: [],
    convertedToTaskId: "TSK-1001",
  },
  {
    id: "TCK-803",
    requesterEid: "1068",
    department: "Program & Operation",
    location: "Kodomtoli",
    category: "IT Support",
    subject: "Wifi Router Connectivity Drop in Staff Room",
    description: "The broadband wifi in Kodomtoli staff room keeps disconnecting every 10 minutes. Field staff unable to submit daily attendance records.",
    priority: "Medium",
    confidentialityLevel: "Standard",
    status: "New",
    assignedSupportTeam: "ICT & Digital Systems",
    targetResponseHours: 48,
    resolutionDeadline: "2026-10-28T12:00:00Z",
    createdAt: "2026-10-26T07:45:00Z",
    updatedAt: "2026-10-26T07:45:00Z",
    comments: [],
    attachments: [],
  },
];

// Initial Audit Logs
export const SEED_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "log-1",
    actorEid: "1057",
    actorName: "Md. Omar Faruque",
    action: "DATABASE_INITIALIZATION",
    targetRecordType: "Employee",
    targetRecordId: "MASTER_DATA",
    details: "Loaded verified LEEDO Employee Master Database with 54 personnel records and configured initial supervisor relationships.",
    timestamp: "2026-10-26T07:00:00Z",
  },
  {
    id: "log-2",
    actorEid: "1002",
    actorName: "Murshida Akhter Kanta",
    action: "TASK_APPROVED",
    targetRecordType: "Task",
    targetRecordId: "TSK-1003",
    details: "Approved Inclusive School Special Needs Learning Material Procurement after verification of supplier vouchers.",
    timestamp: "2026-10-19T10:00:00Z",
  },
  {
    id: "log-3",
    actorEid: "1014",
    actorName: "Tania Akter",
    action: "TASK_SUBMITTED_FOR_REVIEW",
    targetRecordType: "Task",
    targetRecordId: "TSK-1002",
    details: "Submitted Peace Home Shelter Monthly Dietary & Nutrition Inspection with signed ration evidence.",
    timestamp: "2026-10-25T11:05:00Z",
  },
  {
    id: "log-4",
    actorEid: "1068",
    actorName: "Wahid Hasan Niloy",
    action: "TASK_STATUS_BLOCKED",
    targetRecordType: "Task",
    targetRecordId: "TSK-1005",
    details: "Flagged task as blocked awaiting 2 SMPS power units from Logistics.",
    timestamp: "2026-10-25T15:20:00Z",
  },
];

// Initial Notifications
export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    recipientEid: "1013",
    title: "Review Required: Peace Home Dietary Inspection",
    message: "Tania Akter has submitted task TSK-1002 for your review and approval.",
    type: "task_approval",
    linkPath: "/review-approvals",
    read: false,
    createdAt: "2026-10-25T11:05:00Z",
  },
  {
    id: "notif-2",
    recipientEid: "1023",
    title: "Deadline Approaching (3 Days Left)",
    message: "Task TSK-1001: Kamalapur Outreach Camp is due on Oct 30.",
    type: "deadline_warning",
    linkPath: "/tasks",
    read: false,
    createdAt: "2026-10-26T08:00:00Z",
  },
  {
    id: "notif-3",
    recipientEid: "1009",
    title: "Urgent Ticket Assigned: Water Purifier Repair",
    message: "Ticket TCK-801 at Peace Home assigned to your logistics team.",
    type: "ticket_update",
    linkPath: "/tickets",
    read: false,
    createdAt: "2026-10-26T08:35:00Z",
  },
];

// Storage Engine Implementation
class StorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (typeof window === "undefined") return;

    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(SEED_EMPLOYEES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(SEED_TASKS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(SEED_TICKETS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEED_AUDIT_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.GROUP_TASKS)) {
      localStorage.setItem(STORAGE_KEYS.GROUP_TASKS, JSON.stringify([]));
    }
    this.initFirestoreListeners();
  }

  private isListenersAttached = false;
  private initFirestoreListeners() {
    if (typeof window === "undefined" || !db || this.isListenersAttached) return;
    this.isListenersAttached = true;

    try {
      // 1. Group Tasks Real-Time Sync
      const groupTasksCol = collection(db, "groupTasks");
      onSnapshot(
        groupTasksCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteMap = new Map<string, GroupTask>();
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as GroupTask;
              if (data && data.id) {
                remoteMap.set(data.id, data);
              }
            });
            const local = this.getGroupTasks();
            const localMap = new Map<string, GroupTask>(local.map((t) => [t.id, t]));
            remoteMap.forEach((remoteTask, id) => {
              const localTask = localMap.get(id);
              if (!localTask || new Date(remoteTask.updatedAt).getTime() >= new Date(localTask.updatedAt).getTime()) {
                localMap.set(id, remoteTask);
              }
            });
            const merged = Array.from(localMap.values());
            localStorage.setItem(STORAGE_KEYS.GROUP_TASKS, JSON.stringify(merged));
            this.notify();
          }
        },
        (err) => console.debug("Firestore groupTasks sync note:", err)
      );

      // 2. Individual Tasks Real-Time Sync
      const tasksCol = collection(db, "tasks");
      onSnapshot(
        tasksCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteMap = new Map<string, Task>();
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Task;
              if (data && data.id) {
                remoteMap.set(data.id, data);
              }
            });
            const local = this.getTasks();
            const localMap = new Map<string, Task>(local.map((t) => [t.id, t]));
            remoteMap.forEach((remoteTask, id) => {
              const localTask = localMap.get(id);
              if (!localTask || new Date(remoteTask.updatedAt).getTime() >= new Date(localTask.updatedAt).getTime()) {
                localMap.set(id, remoteTask);
              }
            });
            const merged = Array.from(localMap.values());
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(merged));
            this.notify();
          }
        },
        (err) => console.debug("Firestore tasks sync note:", err)
      );

      // 3. Tickets Real-Time Sync
      const ticketsCol = collection(db, "tickets");
      onSnapshot(
        ticketsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteMap = new Map<string, Ticket>();
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Ticket;
              if (data && data.id) {
                remoteMap.set(data.id, data);
              }
            });
            const local = this.getTickets();
            const localMap = new Map<string, Ticket>(local.map((t) => [t.id, t]));
            remoteMap.forEach((remoteTicket, id) => {
              const localTicket = localMap.get(id);
              if (!localTicket || new Date(remoteTicket.updatedAt).getTime() >= new Date(localTicket.updatedAt).getTime()) {
                localMap.set(id, remoteTicket);
              }
            });
            const merged = Array.from(localMap.values());
            localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(merged));
            this.notify();
          }
        },
        (err) => console.debug("Firestore tickets sync note:", err)
      );

      // 4. Employees Master Database Real-Time Sync
      const empCol = collection(db, "employees");
      onSnapshot(
        empCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteMap = new Map<string, Employee>();
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Employee;
              if (data && data.eid) {
                remoteMap.set(data.eid, data);
              }
            });
            const local = this.getEmployees();
            const localMap = new Map<string, Employee>(local.map((e) => [e.eid, e]));
            remoteMap.forEach((remoteEmp, eid) => {
              const localEmp = localMap.get(eid);
              if (!localEmp || new Date(remoteEmp.updatedAt).getTime() >= new Date(localEmp.updatedAt).getTime()) {
                localMap.set(eid, remoteEmp);
              }
            });
            const merged = Array.from(localMap.values());
            localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(merged));
            this.notify();
          } else {
            // First time seed to Firestore so employees are stored permanently in the cloud
            SEED_EMPLOYEES.forEach((emp) => {
              syncToFirestore("employees", emp.eid, emp);
            });
          }
        },
        (err) => console.debug("Firestore employees sync note:", err)
      );

      // 5. System Settings Real-Time Sync
      const settingsDocRef = doc(db, "systemSettings", "config");
      onSnapshot(
        settingsDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const cloudSettings = docSnap.data() as SystemSettings;
            if (cloudSettings && cloudSettings.organizationName) {
              localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cloudSettings));
              this.notify();
            }
          } else {
            syncToFirestore("systemSettings", "config", DEFAULT_SETTINGS);
          }
        },
        (err) => console.debug("Firestore settings sync note:", err)
      );
    } catch (e) {
      console.debug("Could not attach all Firestore listeners:", e);
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("Storage listener error:", err);
      }
    });
  }

  // --- Employees ---
  getEmployees(): Employee[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      return data ? JSON.parse(data) : SEED_EMPLOYEES;
    } catch {
      return SEED_EMPLOYEES;
    }
  }

  getEmployeeByEid(eid: string): Employee | undefined {
    return this.getEmployees().find((e) => e.eid === eid);
  }

  saveEmployee(employee: Employee, actorEid?: string): boolean {
    const list = this.getEmployees();
    const index = list.findIndex((e) => e.eid === employee.eid);
    const now = new Date().toISOString();

    if (index >= 0) {
      list[index] = { ...employee, updatedAt: now };
      this.logAudit(
        actorEid || "SYSTEM",
        "UPDATE_EMPLOYEE",
        "Employee",
        employee.eid,
        `Updated profile for ${employee.name} (${employee.eid})`
      );
    } else {
      list.push({ ...employee, createdAt: now, updatedAt: now });
      this.logAudit(
        actorEid || "SYSTEM",
        "CREATE_EMPLOYEE",
        "Employee",
        employee.eid,
        `Created new employee record for ${employee.name} (${employee.eid})`
      );
    }

    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(list));
    syncToFirestore("employees", employee.eid, employee);
    this.notify();
    return true;
  }

  bulkImportEmployees(newEmployees: Employee[], actorEid: string): { successCount: number; duplicateCount: number } {
    const existing = this.getEmployees();
    const existingMap = new Map(existing.map((e) => [e.eid, e]));
    let successCount = 0;
    let duplicateCount = 0;
    const now = new Date().toISOString();

    const merged = [...existing];

    for (const emp of newEmployees) {
      if (existingMap.has(emp.eid)) {
        duplicateCount++;
      } else {
        merged.push({
          ...emp,
          createdAt: now,
          updatedAt: now,
        });
        existingMap.set(emp.eid, emp);
        successCount++;
      }
    }

    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(merged));
    this.logAudit(
      actorEid,
      "BULK_IMPORT_EMPLOYEES",
      "Employee",
      "BATCH_IMPORT",
      `Imported ${successCount} verified employee records. ${duplicateCount} duplicate EIDs skipped.`
    );
    this.notify();
    return { successCount, duplicateCount };
  }

  // --- Tasks ---
  getTasks(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) return [];
      const list: Task[] = JSON.parse(data);
      // Clean out any legacy demo tasks
      const demoIds = ["TSK-1001", "TSK-1002", "TSK-1003", "TSK-1004", "TSK-1005", "TSK-1006"];
      const cleaned = list.filter((t) => !demoIds.includes(t.id));
      if (cleaned.length !== list.length) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  }

  getTaskById(id: string): Task | undefined {
    return this.getTasks().find((t) => t.id === id);
  }

  saveTask(task: Task, actorEid?: string): Task {
    const list = this.getTasks();
    const index = list.findIndex((t) => t.id === task.id);
    const now = new Date().toISOString();

    let finalTask = { ...task, updatedAt: now };
    if (index >= 0) {
      list[index] = finalTask;
      this.logAudit(
        actorEid || "SYSTEM",
        "UPDATE_TASK",
        "Task",
        task.id,
        `Updated task ${task.id}: "${task.title}" (Status: ${task.status})`
      );
    } else {
      if (!task.id) {
        finalTask.id = `TSK-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      finalTask.createdAt = now;
      list.unshift(finalTask);
      this.logAudit(
        actorEid || "SYSTEM",
        "CREATE_TASK",
        "Task",
        finalTask.id,
        `Created task ${finalTask.id}: "${finalTask.title}"`
      );

      // Notify Assignee
      if (finalTask.assignedToEid) {
        this.createNotification({
          recipientEid: finalTask.assignedToEid,
          title: "New Task Assigned",
          message: `You were assigned task ${finalTask.id}: "${finalTask.title}". Due: ${finalTask.dueDate}`,
          type: "task_assigned",
          linkPath: "/tasks",
        });
      }
    }

    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
    syncToFirestore("tasks", finalTask.id, finalTask);
    this.notify();
    return finalTask;
  }

  deleteTask(taskId: string, actorEid: string) {
    const list = this.getTasks().filter((t) => t.id !== taskId);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
    deleteFromFirestore("tasks", taskId);
    this.logAudit(actorEid, "DELETE_TASK", "Task", taskId, `Deleted task ${taskId}`);
    this.notify();
  }

  // --- Tickets ---
  getTickets(): Ticket[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
      return data ? JSON.parse(data) : SEED_TICKETS;
    } catch {
      return SEED_TICKETS;
    }
  }

  saveTicket(ticket: Ticket, actorEid?: string): Ticket {
    const list = this.getTickets();
    const index = list.findIndex((t) => t.id === ticket.id);
    const now = new Date().toISOString();

    let finalTicket = { ...ticket, updatedAt: now };
    if (index >= 0) {
      list[index] = finalTicket;
      this.logAudit(
        actorEid || "SYSTEM",
        "UPDATE_TICKET",
        "Ticket",
        ticket.id,
        `Updated ticket ${ticket.id}: "${ticket.subject}" (Status: ${ticket.status})`
      );
    } else {
      if (!ticket.id) {
        finalTicket.id = `TCK-${Math.floor(800 + Math.random() * 200)}`;
      }
      finalTicket.createdAt = now;
      list.unshift(finalTicket);
      this.logAudit(
        actorEid || "SYSTEM",
        "CREATE_TICKET",
        "Ticket",
        finalTicket.id,
        `Submitted ticket ${finalTicket.id}: "${finalTicket.subject}"`
      );
    }

    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(list));
    syncToFirestore("tickets", finalTicket.id, finalTicket);
    this.notify();
    return finalTicket;
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLogItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : SEED_AUDIT_LOGS;
    } catch {
      return SEED_AUDIT_LOGS;
    }
  }

  logAudit(
    actorEid: string,
    action: string,
    targetRecordType: AuditLogItem["targetRecordType"],
    targetRecordId: string,
    details: string
  ) {
    const actor = this.getEmployeeByEid(actorEid);
    const logItem: AuditLogItem = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorEid,
      actorName: actor ? actor.name : actorEid,
      action,
      targetRecordType,
      targetRecordId,
      details,
      timestamp: new Date().toISOString(),
    };

    const logs = this.getAuditLogs();
    logs.unshift(logItem);
    // Keep max 500 audit logs
    if (logs.length > 500) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    syncToFirestore("auditLogs", logItem.id, logItem);
  }

  // --- Notifications ---
  getNotifications(eid?: string): NotificationItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const all: NotificationItem[] = data ? JSON.parse(data) : SEED_NOTIFICATIONS;
      if (!eid) return all;
      return all.filter((n) => n.recipientEid === eid);
    } catch {
      return SEED_NOTIFICATIONS;
    }
  }

  createNotification(notif: Omit<NotificationItem, "id" | "createdAt" | "read">) {
    const fullItem: NotificationItem = {
      ...notif,
      id: `nt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const all = this.getNotifications();
    all.unshift(fullItem);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    this.notify();
  }

  markNotificationRead(id: string) {
    const all = this.getNotifications();
    const item = all.find((n) => n.id === id);
    if (item) {
      item.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
      this.notify();
    }
  }

  markAllNotificationsRead(eid: string) {
    const all = this.getNotifications();
    all.forEach((n) => {
      if (n.recipientEid === eid) n.read = true;
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    this.notify();
  }

  // --- Settings ---
  getSettings(): SystemSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: SystemSettings, actorEid: string) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    syncToFirestore("systemSettings", "config", settings);
    this.logAudit(actorEid, "UPDATE_SETTINGS", "Setting", "SYSTEM_SETTINGS", "Updated organizational system settings.");
    this.notify();
  }

  // --- Session Management ---
  getCurrentSessionEid(): string | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_EID);
    if (!stored || !stored.trim()) {
      return null;
    }
    return stored.trim();
  }

  setCurrentSessionEid(eid: string | null) {
    if (!eid || !eid.trim()) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_EID);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_EID, eid.trim());
    }
    this.notify();
  }

  // --- Group Tasks (Collaborative Team Tasks) ---
  getGroupTasks(): GroupTask[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GROUP_TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getGroupTaskById(id: string): GroupTask | undefined {
    return this.getGroupTasks().find((t) => t.id === id);
  }

  saveGroupTask(task: GroupTask, actorEid?: string): GroupTask {
    const list = this.getGroupTasks();
    const index = list.findIndex((t) => t.id === task.id);
    const now = new Date().toISOString();
    const finalTask = { ...task, updatedAt: now };

    if (index >= 0) {
      list[index] = finalTask;
      this.logAudit(
        actorEid || task.leaderEid,
        "UPDATE_GROUP_TASK",
        "Task",
        task.id,
        `Updated group task: "${task.title}" (Status: ${task.status}, Progress: ${task.progressPercentage}%)`
      );
    } else {
      list.unshift(finalTask);
      this.logAudit(
        actorEid || task.createdByEid,
        "CREATE_GROUP_TASK",
        "Task",
        task.id,
        `Created new collaborative group task: "${task.title}" with ${task.members?.length || 0} team members.`
      );

      // Notify all assigned members
      if (task.memberEids && task.memberEids.length > 0) {
        task.memberEids.forEach((memberEid) => {
          if (memberEid !== (actorEid || task.createdByEid)) {
            this.createNotification({
              recipientEid: memberEid,
              title: "Added to Group Task",
              message: `You were added to group task: "${task.title}" (${task.location})`,
              type: "task_assigned",
            });
          }
        });
      }
    }

    localStorage.setItem(STORAGE_KEYS.GROUP_TASKS, JSON.stringify(list));
    syncToFirestore("groupTasks", finalTask.id, finalTask);
    this.notify();
    return finalTask;
  }

  addGroupTaskUpdate(
    groupTaskId: string,
    update: Omit<GroupTaskUpdate, "id" | "timestamp">,
    actorEid: string
  ): GroupTask | undefined {
    const task = this.getGroupTaskById(groupTaskId);
    if (!task) return undefined;

    const newUpdate: GroupTaskUpdate = {
      ...update,
      id: "UPD-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
    };

    const updatedUpdates = [newUpdate, ...(task.updates || [])];
    let newProgress = task.progressPercentage;
    if (typeof update.progressPercentage === "number") {
      newProgress = Math.min(100, Math.max(0, update.progressPercentage));
    }

    let newStatus = task.status;
    if (newProgress === 100 && task.status !== "Completed") {
      newStatus = "Under Review";
    }

    const updatedTask: GroupTask = {
      ...task,
      updates: updatedUpdates,
      progressPercentage: newProgress,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    return this.saveGroupTask(updatedTask, actorEid);
  }

  toggleGroupTaskMilestone(groupTaskId: string, milestoneId: string, actorEid: string): GroupTask | undefined {
    const task = this.getGroupTaskById(groupTaskId);
    if (!task) return undefined;

    const actor = this.getEmployeeByEid(actorEid);
    const now = new Date().toISOString();

    const updatedMilestones = (task.milestones || []).map((m) => {
      if (m.id === milestoneId) {
        const nextCompleted = !m.completed;
        return {
          ...m,
          completed: nextCompleted,
          completedByEid: nextCompleted ? actorEid : undefined,
          completedByName: nextCompleted ? (actor?.name || actorEid) : undefined,
          completedAt: nextCompleted ? now : undefined,
        };
      }
      return m;
    });

    let newProgress = task.progressPercentage;
    if (updatedMilestones.length > 0) {
      const completedCount = updatedMilestones.filter((m) => m.completed).length;
      newProgress = Math.round((completedCount / updatedMilestones.length) * 100);
    }

    const updatedTask: GroupTask = {
      ...task,
      milestones: updatedMilestones,
      progressPercentage: newProgress,
      updatedAt: now,
    };

    return this.saveGroupTask(updatedTask, actorEid);
  }

  deleteGroupTask(id: string, actorEid: string): boolean {
    const list = this.getGroupTasks();
    const item = list.find((t) => t.id === id);
    if (!item) return false;

    const filtered = list.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.GROUP_TASKS, JSON.stringify(filtered));
    deleteFromFirestore("groupTasks", id);
    this.logAudit(actorEid, "DELETE_GROUP_TASK", "Task", id, `Deleted group task "${item.title}"`);
    this.notify();
    return true;
  }

  // --- Long-Term Firebase Cloud Synchronization & Backup ---
  async syncAllToCloud(actorEid?: string): Promise<{
    success: boolean;
    taskCount: number;
    groupTaskCount: number;
    employeeCount: number;
    ticketCount: number;
    error?: string;
  }> {
    if (!db) {
      return {
        success: false,
        taskCount: 0,
        groupTaskCount: 0,
        employeeCount: 0,
        ticketCount: 0,
        error: "Firestore database instance is not connected.",
      };
    }

    try {
      const employees = this.getEmployees();
      const tasks = this.getTasks();
      const groupTasks = this.getGroupTasks();
      const tickets = this.getTickets();
      const settings = this.getSettings();

      const promises: Promise<any>[] = [];

      employees.forEach((emp) => {
        promises.push(setDoc(doc(db, "employees", emp.eid), emp, { merge: true }));
      });

      tasks.forEach((task) => {
        promises.push(setDoc(doc(db, "tasks", task.id), task, { merge: true }));
      });

      groupTasks.forEach((gt) => {
        promises.push(setDoc(doc(db, "groupTasks", gt.id), gt, { merge: true }));
      });

      tickets.forEach((tk) => {
        promises.push(setDoc(doc(db, "tickets", tk.id), tk, { merge: true }));
      });

      promises.push(setDoc(doc(db, "systemSettings", "config"), settings, { merge: true }));

      await Promise.all(promises);

      const timestamp = new Date().toISOString();
      localStorage.setItem("leedo_last_cloud_backup", timestamp);

      if (actorEid) {
        this.logAudit(
          actorEid,
          "CLOUD_BACKUP_SYNC",
          "Setting",
          "FIREBASE_FIRESTORE",
          `Permanent cloud database backup verified to Google Cloud Firestore (Tasks: ${tasks.length}, Group Tasks: ${groupTasks.length}, Employees: ${employees.length}, Tickets: ${tickets.length})`
        );
      }

      this.notify();

      return {
        success: true,
        taskCount: tasks.length,
        groupTaskCount: groupTasks.length,
        employeeCount: employees.length,
        ticketCount: tickets.length,
      };
    } catch (err: any) {
      console.error("Cloud backup error:", err);
      return {
        success: false,
        taskCount: 0,
        groupTaskCount: 0,
        employeeCount: 0,
        ticketCount: 0,
        error: err?.message || "Failed to sync to Firestore cloud.",
      };
    }
  }

  getLastCloudBackupTime(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("leedo_last_cloud_backup");
  }

  // Reset demo state back to seed
  resetToSeed(actorEid: string) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(SEED_EMPLOYEES));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(SEED_TASKS));
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(SEED_TICKETS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEED_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    this.logAudit(actorEid, "RESET_DATABASE", "Setting", "DATABASE", "System restored to initial verified state.");
    this.notify();
  }
}

export const storage = new StorageService();
