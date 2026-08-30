import express from "express";
import { generateWithModelFallback, parseGeminiJson } from "../services/gemini.js";
import { ragChatPrompt } from "../utils/prompts.js";

const router = express.Router();

/**
 * POST /api/chat
 * Body: { context: string, messages: { role: string, text: string }[], query: string }
 * Returns: { success: true, data: { answer: string, suggestions: string[] } }
 */
router.post("/", async (req, res) => {
  try {
    const { context, messages, query } = req.body;

    if (!context) {
      return res.status(400).json({ success: false, error: "Missing 'context' field in request body" });
    }

    if (!query) {
      return res.status(400).json({ success: false, error: "Missing 'query' field in request body" });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_REMEDIATE) {
      return res.status(501).json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server.",
      });
    }

    // Prepare prompt
    const prompt = ragChatPrompt(context, messages || [], query);

    // Call Gemini using the low-latency live model config
    const text = await generateWithModelFallback([prompt], "live", "default");
    const parsed = parseGeminiJson(text);

    if (!parsed.answer) {
      throw new Error("Invalid schema returned from Gemini: missing 'answer' string");
    }

    res.json({
      success: true,
      data: {
        answer: parsed.answer,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      },
    });
  } catch (err) {
    console.error("[chat error]", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
