import express from "express";
import { generateWithModelFallback, parseGeminiJson } from "../services/gemini.js";
import { normalizeBox } from "../services/crop.js";
import { unifiedIngestionPrompt } from "../utils/prompts.js";

const router = express.Router();

/**
 * POST /api/ingest
 * Body: {
 *   image?: string,
 *   fileData?: string,
 *   mimeType?: string,
 *   textContent?: string,
 *   fileName?: string
 * }
 * Returns: { success: true, data: { regions: Region[], cards: Flashcard[] } }
 * Handles photos, PDF study guides, lecture slides, and text notes.
 */
router.post("/", async (req, res) => {
  const startTime = Date.now();
  try {
    const { image, fileData, mimeType = "image/jpeg", textContent, fileName } = req.body;

    const payload = fileData || image;
    if (!payload && !textContent) {
      return res.status(400).json({ success: false, error: "Missing image, fileData, or textContent in request body" });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_DETECT) {
      console.warn("[/api/ingest] Gemini API key is missing on backend.");
      return res.status(501).json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server.",
      });
    }

    const contentParts = [unifiedIngestionPrompt];

    if (textContent) {
      console.log(`[/api/ingest] Processing text document "${fileName || "notes"}" (${textContent.length} chars)...`);
      contentParts.push(`\n\nStudy Material Content from "${fileName || "Notes Document"}":\n${textContent}`);
    } else if (payload) {
      const cleanBase64 = payload.replace(/^data:[^;]+;base64,/, "").trim();
      const detectedMime = mimeType || (payload.startsWith("data:application/pdf") ? "application/pdf" : "image/jpeg");
      console.log(`[/api/ingest] Processing file payload (${Math.round(cleanBase64.length / 1024)} KB, type: ${detectedMime})...`);

      contentParts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: detectedMime,
        },
      });
    }

    const text = await generateWithModelFallback(contentParts, "primary", "ingest");
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
