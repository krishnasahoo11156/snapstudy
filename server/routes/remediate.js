import express from "express";
import { generateWithModelFallback, parseGeminiJson } from "../services/gemini.js";
import { cropBase64Image, normalizeBox } from "../services/crop.js";
import { remediationPrompt } from "../utils/prompts.js";

const router = express.Router();

/**
 * POST /api/remediate
 * Body: {
 *   cropImageBase64?: string,
 *   originalImageBase64?: string,
 *   box_2d?: Box2D,
 *   wrongAnswer: string,
 *   correctAnswer: string,
 *   regionContext: Region,
 *   cardType: CardType
 * }
 * Returns: { success: true, data: RemediationResult }
 */
router.post("/", async (req, res) => {
  try {
    const {
      cropImageBase64,
      originalImageBase64,
      box_2d,
      wrongAnswer,
      correctAnswer,
      regionContext,
      cardType = "qa",
    } = req.body;

    if (!wrongAnswer || !correctAnswer || !regionContext) {
      return res.status(400).json({
        success: false,
        error: "Missing required remediation fields (wrongAnswer, correctAnswer, regionContext)",
      });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_REMEDIATE) {
      return res.status(501).json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server.",
      });
    }

    let finalCropBase64 =
      cropImageBase64 && typeof cropImageBase64 === "string" && !cropImageBase64.startsWith("http")
        ? cropImageBase64.replace(/^data:image\/\w+;base64,/, "").trim()
        : null;

    const isBase64 =
      originalImageBase64 &&
      typeof originalImageBase64 === "string" &&
      originalImageBase64.length > 100 &&
      !originalImageBase64.startsWith("http");

    // If no crop provided and we have real base64 data, crop bounding box
    if (!finalCropBase64 && isBase64) {
      const rawBox = box_2d || regionContext.box_2d;
      const boxToCrop = rawBox ? normalizeBox(rawBox) : null;
      const isReliable =
        boxToCrop &&
        boxToCrop.xmax - boxToCrop.xmin >= 10 &&
        boxToCrop.ymax - boxToCrop.ymin >= 10 &&
        boxToCrop.xmin >= 0 &&
        boxToCrop.ymin >= 0 &&
        boxToCrop.xmax <= 1000 &&
        boxToCrop.ymax <= 1000;

      if (isReliable) {
        try {
          finalCropBase64 = await cropBase64Image(originalImageBase64, boxToCrop);
        } catch (cropErr) {
          console.warn("[remediate] Crop failed, proceeding with prompt:", cropErr?.message || cropErr);
        }
      }
    }

    const prompt = remediationPrompt(wrongAnswer, correctAnswer, regionContext, cardType);

    const contentParts = [prompt];

    if (finalCropBase64) {
      contentParts.push({ inlineData: { data: finalCropBase64, mimeType: "image/jpeg" } });
    } else {
      console.warn("[remediate] No crop or image provided — using text-only fallback");
    }

    const text = await generateWithModelFallback(contentParts, "live", "remediate");
    const parsed = parseGeminiJson(text);

    const data = {
      explanation: parsed.explanation || "Review your notes for this section to understand the correct concept.",
      hints: Array.isArray(parsed.hints) ? parsed.hints : ["Review the region highlighted in your notes."],
      referencesSource: parsed.referencesSource ?? !!finalCropBase64,
    };

    res.json({ success: true, data });
  } catch (err) {
    console.error("[remediate error]", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;

