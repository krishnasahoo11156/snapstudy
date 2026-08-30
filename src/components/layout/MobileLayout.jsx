import { useState } from "react";
import CaptureScreen from "../capture/CaptureScreen";
import StudyDashboard from "../study/StudyDashboard";
import ProfilePanel from "../profile/ProfilePanel";

const TABS = [
  {
    id: "capture",
    label: "Capture",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
    ),
  },
  {
    id: "study",
    label: "Study",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

export default function MobileLayout() {
  const [tab, setTab] = useState("study");

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-slate-100">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {tab === "capture" && <CaptureScreen />}
        {tab === "study" && <StudyDashboard />}
        {tab === "profile" && <ProfilePanel />}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="flex h-16 shrink-0 items-stretch border-t border-slate-700/60 bg-slate-900/95 backdrop-blur-md">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`nav-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-all duration-200 ${
              tab === t.id
                ? "text-blue-400"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className={`transition-transform duration-200 ${tab === t.id ? "scale-110" : ""}`}>
              {t.icon}
            </span>
            <span>{t.label}</span>
            {tab === t.id && (
              <span className="absolute bottom-0 h-0.5 w-12 rounded-full bg-blue-400" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
