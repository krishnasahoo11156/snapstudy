import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";

/**
 * Convenience wrapper around react-firebase-hooks/auth.
 * Returns [user, loading, error].
 *
 * @returns {[import("firebase/auth").User|null, boolean, Error|undefined]}
 */
export function useAuth() {
  return useAuthState(auth);
}
