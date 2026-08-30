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
export function getModel(tier, overrideModel = null) {
  const genAI = getGenAI();
  const envModel =
    tier === "batch"
      ? process.env.MODEL_BATCH
      : process.env.MODEL_LIVE;

  const modelName =
    overrideModel ||
    envModel ||
    (tier === "batch" ? "gemini-3.5-flash" : "gemini-3.5-flash-lite");

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
 * Call Gemini with automatic model failover if the primary model is busy or hits quota.
 * @param {any[]} promptParts
 * @param {"batch"|"live"} tier
 * @returns {Promise<string>}
 */
export async function generateWithModelFallback(promptParts, tier = "batch") {
  const candidateModels =
    tier === "batch"
      ? ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
      : ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.1-flash-lite"];

  let lastError;
  for (const modelName of candidateModels) {
    try {
      const model = getModel(tier, modelName);
      const result = await model.generateContent(promptParts);
      return result.response.text();
    } catch (err) {
      console.warn(`[gemini] Model ${modelName} failed (${err?.message || err}). Trying fallback…`);
      lastError = err;
    }
  }
  throw lastError;
}

