import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { storage } from "../../services/storage";
import {
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  Trash2,
  Bot,
  User,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileText,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  isAi?: boolean;
}

export const LeedoAiAssistant: React.FC = () => {
  const { currentUser, canViewAllTasks } = useAuth();
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const initialGreeting =
    language === "bn"
      ? `আসসালামু আলাইকুম ${currentUser?.name || ""}। আমি লিডোর (LEEDO) অফিসিয়াল এআই সহকারী। আপনার নির্ধারিত কাজ, কাজের অগ্রাধিকার, চেকলিস্ট বা রিপোর্ট প্রস্তুত করতে আমি কীভাবে সাহায্য করতে পারি?`
      : `Hello ${currentUser?.name || ""}. I am the official LEEDO AI Assistant. How can I help you organize your tasks, prioritize work, draft checklists, or prepare progress updates today?`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      sender: "assistant",
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isAi: true,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading || !currentUser) return;

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsLoading(true);

    try {
      // Fetch user's tasks to pass as verified context
      const allTasks = storage.getTasks();
      const myTasks = allTasks.filter((t) => t.assignedToEid === currentUser.eid);
      const contextualTasks = canViewAllTasks ? allTasks.slice(0, 15) : myTasks;

      const response = await fetch("/api/gemini/leedo-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          language: language,
          userContext: {
            eid: currentUser.eid,
            name: currentUser.name,
            designation: currentUser.designation,
            department: currentUser.department,
            location: currentUser.location,
            role: currentUser.role,
            canViewAllTasks,
            taskSummary: {
              total: contextualTasks.length,
              overdue: contextualTasks.filter(
                (t) => new Date(t.dueDate).getTime() < Date.now() && t.status !== "Completed"
              ).length,
              blocked: contextualTasks.filter((t) => t.status === "Blocked").length,
              inProgress: contextualTasks.filter((t) => t.status === "In Progress").length,
            },
            recentTasks: contextualTasks.slice(0, 5).map((t) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              status: t.status,
              dueDate: t.dueDate,
              location: t.location,
            })),
          },
        }),
      });

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: "ai-" + Date.now(),
        sender: "assistant",
        text: data.reply || (language === "bn" ? "দুঃখিত, কোনো উত্তর পাওয়া যায়নি।" : "No response generated."),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isAi: true,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          sender: "system",
          text:
            language === "bn"
              ? "এআই সহকারীর সাথে সংযোগে সমস্যা হয়েছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।"
              : "Unable to contact LEEDO AI Assistant. Please verify network or try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "reset-" + Date.now(),
        sender: "assistant",
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isAi: true,
      },
    ]);
  };

  const quickPrompts = [
    {
      labelEn: "Organize my today's priorities",
      labelBn: "আজকের কাজের অগ্রাধিকার গুছিয়ে দাও",
      promptEn: "Please review my assigned tasks and help me prioritize what to focus on today.",
      promptBn: "আমার নির্ধারিত কাজগুলো পর্যালোচনা করে আজকের জন্য কাজের অগ্রাধিকার ঠিক করে দাও।",
    },
    {
      labelEn: "Field visit checklist",
      labelBn: "ফিল্ড ভিজিটের চেকলিস্ট তৈরি করো",
      promptEn: "Draft a comprehensive checklist for a field inspection visit to a LEEDO location.",
      promptBn: "লিডোর কোনো ফিল্ড লোকেশন পরিদর্শনের জন্য একটি পূর্ণাঙ্গ প্রস্তুতি ও তদারকি চেকলিস্ট তৈরি করে দাও।",
    },
    {
      labelEn: "Check overdue & blocked tasks",
      labelBn: "আমার বকেয়া বা আটকে থাকা কাজ আছে?",
      promptEn: "Check if I have any overdue or blocked tasks and suggest next actions.",
      promptBn: "আমার কি কোনো বকেয়া বা আটকে থাকা কাজ আছে? সেগুলো সমাধানের পরামর্শ দাও।",
    },
  ];

  if (!currentUser) return null;

  return (
    <>
      {/* Floating Toggle Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 group cursor-pointer border border-red-500"
          title={t("aiAssistantTitle")}
        >
          <Sparkles className="w-5 h-5 animate-pulse text-amber-200" />
          <span className="text-xs font-bold pr-1 hidden sm:inline-block">
            {language === "bn" ? "লিডো এআই সহকারী" : "LEEDO AI Assistant"}
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute top-1 right-1 border-2 border-white"></span>
        </button>
      )}

      {/* Floating Assistant Window */}
      {isOpen && (
        <div
          className={`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col transition-all overflow-hidden ${
            isMinimized
              ? "w-80 h-14"
              : "w-[94vw] sm:w-[440px] md:w-[480px] h-[600px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3.5 px-4 flex items-center justify-between shrink-0 select-none border-b border-slate-700">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold truncate flex items-center gap-1.5 text-white">
                  <span>{t("aiAssistantTitle")}</span>
                  <span className="text-[9px] font-mono font-normal px-1 py-0.2 bg-red-950/80 text-red-300 rounded border border-red-700/50">
                    LEEDO Official
                  </span>
                </h3>
                <p className="text-[10px] text-slate-300 truncate font-mono">
                  EID: {currentUser.eid} · {currentUser.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:text-white rounded hover:bg-slate-700/50 transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:text-white rounded hover:bg-slate-700/50 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Context Banner */}
              <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {language === "bn"
                      ? `${currentUser.department} · ${currentUser.location}`
                      : `${currentUser.department} · ${currentUser.location}`}
                  </span>
                </div>
                <button
                  onClick={handleClearChat}
                  className="text-slate-400 hover:text-rose-600 p-1 transition-colors flex items-center gap-1 text-[10px]"
                  title="Clear conversation"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t("clearChat")}</span>
                </button>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-slate-50/50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.sender === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        msg.sender === "user"
                          ? "bg-slate-800 text-white"
                          : msg.sender === "system"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <User className="w-3.5 h-3.5" />
                      ) : msg.sender === "system" ? (
                        <AlertCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-red-600 text-white rounded-tr-xs shadow-xs"
                          : msg.sender === "system"
                          ? "bg-rose-50 border border-rose-200 text-rose-800 text-[11px]"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs whitespace-pre-wrap"
                      }`}
                    >
                      {msg.text}
                      <div
                        className={`text-[9px] mt-1 text-right ${
                          msg.sender === "user" ? "text-red-200" : "text-slate-400"
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-3.5 py-2 text-slate-500 shadow-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                      <span className="text-xs">{t("thinking")}</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestion Chips */}
              <div className="p-2 border-t border-slate-200 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      handleSendMessage(language === "bn" ? qp.promptBn : qp.promptEn)
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium rounded-full shrink-0 transition-colors border border-slate-200/80"
                  >
                    {language === "bn" ? qp.labelBn : qp.labelEn}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-slate-200 bg-white shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={t("aiPlaceholder")}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-red-500 text-slate-900 bg-slate-50/50"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="p-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs"
                    title={t("send")}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="mt-1.5 text-[9px] text-center text-slate-400">
                  {language === "bn"
                    ? "লিডো প্রাতিষ্ঠানিক নির্দেশিকা অনুযায়ী দায়িত্বশীল ও তথ্যানুগ পরামর্শ প্রদানকারী"
                    : "Official organizational assistant adhering to LEEDO governance and child-safeguarding ethics"}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
