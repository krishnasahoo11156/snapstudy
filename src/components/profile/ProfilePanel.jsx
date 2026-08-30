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
    <div className="flex min-h-full flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-sm">
        <h2 className="mb-6 text-xl font-bold text-slate-100">Profile</h2>

        {/* Avatar */}
        <div className="glass-card mb-6 flex items-center gap-4 rounded-2xl p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold text-white shadow-lg">
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-slate-100 truncate">{user?.displayName || "SnapStudy User"}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* UID for debugging */}
        <div className="glass-card mb-6 rounded-2xl p-4">
          <p className="text-xs text-slate-500 font-mono break-all">uid: {user?.uid}</p>
        </div>

        {/* Sign Out */}
        <button
          id="profile-signout-btn"
          onClick={handleSignOut}
          className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
