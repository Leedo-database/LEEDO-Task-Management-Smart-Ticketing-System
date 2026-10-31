import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "bn";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Top Bar & Nav
    appName: "LEEDO Work Management",
    orgSubtitle: "Bangladesh Street Children & Shelter Systems",
    overview: "Overview",
    tasks: "Tasks",
    myTasks: "My Tasks",
    groupTasks: "Group Tasks",
    groupTasksSubtitle: "Collaborative team tasks & live updates",
    taskBoard: "Task Board",
    smartTickets: "Smart Tickets",
    analyticsReports: "Analytics & Reports",
    approvals: "Approvals",
    employeeDatabase: "Employee Database",
    workloadCapacity: "Workload & Capacity",
    meetingActions: "Meeting Actions",
    notifications: "Notifications",
    auditTrail: "Audit Trail",
    settings: "System Settings",
    signOut: "Sign Out",
    myProfile: "My Profile",
    changePassword: "Change Password",
    role: "Role",

    // Dashboard
    welcomeBack: "Welcome back",
    totalActiveTasks: "Total Active Tasks",
    myActiveTasks: "My Active Tasks",
    pendingApprovals: "Pending Approvals",
    overdueDeadlines: "Overdue Deadlines",
    myOverdue: "My Overdue Tasks",
    blockedWork: "Blocked Work",
    myBlocked: "My Blocked Work",
    openSupportTickets: "Open Support Tickets",
    createTask: "Create Task",
    submitTicket: "Submit Ticket",
    reviewQueue: "Review Queue",
    manageTickets: "Manage Tickets",
    criticalHighPriority: "Critical & High Priority Tasks",
    fieldLocations: "Field Locations",
    recentAuditTrail: "Recent Accountability Log",
    acrossAllLocations: "Across all 9 locations",
    personalScope: "Assigned to you",

    // Statuses
    Open: "Open",
    "In Progress": "In Progress",
    Blocked: "Blocked",
    "Submitted for Review": "Submitted for Review",
    "Revision Required": "Revision Required",
    Approved: "Approved",
    Completed: "Completed",
    Closed: "Closed",

    // Priorities
    Urgent: "Urgent",
    High: "High",
    Medium: "Medium",
    Low: "Low",

    // AI Assistant
    aiAssistantTitle: "LEEDO AI Assistant",
    aiAssistantSubtitle: "Official Intelligent Organizational Work Assistant",
    aiPlaceholder: "Ask about your tasks, priorities, checklists, or reports...",
    send: "Send",
    thinking: "Thinking...",
    clearChat: "Clear Chat",
    quickPrompt1: "Organize my today's task priorities",
    quickPrompt2: "Draft a field visit checklist",
    quickPrompt3: "Check if I have any overdue or blocked tasks",
    quickPrompt4: "Generate executive progress summary",

    // Employee Database Restricted Notice
    accessDenied: "Access Restricted",
    accessDeniedDesc: "The Employee Master Database is restricted to authorized management (Forhad Hossain, Murshida Akhter Kanta, and Md. Omar Faruque).",
    backToDashboard: "Back to Dashboard",
  },
  bn: {
    // Top Bar & Nav
    appName: "লিডো কর্ম ব্যবস্থাপনা",
    orgSubtitle: "সুবিধাবঞ্চিত পথশিশু ও শেল্টার ব্যবস্থাপনা পদ্ধতি",
    overview: "সারসংক্ষেপ",
    tasks: "সকল কাজ",
    myTasks: "আমার কাজ",
    groupTasks: "গ্রুপ টাস্ক",
    groupTasksSubtitle: "দলীয় যৌথ কাজ ও রিয়েল-টাইম আপডেট",
    taskBoard: "টাস্ক বোর্ড",
    smartTickets: "স্মার্ট টিকিট",
    analyticsReports: "প্রতিবেদন ও বিশ্লেষণ",
    approvals: "অনুমোদন সারি",
    employeeDatabase: "কর্মী ডেটাবেজ",
    workloadCapacity: "কাজের চাপ ও সক্ষমতা",
    meetingActions: "সভার সিদ্ধান্তসমূহ",
    notifications: "বিজ্ঞপ্তি",
    auditTrail: "অডিট লগ",
    settings: "সিস্টেম সেটিংস",
    signOut: "লগআউট",
    myProfile: "আমার প্রোফাইল",
    changePassword: "পাসওয়ার্ড পরিবর্তন",
    role: "পদমর্যাদা",

    // Dashboard
    welcomeBack: "স্বাগতম",
    totalActiveTasks: "সর্বমোট সক্রিয় কাজ",
    myActiveTasks: "আমার বর্তমান কাজ",
    pendingApprovals: "অনুমোদনের অপেক্ষায়",
    overdueDeadlines: "সময়োত্তীর্ণ কাজ",
    myOverdue: "আমার সময়োত্তীর্ণ কাজ",
    blockedWork: "স্থগিত / বাধাগ্রস্ত কাজ",
    myBlocked: "আমার আটকে থাকা কাজ",
    openSupportTickets: "চলমান সহায়তা টিকিট",
    createTask: "নতুন কাজ তৈরি করুন",
    submitTicket: "টিকিট পাঠান",
    reviewQueue: "পর্যালোচনা সারি",
    manageTickets: "টিকিট ব্যবস্থাপনা",
    criticalHighPriority: "জরুরি ও উচ্চ অগ্রাধিকারযুক্ত কাজ",
    fieldLocations: "মাঠপর্যায়ের কেন্দ্রসমূহ",
    recentAuditTrail: "সাম্প্রতিক কার্যক্রমের লগ",
    acrossAllLocations: "৯টি কেন্দ্র জুড়ে",
    personalScope: "আপনার দায়িত্বপ্রাপ্ত",

    // Statuses
    Open: "উন্মুক্ত",
    "In Progress": "চলমান",
    Blocked: "স্থগিত / বাধাগ্রস্ত",
    "Submitted for Review": "পর্যালোচনায়",
    "Revision Required": "সংশোধন প্রয়োজন",
    Approved: "অনুমোদিত",
    Completed: "সম্পন্ন",
    Closed: "বন্ধ",

    // Priorities
    Urgent: "জরুরি",
    High: "উচ্চ",
    Medium: "মাঝারি",
    Low: "সাধারণ",

    // AI Assistant
    aiAssistantTitle: "লিডো এআই সহকারী",
    aiAssistantSubtitle: "অফিসিয়াল কর্ম ব্যবস্থাপনা ও পরিকল্পনা সহকারী",
    aiPlaceholder: "কাজের তালিকা, অগ্রাধিকার, চেকলিস্ট বা রিপোর্ট সম্পর্কে জিজ্ঞাসা করুন...",
    send: "পাঠান",
    thinking: "বিশ্লেষণ করা হচ্ছে...",
    clearChat: "চ্যাট মুছুন",
    quickPrompt1: "আজকের কাজের অগ্রাধিকার সাজিয়ে দাও",
    quickPrompt2: "মাঠ পরিদর্শনের চেকলিস্ট তৈরি করো",
    quickPrompt3: "আমার কোনো কাজ কি ওভারডিউ আছে?",
    quickPrompt4: "চলমান কাজের সারসংক্ষেপ প্রতিবেদন দাও",

    // Employee Database Restricted Notice
    accessDenied: "প্রবেশাধিকার সংরক্ষিত",
    accessDeniedDesc: "কর্মী ডেটাবেজে কেবল অনুমোদিত ব্যবস্থাপনা কর্তৃপক্ষ (ফরহাদ হোসেন, মুর্শিদা আক্তার কান্তা এবং মোঃ ওমর ফারুক) প্রবেশ করতে পারবেন।",
    backToDashboard: "ড্যাশবোর্ডে ফিরে যান",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("leedo_lang_pref");
      if (saved === "en" || saved === "bn") {
        return saved;
      }
      return "en"; // Default to English initially
    }
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("leedo_lang_pref", lang);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
