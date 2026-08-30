import { GoogleGenerativeAI } from "@google/generative-ai";

const genAIInstances = new Map();

/**
 * Get GoogleGenerativeAI instance for a specific call type or key.
 * @param {"detect"|"generate"|"remediate"|"default"} [callType="default"]
 * @returns {GoogleGenerativeAI}
 */
export function getGenAI(callType = "default") {
  let key = process.env.GEMINI_API_KEY;

  if (callType === "detect" || callType === "ingest") {
    key = process.env.GEMINI_API_KEY_DETECT || key;
  } else if (callType === "generate") {
    key = process.env.GEMINI_API_KEY_GENERATE || key;
  } else if (callType === "remediate") {
    key = process.env.GEMINI_API_KEY_REMEDIATE || key;
  }

  if (!key) {
    throw new Error(`Gemini API key is not configured for call type '${callType}'.`);
  }

  if (!genAIInstances.has(key)) {
    genAIInstances.set(key, new GoogleGenerativeAI(key));
  }
  return genAIInstances.get(key);
}

/**
 * Get a configured Gemini model instance with dedicated API key per call.
 *
 * @param {"batch"|"live"} tier
 * @param {string|null} [overrideModel=null]
 * @param {"detect"|"generate"|"remediate"|"default"} [callType="default"]
 * @returns {import("@google/generative-ai").GenerativeModel}
 */
export function getModel(tier, overrideModel = null, callType = "default") {
  const genAI = getGenAI(callType);
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
 * @param {"detect"|"generate"|"remediate"|"default"} [callType="default"]
 * @returns {Promise<string>}
 */
export async function generateWithModelFallback(promptParts, tier = "batch", callType = "default") {
  const candidateModels =
    tier === "batch"
      ? ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
      : ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.1-flash-lite"];

  let lastError;
  for (const modelName of candidateModels) {
    try {
      const model = getModel(tier, modelName, callType);
      const result = await model.generateContent(promptParts);
      return result.response.text();
    } catch (err) {
      console.warn(`[gemini][${callType}] Model ${modelName} failed (${err?.message || err}). Trying fallback…`);
      lastError = err;
    }
  }
  throw lastError;
}

