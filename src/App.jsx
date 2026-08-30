import { useAuthState } from "react-firebase-hooks/auth";
import { auth, FIREBASE_CONFIGURED } from "./lib/firebase";
import ResponsiveShell from "./components/layout/ResponsiveShell";
import AuthScreen from "./components/auth/AuthScreen";
import { useOffline } from "./hooks/useOffline";

// ── Demo Mode (no Firebase keys) ─────────────────────────────────────────────
// Rendered when VITE_FIREBASE_* are missing. Skips auth entirely.
function DemoApp() {
  const isOffline = useOffline();
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-violet-600/90 backdrop-blur-sm py-1.5 px-4 text-white text-xs font-semibold">
        <span>🔧</span>
        <span>Demo Mode — add Firebase keys to root .env to enable auth</span>
      </div>
      {isOffline && (
        <div className="fixed top-8 inset-x-0 z-40 flex items-center justify-center gap-2 bg-amber-500/90 backdrop-blur-sm py-2 px-4 text-slate-900 text-sm font-semibold">
          <span>📴</span><span>Offline mode — studying cached cards</span>
        </div>
      )}
      <div className="pt-8">
        <ResponsiveShell />
      </div>
    </div>
  );
}

// ── Authenticated App (Firebase configured) ───────────────────────────────────
// useAuthState is ONLY called here — never with a null auth instance.
function AuthenticatedApp() {
  const [user, loading] = useAuthState(auth);
  const isOffline = useOffline();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-slate-700" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-blue-500 animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Loading SnapStudy…</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {isOffline && (
        <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-500/90 backdrop-blur-sm py-2 px-4 text-slate-900 text-sm font-semibold">
          <span>📴</span>
          <span>Offline mode — studying cached cards</span>
        </div>
      )}
      <ResponsiveShell />
    </div>
  );
}

// ── Root export — picks the right app based on Firebase config ────────────────
export default function App() {
  return FIREBASE_CONFIGURED ? <AuthenticatedApp /> : <DemoApp />;
}

