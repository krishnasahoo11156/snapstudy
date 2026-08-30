import express from "express";
import { getModel, parseGeminiJson } from "../services/gemini.js";
import { normalizeBox } from "../services/crop.js";
import { regionDetectionPrompt } from "../utils/prompts.js";

const router = express.Router();

/**
 * POST /api/detect-regions
 * Body: { image: string } — base64-encoded JPEG or data URL
 * Returns: { success: true, data: { regions: Region[] } }
 */
router.post("/", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: "Missing image field in request body" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(501).json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server.",
      });
    }

    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "").trim();

    const model = getModel("batch");
    const result = await model.generateContent([
      regionDetectionPrompt,
      { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
    ]);

    const text = result.response.text();
    const parsed = parseGeminiJson(text);

    if (!parsed.regions || !Array.isArray(parsed.regions)) {
      throw new Error("Invalid region schema returned from Gemini: missing 'regions' array");
    }

    // Standardize IDs and box format (0–1000 Box2D object)
    const regions = parsed.regions.map((r, i) => ({
      id: r.id || `region_${i}`,
      box_2d: normalizeBox(r.box_2d),
      region_type: r.region_type || "prose",
      label: r.label || `Region ${i + 1}`,
      raw_text: r.raw_text || "",
    }));

    res.json({ success: true, data: { regions } });
  } catch (err) {
    console.error("[detect-regions error]", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;

