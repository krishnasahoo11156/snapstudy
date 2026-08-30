import { useAuth } from "./hooks/useAuth";
import { FIREBASE_CONFIGURED } from "./lib/firebase";
import { SUPABASE_CONFIGURED } from "./lib/supabase";
import ResponsiveShell from "./components/layout/ResponsiveShell";
import { useOffline } from "./hooks/useOffline";
import { WifiOff } from "./components/ui/Icons";

// ── Demo Mode (no Firebase/Supabase keys) ─────────────────────────────────────
// Renders without auth — the NavContext inside ResponsiveShell handles routing,
// starting from the Landing Page.
function DemoApp() {
  const isOffline = useOffline();
  return (
    <div className="min-h-screen bg-paper text-ink">
      {isOffline && (
        <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-100 border-b border-amber-200 py-2 px-4 text-amber-800 text-xs font-medium">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline mode — studying cached content</span>
        </div>
      )}
      <ResponsiveShell />
    </div>
  );
}

// ── Authenticated App (Firebase or Supabase configured) ───────────────────────
function AuthenticatedApp() {
  const [user, loading] = useAuth();
  const isOffline = useOffline();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-paper-border" />
            <div className="absolute inset-0 rounded-full border-4 border-t-accent animate-spin" />
          </div>
          <p className="text-sm text-ink-secondary font-medium">Loading StudySnap…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      {isOffline && (
        <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-100 border-b border-amber-200 py-2 px-4 text-amber-800 text-xs font-medium">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline mode — studying cached content</span>
        </div>
      )}
      <ResponsiveShell />
    </div>
  );
}

// ── Root — picks the right app based on configurations ───────────────────────
export default function App() {
  const isConfigured = FIREBASE_CONFIGURED || SUPABASE_CONFIGURED;
  return isConfigured ? <AuthenticatedApp /> : <DemoApp />;
}
