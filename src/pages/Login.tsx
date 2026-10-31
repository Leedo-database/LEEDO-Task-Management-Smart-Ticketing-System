import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Lock, AlertCircle, ArrowRight, Languages } from "lucide-react";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [eid, setEid] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!eid.trim()) {
      setError(language === "bn" ? "অনুগ্রহ করে আপনার কর্মী আইডি (EID) লিখুন।" : "Please enter your Employee ID (EID).");
      return;
    }
    if (!password) {
      setError(language === "bn" ? "অনুগ্রহ করে আপনার পাসওয়ার্ড লিখুন।" : "Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const result = await login(eid, password);
      if (!result.success) {
        setError(result.error || (language === "bn" ? "প্রবেশ ব্যর্থ হয়েছে।" : "Authentication failed."));
      }
    } catch {
      setError(language === "bn" ? "লগইনে একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।" : "An unexpected error occurred during sign-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 relative">
        {/* Language Switcher in Login Card */}
        <div className="absolute top-4 right-4 flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`px-2 py-0.5 rounded transition-colors ${
              language === "en" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage("bn")}
            className={`px-2 py-0.5 rounded transition-colors ${
              language === "bn" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            বাং
          </button>
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="/public/assets/aistudio/Logo-of-LEEDO-Short-01-746x1024_a345b8a2.png"
            alt="LEEDO Logo"
            className="h-20 w-auto object-contain mb-3"
          />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {t("appName")}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Local Education & Economic Development Organization (LEEDO)
          </p>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {t("orgSubtitle")}
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {language === "bn" ? "কর্মী আইডি (EID)" : "Employee ID (EID)"}
            </label>
            <div className="relative">
              <input
                type="text"
                value={eid}
                onChange={(e) => setEid(e.target.value)}
                placeholder={language === "bn" ? "যেমন: 1001, 1002, 1057" : "e.g. 1001, 1002, 1057"}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {language === "bn"
                ? "প্রাথমিক পাসওয়ার্ড আপনার কর্মী আইডি (EID)-এর সমান।"
                : "Onboarding default: initial password equals your Employee ID."}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {language === "bn" ? "পাসওয়ার্ড" : "Password"}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={language === "bn" ? "পাসওয়ার্ড দিন" : "Enter password"}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {loading
              ? (language === "bn" ? "যাচাই করা হচ্ছে..." : "Verifying...")
              : (language === "bn" ? "EID দিয়ে সাইন ইন করুন" : "Sign In with EID")}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security Notice & Organization Guidelines */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            {language === "bn"
              ? "সংস্থার নিরাপত্তা বিধিমতে আপনার নির্ধারিত কর্মী আইডি (EID) এবং পাসওয়ার্ড দিয়ে প্রবেশ করুন।"
              : "Sign in using your assigned Employee ID (EID) and secure organizational password."}
          </p>
        </div>
      </div>
    </div>
  );
};

export const FirstLoginPasswordChange: React.FC = () => {
  const { currentUser, changePassword, logout } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword === currentUser?.eid) {
      setError("Security Policy: New password cannot be identical to your Employee ID.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await changePassword(newPassword);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to update password.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Mandatory First-Login Password Change</h2>
          <p className="text-xs text-slate-500 mt-1">
            Hello, <strong className="text-slate-800">{currentUser?.name}</strong> (EID: {currentUser?.eid}).
            Organization security policy requires creating a personal password before continuing.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password (minimum 6 characters)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              {loading ? "Updating..." : "Save Password & Enter"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
            >
              Cancel / Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
