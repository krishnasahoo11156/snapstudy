import { useState } from "react";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { useNav } from "../../context/NavContext";

/**
 * AuthScreen — Login + Signup in a minimal white card.
 * Apple-quality onboarding aesthetic.
 * All Firebase auth logic preserved from original.
 */
export default function AuthScreen({ initialMode = "signin" }) {
  const { navigate } = useNav();
  const [mode, setMode] = useState(initialMode); // "signin" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("canvas");
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        console.log("[Auth] Popup closed or cancelled by user.");
        return;
      }
      console.warn("[Auth Google Error]", err);
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("canvas");
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // Demo mode: skip auth entirely
  const handleDemoSkip = () => navigate("canvas");

  return (
    <div className="min-h-screen bg-paper-warm flex items-center justify-center p-4">
      {/* Subtle background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-note-yellow opacity-30 blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-note-lavender opacity-30 blur-3xl translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Back to landing */}
        <button
          onClick={() => navigate("landing")}
          className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-ink rounded-2xl flex items-center justify-center mb-3 shadow-sm">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 4H8a2 2 0 00-2 2v14l6-3 6 3V6a2 2 0 00-2-2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ink">StudySnap</h1>
          <p className="text-sm text-ink-tertiary mt-1">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-paper-border shadow-card p-8">
          {/* Google Sign-in */}
          <button
            id="auth-google-btn"
            onClick={handleGoogle}
            disabled={loading}
            className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border border-paper-border px-4 py-3 text-sm font-medium text-ink transition-all hover:bg-paper-warm hover:border-ink-light disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-paper-border" />
            <span className="text-xs text-ink-tertiary">or</span>
            <div className="h-px flex-1 bg-paper-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-medium text-ink-secondary mb-1.5">
                  Full name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-paper-border bg-paper-warm px-4 py-3 text-sm text-ink placeholder-ink-tertiary outline-none transition focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent/20"
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-ink-secondary mb-1.5">
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-paper-border bg-paper-warm px-4 py-3 text-sm text-ink placeholder-ink-tertiary outline-none transition focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent/20"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="block text-xs font-medium text-ink-secondary mb-1.5">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-xl border border-paper-border bg-paper-warm px-4 py-3 text-sm text-ink placeholder-ink-tertiary outline-none transition focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent/20"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-600">
                {error}
              </div>
            )}

            <button
              id="auth-email-btn"
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-ink px-4 py-3.5 text-sm font-semibold text-white hover:bg-ink/80 disabled:opacity-50 transition-all"
            >
              {loading ? "Loading…" : mode === "signup" ? "Create account" : "Continue"}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-5 text-center text-xs text-ink-tertiary">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              id="auth-mode-toggle"
              type="button"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
              className="text-accent font-medium hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Demo skip */}
        <div className="mt-4 text-center">
          <button
            id="auth-demo-skip"
            onClick={handleDemoSkip}
            className="text-xs text-ink-tertiary hover:text-ink transition-colors underline underline-offset-2"
          >
            Skip for now and explore demo →
          </button>
        </div>
      </div>
    </div>
  );
}
