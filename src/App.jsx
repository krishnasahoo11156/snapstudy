import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./lib/firebase";
import ResponsiveShell from "./components/layout/ResponsiveShell";
import AuthScreen from "./components/auth/AuthScreen";
import { useOffline } from "./hooks/useOffline";

function App() {
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

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Offline Banner */}
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

export default App;
