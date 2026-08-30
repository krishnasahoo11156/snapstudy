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
 * @returns {Promise<ApiResponse>}
 */
async function post(path, body) {
  if (mockMode) {
    await new Promise((r) => setTimeout(r, 500));
    if (path.includes("detect-regions")) return { success: true, data: generateMockRegions() };
    if (path.includes("generate-cards")) return { success: true, data: generateMockCards() };
    if (path.includes("remediate")) return { success: true, data: generateMockRemediation() };
    return { success: false, error: "Unknown mock path" };
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn(`[api-client] Remote API ${path} returned HTTP ${res.status}. Falling back to mock dataset.`);
      if (path.includes("detect-regions")) return { success: true, data: generateMockRegions(), fallback: true };
      if (path.includes("generate-cards")) return { success: true, data: generateMockCards(), fallback: true };
      if (path.includes("remediate")) return { success: true, data: generateMockRemediation(), fallback: true };
      return { success: false, error: `HTTP ${res.status}` };
    }

    return await res.json();
  } catch (err) {
    console.warn(`[api-client] Network error calling ${path} (${err.message}). Falling back to mock dataset for seamless demonstration.`);
    if (path.includes("detect-regions")) return { success: true, data: generateMockRegions(), fallback: true };
    if (path.includes("generate-cards")) return { success: true, data: generateMockCards(), fallback: true };
    if (path.includes("remediate")) return { success: true, data: generateMockRemediation(), fallback: true };
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Typed API surface — import this everywhere, never call fetch() directly.
 */
export const api = {
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

