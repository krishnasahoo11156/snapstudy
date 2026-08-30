import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, FIREBASE_CONFIGURED } from "./firebase";

/**
 * Compress an image File or Blob using HTML5 Canvas to max dimension (e.g. 1920px) and max size (~2MB).
 *
 * @param {File | Blob} file
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {number} quality
 * @returns {Promise<{ blob: Blob, dataUrl: string, width: number, height: number }>}
 */
export async function compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas toBlob failed"));
              return;
            }
            resolve({ blob, dataUrl, width, height });
          },
          "image/jpeg",
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a photo blob to Firebase Storage.
 *
 * @param {Blob | File} blob
 * @param {string} uid - User ID
 * @param {(progress: number) => void} [onProgress]
 * @returns {Promise<{ downloadUrl: string, storagePath: string }>}
 */
export async function uploadPhotoToStorage(blob, uid = "demo_user", onProgress = null) {
  const timestamp = Date.now();
  const storagePath = `photos/${uid}/${timestamp}.jpg`;

  if (FIREBASE_CONFIGURED && storage) {
    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: "image/jpeg",
      });

      return await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            onProgress?.(progress);
          },
          (error) => {
            console.warn("[Firebase Storage] Upload failed, falling back to local URL:", error);
            reject(error);
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress?.(100);
            resolve({ downloadUrl, storagePath });
          }
        );
      });
    } catch (err) {
      console.warn("Storage upload failed, fallback to local URL:", err);
    }
  }

  // Fallback for demo mode or storage errors: create local object URL
  onProgress?.(100);
  const localUrl = URL.createObjectURL(blob);
  return { downloadUrl: localUrl, storagePath };
}
