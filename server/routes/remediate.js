import express from "express";
import { getModel } from "../services/gemini.js";
import { remediationPrompt } from "../utils/prompts.js";

const router = express.Router();

/**
 * POST /api/remediate
 * Body: RemediationPayload
 * Returns: { success: true, data: RemediationResult }
 *
 * Branch A implements this. Currently a stub.
 */
router.post("/", async (req, res) => {
  try {
    const { cropImageBase64, wrongAnswer, correctAnswer, regionContext, cardType } = req.body;

    if (!wrongAnswer || !correctAnswer || !regionContext) {
      return res.status(400).json({ success: false, error: "Missing required remediation fields" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(501).json({
        success: false,
        error: "GEMINI_API_KEY not set. Branch A: implement this endpoint.",
      });
    }

    const model = getModel("live");
    const prompt = remediationPrompt(wrongAnswer, correctAnswer, regionContext, cardType);

    const contentParts = [prompt];

    // If we have a crop, include it; otherwise fall back to full-page context
    if (cropImageBase64) {
      contentParts.push({ inlineData: { data: cropImageBase64, mimeType: "image/jpeg" } });
    } else {
      console.warn("[remediate] No crop image provided — using text-only fallback");
    }

    const result = await model.generateContent(contentParts);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error("[remediate]", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
