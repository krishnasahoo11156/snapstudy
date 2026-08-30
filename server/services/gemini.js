import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Centralized Model Configuration ─────────────────────────────────────────
export const GEMINI_PRIMARY_MODEL =
  process.env.GEMINI_PRIMARY_MODEL ||
  process.env.MODEL_BATCH ||
  "gemini-3.5-flash";

export const GEMINI_LITE_MODEL =
  process.env.GEMINI_LITE_MODEL ||
  process.env.MODEL_LIVE ||
  "gemini-3.5-flash-lite";

const genAIInstances = new Map();

/**
 * Get all available configured Gemini API keys across all endpoints.
 * Supports dedicated keys, numbered keys (KEY_4, KEY_5, KEY_6, etc.), and comma-separated GEMINI_API_KEYS.
 * @returns {string[]}
 */
export function getAllApiKeys() {
  const keys = [
    process.env.GEMINI_API_KEY_DETECT,
    process.env.GEMINI_API_KEY_GENERATE,
    process.env.GEMINI_API_KEY_REMEDIATE,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_EXTRA,
  ];

  if (process.env.GEMINI_API_KEYS) {
    const list = process.env.GEMINI_API_KEYS.split(",").map((k) => k.trim());
    keys.push(...list);
  }

  return [...new Set(keys.filter((k) => Boolean(k && typeof k === "string" && k.trim().length > 10)))];
}

/**
 * Get GoogleGenerativeAI instance for a specific call type or key.
 * @param {"detect"|"generate"|"remediate"|"ingest"|"default"} [callType="default"]
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
 * @param {"primary"|"lite"|"batch"|"live"} [tier="primary"]
 * @param {string|null} [overrideModel=null]
 * @param {"detect"|"generate"|"remediate"|"ingest"|"default"} [callType="default"]
 * @param {string|null} [explicitKey=null]
 * @returns {import("@google/generative-ai").GenerativeModel}
 */
export function getModel(tier = "primary", overrideModel = null, callType = "default", explicitKey = null) {
  const genAI = getGenAI(callType, explicitKey);
  const isLite = tier === "lite" || tier === "live";
  const defaultModel = isLite ? GEMINI_LITE_MODEL : GEMINI_PRIMARY_MODEL;
  const modelName = overrideModel || defaultModel;

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
 * Uses gemini-3.5-flash for primary tasks (ingest, detect, generate)
 * and gemini-3.5-flash-lite for lightweight live tasks (remediation).
 *
 * @param {any[]} promptParts
 * @param {"primary"|"lite"|"batch"|"live"} [tier="primary"]
 * @param {"detect"|"generate"|"remediate"|"ingest"|"default"} [callType="default"]
 * @returns {Promise<string>}
 */
export async function generateWithModelFallback(promptParts, tier = "primary", callType = "default") {
  const isLite = tier === "lite" || tier === "live";
  const primaryModel = isLite ? GEMINI_LITE_MODEL : GEMINI_PRIMARY_MODEL;
  const backupModel = isLite ? GEMINI_PRIMARY_MODEL : GEMINI_LITE_MODEL;
  const models = [primaryModel, backupModel];

  const keys = getAllApiKeys();
  const keyList = keys.length > 0 ? keys : [null];

  let lastError;

  for (const modelName of models) {
    for (const key of keyList) {
      try {
        console.log(`[Gemini Request] Endpoint: ${callType} | Selected Model: ${modelName} | Key: ${key ? `***${key.slice(-4)}` : "default"}`);
        // 45-second generous timeout per key to allow full multimodal vision analysis
        const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 45000;
        const resultPromise = model.generateContent(promptParts);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini request timeout on key ${key ? `***${key.slice(-4)}` : "default"}`)), TIMEOUT_MS)
        );

        const result = await Promise.race([resultPromise, timeoutPromise]);
        return result.response.text();
      } catch (err) {
        console.error(
          `[Gemini Error] Endpoint: ${callType} | Selected Model: ${modelName} | Key: ${
            key ? `***${key.slice(-4)}` : "default"
          } | Status: ${err?.status || err?.statusCode || "Error"} | Message: ${err?.message || err}`
        );
        lastError = err;
      }
    }
  }

  throw lastError;
}

