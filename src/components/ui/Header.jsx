import { useState, useRef, useEffect } from "react";
import { useNav } from "../../context/NavContext";

export default function Header({ showSearch = true }) {
  const { navigate } = useNav();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef(null);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest("#notif-panel")) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 px-6 py-3 bg-white/90 backdrop-blur-md border-b border-paper-border">
      {/* Logo */}
      <button
        id="header-logo"
        onClick={() => navigate("canvas")}
        className="flex items-center gap-2 shrink-0 group"
      >
        <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 4H8a2 2 0 00-2 2v14l6-3 6 3V6a2 2 0 00-2-2z"/>
          </svg>
        </div>
        <span className="text-base font-bold text-ink tracking-tight group-hover:text-accent transition-colors">
          StudySnap
        </span>
      </button>

      {/* Search */}
      {showSearch && (
        <div className="flex-1 max-w-xl mx-auto">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all ${
            searchFocused
              ? "border-accent bg-white shadow-sm ring-1 ring-accent/20"
              : "border-paper-border bg-paper-warm"
          }`}>
            <svg className="w-4 h-4 text-ink-tertiary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search your notes, folders, flashcards..."
              className="flex-1 bg-transparent text-sm text-ink placeholder-ink-tertiary outline-none"
            />
            {searchVal && (
              <button onClick={() => setSearchVal("")} className="text-ink-tertiary hover:text-ink">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <span className="text-xs text-ink-tertiary font-medium hidden sm:block bg-paper-border px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </div>
        </div>
      )}

      {/* Right controls */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Notifications */}
        <div id="notif-panel" className="relative">
          <button
            id="header-notif"
            onClick={() => setNotifOpen(o => !o)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-paper-warm text-ink-secondary transition-colors relative"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border border-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-11 w-72 bg-white rounded-2xl shadow-panel border border-paper-border p-4 animate-slide-down">
              <p className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-3">Notifications</p>
              <div className="space-y-3">
                {[
                  { icon: "🔥", text: "You're on a 7-day streak! Keep going.", time: "Just now" },
                  { icon: "📝", text: "New flashcards generated for Chapter 1.", time: "2h ago" },
                  { icon: "🎯", text: "Quiz complete! Score: 8/10", time: "Yesterday" },
                ].map((n, i) => (
                  <div key={i} className="flex gap-3 items-start p-2.5 rounded-xl hover:bg-paper-warm cursor-pointer">
                    <span className="text-lg">{n.icon}</span>
                    <div>
                      <p className="text-sm text-ink leading-snug">{n.text}</p>
                      <p className="text-xs text-ink-tertiary mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button
          id="header-help"
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-paper-warm text-ink-secondary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
          </svg>
        </button>

        {/* Avatar */}
        <button
          id="header-avatar"
          className="flex items-center gap-1.5 ml-1 pl-2 pr-1 py-1 rounded-xl hover:bg-paper-warm transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-semibold">
            N
          </div>
          <svg className="w-3.5 h-3.5 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </header>
  );
}
