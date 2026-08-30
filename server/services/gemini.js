import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get a configured Gemini model instance.
 *
 * @param {"batch"|"live"} tier
 *   - "batch" → MODEL_BATCH env var (e.g. gemini-1.5-flash) — for region detection & card generation
 *   - "live"  → MODEL_LIVE env var  (e.g. gemini-1.5-flash-8b) — for low-latency remediation
 * @returns {import("@google/generative-ai").GenerativeModel}
 */
export function getModel(tier) {
  const modelName =
    tier === "batch"
      ? process.env.MODEL_BATCH || "gemini-1.5-flash"
      : process.env.MODEL_LIVE || "gemini-1.5-flash-8b";

  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });
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
      console.warn(`[gemini] Attempt ${attempt + 1} failed. Retrying in ${backoffMs}ms…`);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  throw lastErr;
}
