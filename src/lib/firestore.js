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

  // Resolve user UID if missing or guest
  let resolvedUid = record.uid;
  if (!resolvedUid || resolvedUid === "guest_user") {
    try {
      if (SUPABASE_CONFIGURED && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) resolvedUid = user.id;
      } else if (firebaseAuth?.currentUser?.uid) {
        resolvedUid = firebaseAuth.currentUser.uid;
      }
    } catch (e) {
      console.warn("Could not retrieve current user for savePhotoRecord:", e);
    }
  }

  // 2. Cloud Supabase Sync
  if (SUPABASE_CONFIGURED && supabase && resolvedUid && resolvedUid !== "guest_user") {
    try {
      const { error } = await supabase
        .from("photos")
        .upsert({
          id: record.id,
          uid: resolvedUid,
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
  if (FIREBASE_CONFIGURED && db && resolvedUid && resolvedUid !== "guest_user" && !SUPABASE_CONFIGURED) {
    try {
      const docRef = doc(db, "photos", record.id);
      const writePromise = setDoc(docRef, {
        ...record,
        uid: resolvedUid,
        createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore sync timeout")), 1500)
      );
      await Promise.race([writePromise, timeoutPromise]);
    } catch (err) {
      console.warn("[Firestore] Cloud sync failed, saved locally:", err?.message || err);
    }
  }
}

/**
 * Get all photo records for a user.
 * Returns local cache immediately or merged with cloud records without hanging.
 * @param {string} uid
 * @returns {Promise<import("../types").PhotoRecord[]>}
 */
export async function getPhotoRecords(uid) {
  // Read local cache first for instant fallback & merge
  let localRecords = [];
  try {
    const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PHOTOS_KEY) || "[]");
    localRecords = uid && uid !== "guest_user"
      ? cached.filter((r) => r.uid === uid || !r.uid)
      : cached;
  } catch {
    localRecords = [];
  }

  // 1. Fetch from Supabase (fast query with short timeout)
  if (SUPABASE_CONFIGURED && supabase && uid && uid !== "guest_user") {
    try {
      const fetchPromise = supabase
        .from("photos")
        .select("*")
        .eq("uid", uid);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase fetch timeout")), 2500)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      if (error) throw error;

      if (data) {
        const cloudRecords = data.map((d) => ({
          id: d.id,
          uid: d.uid,
          originalPhotoUrl: d.original_photo_url,
          originalPhotoPath: d.original_photo_path,
          regions: d.regions,
          cards: d.cards,
          createdAt: d.created_at,
        }));

        // Merge cloud with any local records not yet synced
        const cloudIds = new Set(cloudRecords.map((r) => r.id));
        const unSyncedLocal = localRecords.filter((r) => !cloudIds.has(r.id));
        return [...cloudRecords, ...unSyncedLocal];
      }
    } catch (err) {
      console.warn("[Supabase] Failed to fetch photo records, reading local cache:", err?.message || err);
      return localRecords;
    }
  }

  // 2. Fetch from Cloud Firestore (only if Supabase not used, with strict 1500ms timeout)
  if (FIREBASE_CONFIGURED && db && uid && uid !== "guest_user" && !SUPABASE_CONFIGURED) {
    try {
      const q = query(collection(db, "photos"), where("uid", "==", uid));
      const getPromise = getDocs(q);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore fetch timeout")), 1500)
      );
      const querySnapshot = await Promise.race([getPromise, timeoutPromise]);
      const records = [];
      querySnapshot.forEach((d) => {
        records.push({ id: d.id, ...d.data() });
      });
      if (records.length > 0) {
        const cloudIds = new Set(records.map((r) => r.id));
        const unSyncedLocal = localRecords.filter((r) => !cloudIds.has(r.id));
        return [...records, ...unSyncedLocal];
      }
    } catch (err) {
      console.warn("[Firestore] Failed to fetch photo records, reading local cache:", err?.message || err);
    }
  }

  // Local fallback
  return localRecords;
}

/**
 * Get a single photo record by ID.
 * @param {string} id
 * @returns {Promise<import("../types").PhotoRecord | null>}
 */
export async function getPhotoRecord(id) {
  // Check local cache first
  try {
    const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PHOTOS_KEY) || "[]");
    const local = cached.find((r) => r.id === id);
    if (local) return local;
  } catch {
    // continue to cloud
  }

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
      console.warn("[Supabase] Failed to fetch photo record:", err?.message || err);
    }
  }

  // 2. Fetch from Cloud Firestore
  if (FIREBASE_CONFIGURED && db && id && !SUPABASE_CONFIGURED) {
    try {
      const docSnapPromise = getDoc(doc(db, "photos", id));
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore getDoc timeout")), 1500)
      );
      const docSnap = await Promise.race([docSnapPromise, timeoutPromise]);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (err) {
      console.warn("[Firestore] Failed to fetch photo record:", err?.message || err);
    }
  }

  return null;
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
  // 1. Remove from local storage cache immediately
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
      console.warn("[Supabase] Failed to delete photo record:", err?.message || err);
    }
  }

  // 3. Remove from Cloud Firestore
  if (FIREBASE_CONFIGURED && db && id && !SUPABASE_CONFIGURED) {
    try {
      const docRef = doc(db, "photos", id);
      const delPromise = deleteDoc(docRef);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore delete timeout")), 1500)
      );
      await Promise.race([delPromise, timeoutPromise]);
    } catch (err) {
      console.warn("[Firestore] Failed to delete photo record:", err?.message || err);
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
