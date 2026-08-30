import { useState, useRef, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { supabase, SUPABASE_CONFIGURED } from "../../lib/supabase";
import { useNav } from "../../context/NavContext";
import { Flame, FileText, Camera, Palette, Lock } from "./Icons";

export default function Header({ showSearch = true }) {
  const { navigate } = useNav();
  const [user] = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef(null);

  // Close panels on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest("#notif-panel")) setNotifOpen(false);
      if (!e.target.closest("#profile-panel")) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    try {
      if (SUPABASE_CONFIGURED && supabase) {
        await supabase.auth.signOut();
      } else if (auth) {
        await signOut(auth);
      }
      setProfileOpen(false);
      navigate("landing");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const userDisplayName = user?.user_metadata?.full_name || user?.displayName || (user?.email ? user.email.split("@")[0] : "Guest Student");
  const userInitial = userDisplayName?.[0]?.toUpperCase() || "U";
  const userEmail = user?.email || "Using Demo Mode";

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
                  { icon: <Flame className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />, text: "You're on a 7-day streak! Keep going.", time: "Just now" },
                  { icon: <FileText className="w-4 h-4 text-blue-500 shrink-0" />, text: "Notes and flashcards ready to study.", time: "Recent" },
                ].map((n, i) => (
                  <div key={i} className="flex gap-3 items-start p-2.5 rounded-xl hover:bg-paper-warm cursor-pointer">
                    <div className="mt-0.5">{n.icon}</div>
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

        {/* Capture Quick Action */}
        <button
          id="header-capture-btn"
          onClick={() => navigate("capture-image")}
          title="Upload or Scan Notes"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-paper-border bg-white text-xs font-semibold text-ink hover:bg-paper-warm transition-colors shadow-sm ml-1"
        >
          <Camera className="w-3.5 h-3.5 text-accent" />
          <span className="hidden sm:inline">Scan Notes</span>
        </button>

        {/* Profile Dropdown */}
        <div id="profile-panel" className="relative ml-1">
          <button
            id="header-avatar"
            onClick={() => setProfileOpen(o => !o)}
            className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-xl hover:bg-paper-warm transition-colors"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={userDisplayName}
                className="w-8 h-8 rounded-full object-cover border border-paper-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                {userInitial}
              </div>
            )}
            <svg className="w-3.5 h-3.5 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-11 w-64 bg-white rounded-2xl shadow-panel border border-paper-border p-3 animate-slide-down">
              {/* User info */}
              <div className="flex items-center gap-3 p-2.5 border-b border-paper-border mb-2">
                <div className="w-10 h-10 rounded-full bg-accent text-white font-bold text-base flex items-center justify-center shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink truncate">{userDisplayName}</p>
                  <p className="text-xs text-ink-tertiary truncate">{userEmail}</p>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="space-y-1">
                <button
                  onClick={() => { setProfileOpen(false); navigate("canvas"); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-paper-warm transition-colors text-left"
                >
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span>My Study Canvas</span>
                </button>
                <button
                  onClick={() => { setProfileOpen(false); navigate("capture-image"); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-paper-warm transition-colors text-left"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Capture & Ingest Notes</span>
                </button>

                <div className="h-px bg-paper-border my-1.5" />

                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { setProfileOpen(false); navigate("login"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-accent hover:bg-accent/10 transition-colors text-left"
                  >
                    <Lock className="w-4 h-4 text-accent" />
                    <span>Sign In / Create Account</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
