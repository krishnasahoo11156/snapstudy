import express from "express";
import { getModel } from "../services/gemini.js";
import { regionDetectionPrompt } from "../utils/prompts.js";

const router = express.Router();

/**
 * POST /api/detect-regions
 * Body: { image: string } — base64-encoded JPEG
 * Returns: { success: true, data: { regions: Region[] } }
 *
 * Branch A implements this. Currently a stub.
 */
router.post("/", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: "Missing image field" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(501).json({
        success: false,
        error: "GEMINI_API_KEY not set. Branch A: implement this endpoint.",
      });
    }

    const model = getModel("batch");
    const result = await model.generateContent([
      regionDetectionPrompt,
      { inlineData: { data: image, mimeType: "image/jpeg" } },
    ]);

    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (!parsed.regions || !Array.isArray(parsed.regions)) {
      throw new Error("Invalid region schema from Gemini");
    }

    // Attach stable IDs if Gemini didn't provide them
    const regions = parsed.regions.map((r, i) => ({
      id: r.id ?? `region_${i}`,
      ...r,
    }));

    res.json({ success: true, data: { regions } });
  } catch (err) {
    console.error("[detect-regions]", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
