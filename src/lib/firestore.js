import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth as firebaseAuth, FIREBASE_CONFIGURED } from "./firebase";
import { supabase, SUPABASE_CONFIGURED } from "./supabase";

const LOCAL_STORAGE_PHOTOS_KEY = "snapstudy_cached_photos";
const LOCAL_STORAGE_QUIZZES_KEY = "snapstudy_cached_quizzes";

/**
 * Save a PhotoRecord (including regions & generated cards) to Firestore or Supabase.
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

  // 2. Cloud Supabase Sync
  if (SUPABASE_CONFIGURED && supabase && record.uid && record.uid !== "guest_user") {
    try {
      const { error } = await supabase
        .from("photos")
        .upsert({
          id: record.id,
          uid: record.uid,
          original_photo_url: record.originalPhotoUrl,
          original_photo_path: record.originalPhotoPath,
          regions: record.regions || [],
          cards: record.cards || [],
          created_at: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
        });
      if (error) throw error;
      return;
    } catch (err) {
      console.warn("[Supabase] Cloud sync failed, saved locally:", err?.message || err);
    }
  }

  // 3. Cloud Firestore sync
  if (FIREBASE_CONFIGURED && db && record.uid && record.uid !== "guest_user") {
    try {
      const docRef = doc(db, "photos", record.id);
      const writePromise = setDoc(docRef, {
        ...record,
        createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore sync timeout")), 2500)
      );
      await Promise.race([writePromise, timeoutPromise]);
    } catch (err) {
      console.warn("[Firestore] Cloud sync failed, saved locally:", err?.message || err);
    }
  }
}

/**
 * Get all photo records for a user.
 * @param {string} uid
 * @returns {Promise<import("../types").PhotoRecord[]>}
 */
export async function getPhotoRecords(uid) {
  // 1. Fetch from Supabase
  if (SUPABASE_CONFIGURED && supabase && uid) {
    try {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("uid", uid);
      if (error) throw error;

      if (data && data.length > 0) {
        return data.map(d => ({
          id: d.id,
          uid: d.uid,
          originalPhotoUrl: d.original_photo_url,
          originalPhotoPath: d.original_photo_path,
          regions: d.regions,
          cards: d.cards,
          createdAt: d.created_at,
        }));
      }
    } catch (err) {
      console.warn("[Supabase] Failed to fetch photo records, reading local cache:", err);
    }
  }

  // 2. Fetch from Cloud Firestore
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
      console.warn("[Firestore] Failed to fetch photo records, reading local cache:", err);
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
  // 1. Fetch from Supabase
  if (SUPABASE_CONFIGURED && supabase && id) {
    try {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      if (data) {
        return {
          id: data.id,
          uid: data.uid,
          originalPhotoUrl: data.original_photo_url,
          originalPhotoPath: data.original_photo_path,
          regions: data.regions,
          cards: data.cards,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn("[Supabase] Failed to fetch photo record:", err);
    }
  }

  // 2. Fetch from Cloud Firestore
  if (FIREBASE_CONFIGURED && db && id) {
    try {
      const docSnap = await getDoc(doc(db, "photos", id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (err) {
      console.warn("[Firestore] Failed to fetch photo record:", err);
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
 * Delete a photo record and its associated cards by ID.
 * Removes from localStorage, Cloud Firestore, and Supabase.
 *
 * @param {string} id
 * @param {string} [uid]
 * @returns {Promise<void>}
 */
export async function deletePhotoRecord(id, uid) {
  // 1. Remove from local storage cache
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PHOTOS_KEY) || "[]");
    const updated = existing.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_PHOTOS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to remove photo record locally:", e);
  }

  // 2. Remove from Supabase
  if (SUPABASE_CONFIGURED && supabase && id) {
    try {
      const record = await getPhotoRecord(id);
      if (record && record.originalPhotoPath) {
        await supabase.storage
          .from("photos")
          .remove([record.originalPhotoPath]);
      }

      const { error } = await supabase
        .from("photos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.warn("[Supabase] Failed to delete photo record:", err);
    }
  }

  // 3. Remove from Cloud Firestore
  if (FIREBASE_CONFIGURED && db && id) {
    try {
      const docRef = doc(db, "photos", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("[Firestore] Failed to delete photo record:", err);
    }
  }
}

/**
 * Save a QuizSession to Firestore or Supabase.
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

  // Resolve user UID
  let resolvedUid = session.uid;
  if (!resolvedUid) {
    try {
      if (SUPABASE_CONFIGURED && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        resolvedUid = user?.id;
      } else if (firebaseAuth) {
        resolvedUid = firebaseAuth.currentUser?.uid;
      }
    } catch (e) {
      console.warn("Could not retrieve current user for quiz:", e);
    }
  }

  // Save to Supabase
  if (SUPABASE_CONFIGURED && supabase && resolvedUid) {
    try {
      const { error } = await supabase
        .from("quiz_sessions")
        .upsert({
          id: session.id,
          deck_id: session.deckId,
          score_percent: session.scorePercent,
          started_at: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt,
          completed_at: session.completedAt instanceof Date ? session.completedAt.toISOString() : session.completedAt,
          responses: session.responses || [],
          uid: resolvedUid,
        });
      if (error) throw error;
      return;
    } catch (err) {
      console.warn("[Supabase] Failed to save quiz session:", err);
    }
  }

  // Save to Firestore
  if (FIREBASE_CONFIGURED && db) {
    try {
      const docRef = doc(db, "quizSessions", session.id);
      await setDoc(docRef, {
        ...session,
        startedAt: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt,
        completedAt: session.completedAt instanceof Date ? session.completedAt.toISOString() : session.completedAt,
      });
    } catch (err) {
      console.warn("[Firestore] Failed to save quiz session:", err);
    }
  }
}
