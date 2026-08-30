import { GoogleGenerativeAI } from "@google/generative-ai";

const genAIInstances = new Map();

const SUPPORTED_MODELS = new Set([
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash-lite-preview-02-05",
]);

/**
 * Sanitize and validate model names, safely mapping custom or placeholder strings to fast supported models.
 */
function resolveModelName(rawModel) {
  if (rawModel && SUPPORTED_MODELS.has(rawModel)) {
    return rawModel;
  }
  // If env has placeholder like gemini-3.5-flash or gemini-3.5-flash-lite, map to gemini-2.0-flash
  return "gemini-2.0-flash";
}

/**
 * Get all available configured Gemini API keys across all endpoints.
 * @returns {string[]}
 */
export function getAllApiKeys() {
  return [
    process.env.GEMINI_API_KEY_DETECT,
    process.env.GEMINI_API_KEY_GENERATE,
    process.env.GEMINI_API_KEY_REMEDIATE,
    process.env.GEMINI_API_KEY,
  ].filter((k) => Boolean(k && typeof k === "string" && k.trim().length > 10));
}

/**
 * Get GoogleGenerativeAI instance for a specific call type or key.
 * @param {"detect"|"generate"|"remediate"|"default"} [callType="default"]
 * @param {string|null} [explicitKey=null]
 * @returns {GoogleGenerativeAI}
 */
export function getGenAI(callType = "default", explicitKey = null) {
  let key = explicitKey;

  if (!key) {
    if (callType === "detect" || callType === "ingest") {
      key = process.env.GEMINI_API_KEY_DETECT || process.env.GEMINI_API_KEY;
    } else if (callType === "generate") {
      key = process.env.GEMINI_API_KEY_GENERATE || process.env.GEMINI_API_KEY;
    } else if (callType === "remediate") {
      key = process.env.GEMINI_API_KEY_REMEDIATE || process.env.GEMINI_API_KEY;
    } else {
      key = process.env.GEMINI_API_KEY;
    }
  }

  // Fallback to any available key in pool
  if (!key) {
    const keys = getAllApiKeys();
    key = keys[0];
  }

  if (!key) {
    throw new Error(`No Gemini API key configured on the server.`);
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
 * @param {string|null} [explicitKey=null]
 * @returns {import("@google/generative-ai").GenerativeModel}
 */
export function getModel(tier, overrideModel = null, callType = "default", explicitKey = null) {
  const genAI = getGenAI(callType, explicitKey);
  const envModel = tier === "batch" ? process.env.MODEL_BATCH : process.env.MODEL_LIVE;
  const modelName = resolveModelName(overrideModel || envModel);

  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
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
 * Call Gemini with multi-key pooling and automatic model failover.
 * Dispatches across all available keys (DETECT, GENERATE, REMEDIATE, MAIN) for maximum throughput.
 *
 * @param {any[]} promptParts
 * @param {"batch"|"live"} tier
 * @param {"detect"|"generate"|"remediate"|"default"} [callType="default"]
 * @returns {Promise<string>}
 */
export async function generateWithModelFallback(promptParts, tier = "batch", callType = "default") {
  const keys = getAllApiKeys();
  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];

  let lastError;

  // Try across available keys and models
  for (const key of keys.length > 0 ? keys : [null]) {
    for (const modelName of models) {
      try {
        const model = getModel(tier, modelName, callType, key);
        const result = await model.generateContent(promptParts);
        return result.response.text();
      } catch (err) {
        console.warn(`[gemini][${callType}] Model ${modelName} with key ${key ? key.slice(-4) : "default"} failed (${err?.message || err}). Trying next available...`);
        lastError = err;
      }
    }
  }

  throw lastError;
}

