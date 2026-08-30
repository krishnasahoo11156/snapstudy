import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, FIREBASE_CONFIGURED } from "./firebase";

const LOCAL_STORAGE_PHOTOS_KEY = "snapstudy_cached_photos";
const LOCAL_STORAGE_QUIZZES_KEY = "snapstudy_cached_quizzes";

/**
 * Save a PhotoRecord (including regions & generated cards) to Firestore.
 * Fallbacks to localStorage if running in demo mode or offline.
 *
 * @param {import("../types").PhotoRecord} record
 * @returns {Promise<void>}
 */
export async function savePhotoRecord(record) {
  // 1. Instant local persistence
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PHOTOS_KEY) || "[]");
    const updated = [record, ...existing.filter((p) => p.id !== record.id)];
    localStorage.setItem(LOCAL_STORAGE_PHOTOS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to cache photo record locally:", e);
  }

  // 2. Cloud Firestore sync with 2.5s safety timeout
  if (FIREBASE_CONFIGURED && db && record.uid && record.uid !== "guest_user") {
    try {
      const docRef = doc(db, "photos", record.id);
      const writePromise = setDoc(docRef, {
        ...record,
        createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore sync timeout (offline/pending)")), 2500)
      );
      await Promise.race([writePromise, timeoutPromise]);
    } catch (err) {
      console.warn("[Firestore] Cloud sync skipped/failed, saved locally:", err?.message || err);
    }
  }
}

/**
 * Get all photo records for a user.
 * @param {string} uid
 * @returns {Promise<import("../types").PhotoRecord[]>}
 */
export async function getPhotoRecords(uid) {
  if (FIREBASE_CONFIGURED && db && uid) {
    try {
      const q = query(collection(db, "photos"), where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      const records = [];
      querySnapshot.forEach((d) => {
        records.push({ id: d.id, ...d.data() });
      });
      if (records.length > 0) return records;
    } catch (err) {
      console.warn("[Firestore] Failed to fetch photo records from cloud, reading local cache:", err);
    }
  }

  // Local fallback
  try {
    const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PHOTOS_KEY) || "[]");
    return uid ? cached.filter((r) => r.uid === uid || !r.uid) : cached;
  } catch {
    return [];
  }
}

/**
 * Get a single photo record by ID.
 * @param {string} id
 * @returns {Promise<import("../types").PhotoRecord | null>}
 */
export async function getPhotoRecord(id) {
  if (FIREBASE_CONFIGURED && db) {
    try {
      const docSnap = await getDoc(doc(db, "photos", id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (err) {
      console.warn("[Firestore] Failed to fetch photo record from cloud:", err);
    }
  }

  try {
    const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PHOTOS_KEY) || "[]");
    return cached.find((r) => r.id === id) || null;
  } catch {
    return null;
  }
}

/**
 * Save a QuizSession to Firestore.
 * @param {import("../types").QuizSession} session
 * @returns {Promise<void>}
 */
export async function saveQuizSession(session) {
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUIZZES_KEY) || "[]");
    const updated = [session, ...existing.filter((s) => s.id !== session.id)];
    localStorage.setItem(LOCAL_STORAGE_QUIZZES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to cache quiz session locally:", e);
  }

  if (FIREBASE_CONFIGURED && db) {
    try {
      const docRef = doc(db, "quizSessions", session.id);
      await setDoc(docRef, {
        ...session,
        startedAt: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt,
        completedAt: session.completedAt instanceof Date ? session.completedAt.toISOString() : session.completedAt,
      });
    } catch (err) {
      console.warn("[Firestore] Failed to save quiz session to cloud:", err);
    }
  }
}
