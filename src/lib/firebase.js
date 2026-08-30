import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

export const FIREBASE_CONFIGURED = !!apiKey;

let auth, db, googleProvider;

if (FIREBASE_CONFIGURED) {
  const firebaseConfig = {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
  googleProvider = new GoogleAuthProvider();
} else {
  console.warn(
    "[SnapStudy] Firebase not configured — add VITE_FIREBASE_* to your root .env file.\n" +
    "Running in DEMO MODE: auth is bypassed, using mock data only."
  );
}

export { auth, db, googleProvider };

