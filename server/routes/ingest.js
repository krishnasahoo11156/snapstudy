import express from "express";
import { getModel, parseGeminiJson } from "../services/gemini.js";
import { normalizeBox } from "../services/crop.js";
import { unifiedIngestionPrompt } from "../utils/prompts.js";

const router = express.Router();

/**
 * POST /api/ingest
 * Body: { image: string } — base64 JPEG
 * Returns: { success: true, data: { regions: Region[], cards: Flashcard[] } }
 * Single AI pass — 2-3x faster than sequential calls.
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
      unifiedIngestionPrompt,
      { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
    ]);

    const text = result.response.text();
    const parsed = parseGeminiJson(text);

    const rawRegions = Array.isArray(parsed.regions) ? parsed.regions : [];
    const rawCards = Array.isArray(parsed.cards) ? parsed.cards : [];

    // Standardize regions
    const regions = rawRegions.map((r, i) => ({
      id: r.id || `region_${i}`,
      box_2d: normalizeBox(r.box_2d),
      region_type: r.region_type || "prose",
      label: r.label || `Region ${i + 1}`,
      raw_text: r.raw_text || "",
    }));

    // Standardize cards and linkage
    const cards = rawCards.map((c, i) => {
      const matchedRegion = regions.find((r) => r.id === c.source_region_id) || regions[i % (regions.length || 1)];
      return {
        id: c.id || `card_${i}`,
        source_region_id: matchedRegion ? matchedRegion.id : `region_${i}`,
        card_type: c.card_type || "qa",
        front: c.front || "Review note concept",
        back: c.back || "See notes for details",
        ...(Array.isArray(c.steps) && c.steps.length > 0 ? { steps: c.steps } : {}),
        ...(Array.isArray(c.labels) && c.labels.length > 0 ? { labels: c.labels } : {}),
      };
    });

    res.json({
      success: true,
      data: {
        regions,
        cards,
      },
    });
  } catch (err) {
    console.error("[ingest error]", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
