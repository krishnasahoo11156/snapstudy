import express from "express";
import { getModel, parseGeminiJson } from "../services/gemini.js";
import { cropBase64Image } from "../services/crop.js";
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

    if (!process.env.GEMINI_API_KEY) {
      return res.status(501).json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server.",
      });
    }

    let finalCropBase64 = cropImageBase64
      ? cropImageBase64.replace(/^data:image\/\w+;base64,/, "").trim()
      : null;

    // If no crop provided, but we have original image + bounding box, crop on the fly!
    if (!finalCropBase64 && originalImageBase64) {
      const boxToCrop = box_2d || regionContext.box_2d;
      if (boxToCrop) {
        try {
          finalCropBase64 = await cropBase64Image(originalImageBase64, boxToCrop);
        } catch (cropErr) {
          console.warn("[remediate] Crop generation failed, falling back to full image:", cropErr);
          finalCropBase64 = originalImageBase64.replace(/^data:image\/\w+;base64,/, "").trim();
        }
      } else {
        finalCropBase64 = originalImageBase64.replace(/^data:image\/\w+;base64,/, "").trim();
      }
    }

    const model = getModel("live");
    const prompt = remediationPrompt(wrongAnswer, correctAnswer, regionContext, cardType);

    const contentParts = [prompt];

    if (finalCropBase64) {
      contentParts.push({ inlineData: { data: finalCropBase64, mimeType: "image/jpeg" } });
    } else {
      console.warn("[remediate] No crop or image provided — using text-only fallback");
    }

    const result = await model.generateContent(contentParts);
    const text = result.response.text();
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

