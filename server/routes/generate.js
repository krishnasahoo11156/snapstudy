import express from "express";
import { getModel } from "../services/gemini.js";
import { flashcardGenerationPrompt } from "../utils/prompts.js";

const router = express.Router();

/**
 * POST /api/generate-cards
 * Body: { regions: Region[], image: string }
 * Returns: { success: true, data: { cards: Flashcard[] } }
 *
 * Branch A implements this. Currently a stub.
 */
router.post("/", async (req, res) => {
  try {
    const { regions, image } = req.body;

    if (!regions || !image) {
      return res.status(400).json({ success: false, error: "Missing regions or image" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(501).json({
        success: false,
        error: "GEMINI_API_KEY not set. Branch A: implement this endpoint.",
      });
    }

    const model = getModel("batch");
    const prompt = flashcardGenerationPrompt(regions);
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: "image/jpeg" } },
    ]);

    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (!parsed.cards || !Array.isArray(parsed.cards)) {
      throw new Error("Invalid card schema from Gemini");
    }

    // Attach stable IDs
    const cards = parsed.cards.map((c, i) => ({
      id: c.id ?? `card_${i}`,
      ...c,
    }));

    res.json({ success: true, data: { cards } });
  } catch (err) {
    console.error("[generate-cards]", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
