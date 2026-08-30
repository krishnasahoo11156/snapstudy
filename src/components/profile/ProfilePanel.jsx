import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "../../hooks/useAuth";
import { supabase, SUPABASE_CONFIGURED } from "../../lib/supabase";

export default function ProfilePanel() {
  const [user] = useAuth();

  const handleSignOut = async () => {
    try {
      if (SUPABASE_CONFIGURED && supabase) {
        await supabase.auth.signOut();
      } else {
        await signOut(auth);
      }
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.displayName || "SnapStudy User";
  const userInitial = displayName[0]?.toUpperCase() || "U";
  const userEmail = user?.email || "N/A";
  const userUid = user?.id || user?.uid || "N/A";

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-6 animate-fade-in bg-paper-warm">
      <div className="w-full max-w-sm">
        <h2 className="mb-6 text-xl font-bold text-ink">Profile</h2>

        {/* Avatar */}
        <div className="bg-white border border-paper-border shadow-card mb-6 flex items-center gap-4 rounded-3xl p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-white shadow-sm">
            {userInitial}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-ink truncate">{displayName}</p>
            <p className="text-xs text-ink-secondary truncate">{userEmail}</p>
          </div>
        </div>

        {/* UID for debugging */}
        <div className="bg-white border border-paper-border shadow-card mb-6 rounded-2xl p-4">
          <p className="text-xs text-ink-tertiary font-mono break-all">uid: {userUid}</p>
        </div>

        {/* Sign Out */}
        <button
          id="profile-signout-btn"
          onClick={handleSignOut}
          className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors shadow-sm"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
