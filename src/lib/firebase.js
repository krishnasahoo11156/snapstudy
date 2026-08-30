import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

export const FIREBASE_CONFIGURED = !!apiKey;

let auth, db, storage, googleProvider;

if (FIREBASE_CONFIGURED) {
  const firebaseConfig = {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();

  // Enable offline persistence for Firestore
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Firestore persistence: multiple tabs open — enabled in first tab only.");
    } else if (err.code === "unimplemented") {
      console.warn("Firestore persistence: browser does not support IndexedDB.");
    }
  });
} else {
  console.warn(
    "[SnapStudy] Firebase not configured — add VITE_FIREBASE_* to your root .env file.\n" +
    "Running in DEMO MODE: auth is bypassed, using mock data only."
  );
}

export { auth, db, storage, googleProvider };
