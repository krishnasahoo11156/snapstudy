import express from "express";
import { generateWithModelFallback, parseGeminiJson } from "../services/gemini.js";
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
  const startTime = Date.now();
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: "Missing image field in request body" });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_DETECT) {
      console.warn("[/api/ingest] Gemini API key is missing on backend.");
      return res.status(501).json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server.",
      });
    }

    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "").trim();
    console.log(`[/api/ingest] Processing image payload (${Math.round(cleanBase64.length / 1024)} KB base64)...`);

    const text = await generateWithModelFallback([
      unifiedIngestionPrompt,
      { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
    ], "batch", "ingest");
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

    const elapsed = Date.now() - startTime;
    console.log(`[/api/ingest] Successfully generated ${regions.length} regions and ${cards.length} cards in ${elapsed}ms`);

    res.json({
      success: true,
      data: {
        regions,
        cards,
      },
    });
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`[/api/ingest error after ${elapsed}ms]`, err?.message || err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
