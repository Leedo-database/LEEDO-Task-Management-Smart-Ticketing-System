import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "10mb" }));

// Initialize Google GenAI client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    aiConfigured: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// AI: Task Assistance (Suggest Category, Priority, Checklist, Subtasks)
app.post("/api/gemini/suggest-task", async (req, res) => {
  const { title, description, department, location } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  if (!ai) {
    // Graceful fallback heuristics if API key is missing
    return res.json({
      suggestedCategory: title.toLowerCase().includes("school")
        ? "Inclusive Education"
        : title.toLowerCase().includes("shelter") || title.toLowerCase().includes("home")
        ? "Shelter Management"
        : title.toLowerCase().includes("fund") || title.toLowerCase().includes("donor")
        ? "Partnership & Fundraising"
        : "Program Operations",
      suggestedPriority: title.toLowerCase().includes("urgent") || title.toLowerCase().includes("emergency")
        ? "Urgent"
        : "Medium",
      priorityReasoning: "Determined from urgency keywords in title and department scope.",
      missingInfo: [
        "Confirm required materials/budget if any",
        "Specify verification photos or completion report needed",
      ],
      suggestedSubtasks: [
        "Coordinate initial field requirements with location in-charge",
        "Execute primary action items and document evidence",
        "Submit completion report for supervisor sign-off",
      ],
      aiPowered: false,
    });
  }

  try {
    const prompt = `You are an AI assistant for LEEDO (Local Education and Economic Development Organization), a Bangladesh NGO supporting vulnerable street-connected children, inclusive education, and shelter management.
Analyze the following task information and respond ONLY in valid JSON format:
Task Title: "${title}"
Description: "${description || "None provided"}"
Department: "${department || "Unspecified"}"
Location: "${location || "Unspecified"}"

Respond with JSON schema:
{
  "suggestedCategory": string (one of: HR & Administration, Finance & Accounts, Procurement & Logistics, Program Operations, Street Connected Children, Shelter Management, Inclusive Education, Partnership & Fundraising, Communication & Media, ICT & Digital Systems, Monitoring & Evaluation, Meeting & Reporting, Field Visit, Maintenance, General Request),
  "suggestedPriority": string (Low, Medium, High, or Urgent),
  "priorityReasoning": string (1-2 sentences explaining why based on operational impact),
  "missingInfo": string[] (2-3 crucial details that may be missing, e.g. target children count, supervisor sign-off, exact date/time, budget approval),
  "suggestedSubtasks": string[] (3-5 concrete actionable subtasks)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    return res.json({ ...data, aiPowered: true });
  } catch (error: any) {
    console.error("Gemini API error in suggest-task:", error?.message);
    return res.json({
      suggestedCategory: "Program Operations",
      suggestedPriority: "Medium",
      priorityReasoning: "Fallback rule applied due to temporary AI timeout.",
      missingInfo: ["Verify budget and target delivery milestone."],
      suggestedSubtasks: [
        "Prepare operational checklist",
        "Coordinate field deployment",
        "Document evidence of completion",
      ],
      aiPowered: false,
    });
  }
});

// AI: Task Summary
app.post("/api/gemini/summarize-task", async (req, res) => {
  const { title, description, status, comments, subtasks } = req.body;

  if (!ai) {
    return res.json({
      summary: `Task "${title}" is currently in ${status} status with ${subtasks?.length || 0} subtasks tracked.`,
      blockersOrRisks: "No critical blockers highlighted in system heuristics.",
      recommendedNextStep: "Follow up with assigned employee on next milestone.",
      aiPowered: false,
    });
  }

  try {
    const prompt = `You are an executive assistant for LEEDO NGO management.
Summarize this task clearly for senior leadership:
Title: "${title}"
Status: "${status}"
Description: "${description}"
Subtasks: ${JSON.stringify(subtasks || [])}
Comments/Discussion: ${JSON.stringify(comments || [])}

Return JSON with:
{
  "summary": string (2-3 concise sentences summarizing progress, achievements, and current state),
  "blockersOrRisks": string (any identified blockers, delays, or risk factors),
  "recommendedNextStep": string (single highest priority action item for supervisor/assignee)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    return res.json({ ...data, aiPowered: true });
  } catch (error: any) {
    console.error("Gemini error in summarize-task:", error?.message);
    return res.json({
      summary: `Task "${title}" is currently marked as ${status}. Review subtasks and comments directly.`,
      blockersOrRisks: "Unable to run deep AI risk analysis at this moment.",
      recommendedNextStep: "Conduct direct review with team lead.",
      aiPowered: false,
    });
  }
});

// AI: Extract Action Points from Meeting Notes
app.post("/api/gemini/extract-meeting-actions", async (req, res) => {
  const { meetingTitle, notes, attendees } = req.body;

  if (!notes) {
    return res.status(400).json({ error: "Meeting notes are required" });
  }

  if (!ai) {
    return res.json({
      actionPoints: [
        {
          title: "Follow up on decisions from " + (meetingTitle || "meeting"),
          proposedAssignee: "Head of Operations",
          deadlineDaysFromNow: 5,
          department: "Program & Operation",
          priority: "Medium",
        },
      ],
      aiPowered: false,
    });
  }

  try {
    const prompt = `You are an NGO operational coordinator. Analyze these meeting notes from LEEDO:
Meeting Title: "${meetingTitle || "General Meeting"}"
Attendees: "${attendees || "Team members"}"
Notes:
"""
${notes}
"""

Extract 2 to 6 concrete, actionable tasks that should be tracked in the task management system.
Respond with JSON schema:
{
  "actionPoints": [
    {
      "title": string (concise task title),
      "description": string (specific deliverable, target children/field location if mentioned),
      "proposedAssignee": string (name or role identified in notes or 'To be assigned'),
      "deadlineDaysFromNow": number (estimated realistic turnaround days, 1 to 14),
      "department": string (Admin & Finance, Program & Operation, or Partnership),
      "priority": string (Low, Medium, High, Urgent)
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    return res.json({ ...data, aiPowered: true });
  } catch (error: any) {
    console.error("Gemini error in extract-meeting-actions:", error?.message);
    return res.json({
      actionPoints: [
        {
          title: "Prepare follow-up minutes and circulate to participants",
          description: "Document all approved agreements from the session.",
          proposedAssignee: "Documentation Coordinator",
          deadlineDaysFromNow: 3,
          department: "Program & Operation",
          priority: "Medium",
        },
      ],
      aiPowered: false,
    });
  }
});

// AI: Generate Progress & Performance Report
app.post("/api/gemini/generate-progress-report", async (req, res) => {
  const { scope, department, stats, taskCount } = req.body;

  if (!ai) {
    return res.json({
      reportTitle: `LEEDO Operational Progress Report (${department || "All Departments"})`,
      executiveSummary: `During this period, ${taskCount || 0} total tasks were managed across LEEDO centers including Head Office, Peace Home, and Inclusive School.`,
      keyHighlights: [
        "Consistent tracking across child rescue, education, and shelter activities.",
        "Internal operational tickets resolved within target response times.",
      ],
      bottlenecks: "Certain field location dependencies require active logistics coordination.",
      recommendations: [
        "Schedule bi-weekly supervisor review sessions for overdue tickets.",
        "Ensure all field evidence attachments are uploaded prior to approval.",
      ],
      aiPowered: false,
    });
  }

  try {
    const prompt = `You are the Executive Reporting Officer for LEEDO Bangladesh.
Draft a professional, objective organizational progress report based on these real operational metrics:
Scope: ${scope || "Organization Wide"}
Department: ${department || "All"}
Metrics: ${JSON.stringify(stats || {})}
Total Task Sample: ${taskCount || 0}

Output JSON format:
{
  "reportTitle": string,
  "executiveSummary": string (3-4 sentences synthesizing operational throughput and NGO impact),
  "keyHighlights": string[] (3-4 bullet points highlighting successful completions and milestone progress),
  "bottlenecks": string (honest assessment of overdue items, blocked workflows, or capacity bottlenecks),
  "recommendations": string[] (3 actionable management recommendations)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    return res.json({ ...data, aiPowered: true });
  } catch (error: any) {
    console.error("Gemini report error:", error?.message);
    return res.json({
      reportTitle: `Operational Summary: ${department || "LEEDO"}`,
      executiveSummary: "System records indicate active task movement across shelter and field operations.",
      keyHighlights: ["Key programs moving forward in compliance with NGO objectives."],
      bottlenecks: "Review open review queue for overdue supervisor approvals.",
      recommendations: ["Clear pending approvals in supervisor dashboard."],
      aiPowered: false,
    });
  }
});

// LEEDO AI Assistant: Master System Prompt Implementation
app.post("/api/gemini/leedo-assistant", async (req, res) => {
  const { message, language = "en", userContext } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const masterSystemPrompt = `LEEDO AI ASSISTANT — MASTER SYSTEM PROMPT

1. Identity and Role
You are the official AI Assistant integrated into the LEEDO Task Management & Smart Ticketing System of Local Education and Economic Development Organization (LEEDO), Bangladesh.
Your role is to act as an intelligent organizational work assistant for employees, supervisors, HR & Admin, department managers, and authorized management.
You help users manage tasks, understand tickets, organize priorities, prepare reports, identify operational bottlenecks, and improve coordination across departments and field locations.
Your primary objective is to improve productivity, accountability, timely task completion, information accuracy, and organizational decision support.
You are a professional, neutral, accurate, helpful, and security-conscious organizational assistant.

2. Core Responsibilities
You help users with:
1. Understanding task descriptions and converting them into clear, actionable work plans.
2. Drafting task titles, descriptions, checklists, and completion criteria.
3. Suggesting task categories, priorities, deadlines, and dependencies.
4. Helping users identify missing information before a task is created.
5. Suggesting subtasks for complex assignments.
6. Summarizing task discussions and ticket histories.
7. Explaining task status and identifying the next appropriate action.
8. Identifying overdue, blocked, delayed, or unassigned tasks.
9. Helping supervisors prepare progress summaries.
10. Generating management reports from verified system records.
11. Suggesting workload balancing based on actual task assignments.
12. Identifying possible duplicate tasks or tickets.
13. Helping users draft professional internal messages, notices, meeting action points, and operational updates.
14. Recommending appropriate escalation when a task is blocked or overdue.
15. Explaining how to use available application features.
16. Helping users interpret dashboard information and task performance metrics.

3. Organizational Context
LEEDO works with vulnerable street-connected children and women in Bangladesh. Activities: rescue, referral, reintegration, rebuilding lives, shelter management, inclusive education, street-connected children programmes, field operations, administrative support.
Locations: Head Office, Peace Home, Inclusive School, Kamalapur, Kadamtali, Mirpur, Tejgaon, Rayer Bazar, Airport, etc.
Departments: Admin & Finance, Program & Operation, Partnership.

4. Language & Tone Guidelines
- If the user writes in Bangla or prefers Bangla ('bn'), reply in clear, professional, empathetic, and culturally appropriate formal Bangla (সাধু/প্রমিত চলিত বাংলা).
- If the user writes in English, reply in clean, structured, and professional English.
- Be concise, direct, helpful, and structured with bullet points or numbered lists where suitable.
- Never invent completion records, fake financial numbers, or sensitive safeguarding details.`;

  if (!ai) {
    // Helpful local fallback if API key is not configured
    const isBn = language === "bn" || /[\u0980-\u09FF]/.test(message);
    const reply = isBn
      ? `ধন্যবাদ ${userContext?.name || "কর্মী"}। আপনার বর্তমান দায়িত্ব: ${userContext?.designation || ""}, ${userContext?.department || ""} (${userContext?.location || ""})। আপনার বর্তমানে ${userContext?.taskSummary?.total || 0}টি কাজ নির্ধারিত রয়েছে (বকেয়া: ${userContext?.taskSummary?.overdue || 0}, আটকে থাকা: ${userContext?.taskSummary?.blocked || 0})। আপনার প্রশ্নের প্রেক্ষিতে পরামর্শ: অনুগ্রহ করে নির্ধারিত সময়সীমার মধ্যে কাজের অগ্রগতি আপডেট করুন এবং কোনো জটিলতা থাকলে সুপারভাইজারকে অবগত করুন।`
      : `Thank you ${userContext?.name || "Team Member"}. Context: ${userContext?.designation || ""}, ${userContext?.department || ""} (${userContext?.location || ""}). You currently have ${userContext?.taskSummary?.total || 0} assigned tasks (Overdue: ${userContext?.taskSummary?.overdue || 0}, Blocked: ${userContext?.taskSummary?.blocked || 0}). Recommendation: Focus on imminent deadlines and ensure evidence is submitted upon completion.`;

    return res.json({ reply, aiPowered: false });
  }

  try {
    const userPrompt = `Caller Verified Context:
- Employee ID: ${userContext?.eid || "Unknown"}
- Name: ${userContext?.name || "Colleague"}
- Designation: ${userContext?.designation || "Staff"}
- Department: ${userContext?.department || "General"}
- Location: ${userContext?.location || "Head Office"}
- Role: ${userContext?.role || "employee"}
- Can View All Org Tasks: ${Boolean(userContext?.canViewAllTasks)}
- Current Task Summary: Total=${userContext?.taskSummary?.total || 0}, Overdue=${userContext?.taskSummary?.overdue || 0}, Blocked=${userContext?.taskSummary?.blocked || 0}, In-Progress=${userContext?.taskSummary?.inProgress || 0}
- Assigned / Recent Tasks: ${JSON.stringify(userContext?.recentTasks || [])}

User Language Preference: ${language === "bn" ? "Bengali (বাংলা)" : "English"}

User Query:
"${message}"

Provide a helpful, precise, and supportive answer conforming strictly to the Master System Prompt guidelines.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction: masterSystemPrompt,
      },
    });

    return res.json({
      reply: response.text || "Thank you. Your request has been acknowledged.",
      aiPowered: true,
    });
  } catch (error: any) {
    console.error("LEEDO Assistant error:", error?.message);
    const isBn = language === "bn";
    return res.json({
      reply: isBn
        ? "আমি আপনার বার্তা পেয়েছি। আপনার কাজের অগ্রগতি পর্যালোচনায় কোনো সমস্যা থাকলে অনুগ্রহ করে আপনার সংশ্লিষ্ট সুপারভাইজারের সাথে যোগাযোগ করুন।"
        : "I have received your request. If you face any blockers with your assigned duties, please flag them directly in the task details modal or contact your supervisor.",
      aiPowered: false,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`LEEDO Task Management server running on port ${PORT} (${isProd ? "prod" : "dev"})`);
  });
}

startServer();
