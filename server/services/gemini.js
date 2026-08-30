import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIInstance = null;

function getGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(key);
  }
  return genAIInstance;
}

/**
 * Get a configured Gemini model instance.
 *
 * @param {"batch"|"live"} tier
 *   - "batch" → MODEL_BATCH env var (e.g. gemini-1.5-flash) — for region detection & card generation
 *   - "live"  → MODEL_LIVE env var  (e.g. gemini-1.5-flash-8b) — for low-latency remediation
 * @returns {import("@google/generative-ai").GenerativeModel}
 */
export function getModel(tier) {
  const genAI = getGenAI();
  const envModel =
    tier === "batch"
      ? process.env.MODEL_BATCH
      : process.env.MODEL_LIVE;

  // Use configured env var if present and not outdated gemini-1.5-flash/2.0-flash, else use gemini-2.5-flash
  const modelName =
    envModel && !envModel.startsWith("gemini-1.5") && !envModel.startsWith("gemini-2.0")
      ? envModel
      : "gemini-2.5-flash";

  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });
}

/**
 * Safely parse JSON from Gemini text response (stripping any accidental markdown fences).
 * @param {string} text
 * @returns {any}
 */
export function parseGeminiJson(text) {
  if (!text) throw new Error("Empty response received from Gemini.");
  const clean = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(clean);
}

/**
 * Retry helper — wraps a Gemini call with exponential backoff.
 * Use for batch calls that can tolerate slight delays.
 *
 * @param {() => Promise<T>} fn
 * @param {number} maxRetries
 * @returns {Promise<T>}
 * @template T
 */
export async function withRetry(fn, maxRetries = 3) {
  let lastErr;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const backoffMs = 1000 * Math.pow(2, attempt);
      console.warn(`[gemini] Attempt ${attempt + 1} failed: ${err?.message || err}. Retrying in ${backoffMs}ms…`);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  throw lastErr;
}

