import { supabase, SUPABASE_CONFIGURED } from "./supabase";

/**
 * Image Storage Service — 100% Free & No-Payment-Required
 *
 * Replaces Firebase Cloud Storage (which requires the paid Blaze plan) with a
 * lightweight, free architecture that works directly from browser and Vercel.
 *
 * Supported Storage Strategies:
 * 1. Supabase Storage Bucket: Free direct cloud storage (if VITE_SUPABASE_* are set).
 * 2. Cloudinary Unsigned Upload: Free tier (25GB/month, no credit card required)
 *    Activated automatically if VITE_CLOUDINARY_CLOUD_NAME & VITE_CLOUDINARY_UPLOAD_PRESET are set.
 * 3. Optimized DataURL & IndexedDB Storage: Free, zero-setup default.
 *    Stores compressed, high-density WebP/JPEG data directly in Firestore documents (<200KB)
 *    and caches in IndexedDB for instant offline access.
 */

/**
 * Compress an image File or Blob using HTML5 Canvas to optimal dimension (~1280px) and quality.
 * Produces lightweight (~80-200KB) image for fast AI processing and storage.
 *
 * @param {File | Blob} file
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {number} quality
 * @returns {Promise<{ blob: Blob, dataUrl: string, width: number, height: number }>}
 */
export async function compressImage(file, maxWidth = 1280, maxHeight = 1280, quality = 0.78) {
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
 * Upload photo to free storage provider or return optimized data URL.
 *
 * @param {Blob | File} blob - Image blob
 * @param {string} uid - User ID
 * @param {(progress: number) => void} [onProgress]
 * @param {string} [dataUrl] - Pre-compressed data URL (optional)
 * @returns {Promise<{ downloadUrl: string, storagePath: string }>}
 */
export async function uploadPhotoToStorage(blob, uid = "demo_user", onProgress = null, dataUrl = null) {
  const timestamp = Date.now();
  const storagePath = `${uid}/${timestamp}.jpg`;

  // Strategy 1: Supabase Cloud Storage
  if (SUPABASE_CONFIGURED && supabase) {
    try {
      onProgress?.(25);
      const { data, error } = await supabase.storage
        .from("photos")
        .upload(storagePath, blob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      onProgress?.(75);
      const { data: { publicUrl } } = supabase.storage
        .from("photos")
        .getPublicUrl(storagePath);

      onProgress?.(100);
      return {
        downloadUrl: publicUrl,
        storagePath: storagePath,
      };
    } catch (err) {
      console.warn("[Supabase Storage] Upload failed, falling back:", err);
    }
  }

  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Strategy 1: Cloudinary Unsigned Direct Upload (if configured in Vercel / .env)
  if (cloudinaryCloudName && cloudinaryPreset) {
    try {
      onProgress?.(25);
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", cloudinaryPreset);
      formData.append("folder", `photos/${uid}`);
      formData.append("public_id", `${timestamp}`);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (res.ok) {
        const data = await res.json();
        onProgress?.(100);
        return {
          downloadUrl: data.secure_url || data.url,
          storagePath: data.public_id || storagePath,
        };
      } else {
        console.warn("[Cloudinary] Upload responded with error, using data URL fallback:", await res.text());
      }
    } catch (err) {
      console.warn("[Cloudinary] Upload failed, using data URL fallback:", err);
    }
  }

  // Strategy 2: Instant Optimized Data URL & Firestore Document Storage (100% Free & Zero Setup)
  onProgress?.(50);
  let finalUrl = dataUrl;
  if (!finalUrl) {
    const res = await compressImage(blob);
    finalUrl = res.dataUrl;
  }
  onProgress?.(100);

  return {
    downloadUrl: finalUrl,
    storagePath,
  };
}
