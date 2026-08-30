import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth as firebaseAuth } from "../lib/firebase";
import { supabase, SUPABASE_CONFIGURED } from "../lib/supabase";

/**
 * Convenience wrapper around auth state listeners.
 * Supports Supabase auth with Firebase Auth fallback.
 * Returns [user, loading, error].
 */
export function useAuth() {
  // Always call useAuthState to satisfy the Rules of Hooks
  const [fbUser, fbLoading, fbError] = useAuthState(firebaseAuth);

  const [sbUser, setSbUser] = useState(null);
  const [sbLoading, setSbLoading] = useState(true);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSbUser(session?.user ?? null);
      setSbLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSbUser(session?.user ?? null);
      setSbLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (SUPABASE_CONFIGURED && supabase) {
    return [sbUser, sbLoading, undefined];
  }

  return [fbUser, fbLoading, fbError];
}
