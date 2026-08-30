import express from "express";
import { getModel, parseGeminiJson } from "../services/gemini.js";
import { flashcardGenerationPrompt } from "../utils/prompts.js";

const router = express.Router();

/**
 * POST /api/generate-cards
 * Body: { regions: Region[], image: string }
 * Returns: { success: true, data: { cards: Flashcard[] } }
 */
router.post("/", async (req, res) => {
  try {
    const { regions, image } = req.body;

    if (!regions || !Array.isArray(regions) || regions.length === 0) {
      return res.status(400).json({ success: false, error: "Missing or invalid 'regions' array in request body" });
    }

    if (!image) {
      return res.status(400).json({ success: false, error: "Missing 'image' field in request body" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(501).json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server.",
      });
    }

    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "").trim();

    const model = getModel("batch");
    const prompt = flashcardGenerationPrompt(regions);
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
    ]);

    const text = result.response.text();
    const parsed = parseGeminiJson(text);

    if (!parsed.cards || !Array.isArray(parsed.cards)) {
      throw new Error("Invalid card schema returned from Gemini: missing 'cards' array");
    }

    // Attach stable IDs and validate linkages
    const cards = parsed.cards.map((c, i) => {
      // Ensure source_region_id matches a real region or defaults to the ith region
      const matchedRegion = regions.find((r) => r.id === c.source_region_id) || regions[i % regions.length];
      return {
        id: c.id || `card_${i}`,
        source_region_id: matchedRegion ? matchedRegion.id : `region_${i}`,
        card_type: c.card_type || "qa",
        front: c.front || "Review note region",
        back: c.back || "See notes for details",
        ...(Array.isArray(c.steps) && c.steps.length > 0 ? { steps: c.steps } : {}),
        ...(Array.isArray(c.labels) && c.labels.length > 0 ? { labels: c.labels } : {}),
      };
    });

    res.json({ success: true, data: { cards } });
  } catch (err) {
    console.error("[generate-cards error]", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;

