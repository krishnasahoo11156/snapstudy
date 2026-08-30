import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "../../hooks/useAuth";

export default function ProfilePanel() {
  const [user] = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-6 animate-fade-in bg-paper-warm">
      <div className="w-full max-w-sm">
        <h2 className="mb-6 text-xl font-bold text-ink">Profile</h2>

        {/* Avatar */}
        <div className="bg-white border border-paper-border shadow-card mb-6 flex items-center gap-4 rounded-3xl p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-white shadow-sm">
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-ink truncate">{user?.displayName || "SnapStudy User"}</p>
            <p className="text-xs text-ink-secondary truncate">{user?.email}</p>
          </div>
        </div>

        {/* UID for debugging */}
        <div className="bg-white border border-paper-border shadow-card mb-6 rounded-2xl p-4">
          <p className="text-xs text-ink-tertiary font-mono break-all">uid: {user?.uid}</p>
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
