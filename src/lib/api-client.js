/** @import { ApiResponse, DetectRegionsResponse, GenerateCardsResponse, Region, RemediationPayload, RemediationResult } from "../types" */

import {
  generateMockRegions,
  generateMockCards,
  generateMockRemediation,
} from "../data/mock-data";

const RAW_URL = import.meta.env.VITE_API_URL || "https://snapstudy-b63k.onrender.com/api";
const API_BASE = RAW_URL.endsWith("/api") ? RAW_URL : `${RAW_URL.replace(/\/+$/, "")}/api`;

// Default to real backend; can be toggled by UI or when offline
let mockMode = false;

export function setMockMode(enabled) {
  mockMode = Boolean(enabled);
}

export function isMockMode() {
  return mockMode;
}

/**
 * Core POST helper — calls real Express backend or returns mock data when mockMode is true.
 * @param {string} path
 * @param {object} body
 * @param {number} [timeoutMs=75000]
 * @returns {Promise<ApiResponse>}
 */
async function post(path, body, timeoutMs = 75000) {
  if (mockMode) {
    await new Promise((r) => setTimeout(r, 400));
    if (path.includes("ingest")) {
      return { success: true, data: { regions: generateMockRegions().regions, cards: generateMockCards().cards } };
    }
    if (path.includes("detect-regions")) return { success: true, data: generateMockRegions() };
    if (path.includes("generate-cards")) return { success: true, data: generateMockCards() };
    if (path.includes("remediate")) return { success: true, data: generateMockRemediation() };
    return { success: false, error: "Unknown mock path" };
  }

  const targetUrl = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error(`[api-client] API ${path} returned HTTP ${res.status}:`, errJson);
      return {
        success: false,
        error: errJson.error || `Server returned HTTP ${res.status}`,
      };
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      console.error(`[api-client] Request timed out after ${timeoutMs}ms calling ${path}`);
      return {
        success: false,
        error: "Request timed out. The backend server might be starting up (cold start). Please try again in a few moments.",
      };
    }

    console.error(`[api-client] Network error calling ${targetUrl}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Typed API surface — import this everywhere, never call fetch() directly.
 */
export const api = {
  /**
   * Fast Ingestion: Detect regions AND generate flashcards in a single AI pass (2-3x speedup).
   * @param {string} imageBase64 - Base64-encoded JPEG
   * @returns {Promise<ApiResponse & { data?: { regions: Region[], cards: Flashcard[] } }>}
   */
  ingest: async (imageBase64) => {
    const res = await post("/ingest", { image: imageBase64 });
    if (res.success && res.data?.regions && res.data?.cards) {
      return res;
    }
    // If it was a network error or 5xx, do not duplicate the failure with 2 sequential calls
    if (!res.success && res.error && (res.error.includes("Failed to fetch") || res.error.includes("timed out"))) {
      return res;
    }

    // Fallback to 2-step pipeline if needed
    const detectRes = await api.detectRegions(imageBase64);
    if (!detectRes.success || !detectRes.data?.regions) return detectRes;
    const cardsRes = await api.generateCards(detectRes.data.regions, imageBase64);
    if (!cardsRes.success || !cardsRes.data?.cards) return cardsRes;
    return {
      success: true,
      data: {
        regions: detectRes.data.regions,
        cards: cardsRes.data.cards,
      },
    };
  },

  /**
   * Check backend health
   */
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE.replace(/\/api$/, "")}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Call 1: Detect note regions in a photo.
   * @param {string} imageBase64 - Base64-encoded JPEG
   * @returns {Promise<ApiResponse & { data?: DetectRegionsResponse }>}
   */
  detectRegions: (imageBase64) => post("/detect-regions", { image: imageBase64 }),

  /**
   * Call 2: Generate type-aware flashcards from detected regions.
   * @param {Region[]} regions
   * @param {string} imageBase64
   * @returns {Promise<ApiResponse & { data?: GenerateCardsResponse }>}
   */
  generateCards: (regions, imageBase64) =>
    post("/generate-cards", { regions, image: imageBase64 }),

  /**
   * Call 3: Grounded remediation from a wrong answer + source crop.
   * @param {RemediationPayload} payload
   * @returns {Promise<ApiResponse & { data?: RemediationResult }>}
   */
  remediate: (payload) => post("/remediate", payload),
};

