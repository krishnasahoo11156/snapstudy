// ============================================================
// ALL GEMINI PROMPTS — centralised here, never inline in routes
// Branch A owns this file. Do not edit from Branch B.
// ============================================================

/**
 * Call 1: Region Detection
 * Instructs Gemini to identify distinct content regions in a student's notebook photo.
 */
export const regionDetectionPrompt = `You are an expert study assistant analyzing a photograph of student handwritten notes.

Your task: Identify ALL distinct content regions on this page.

For each region, return:
- box_2d: bounding box as [ymin, xmin, ymax, xmax] on a 0–1000 scale
- region_type: one of [equation, diagram, definition, list, prose]
- label: a short 3–5 word description of what this region contains
- raw_text: transcribed text (for text regions) or a clear description (for diagrams)

Classification guide:
- equation: mathematical formulas, derivations, symbolic expressions
- diagram: graphs, figures, charts, sketches, illustrations
- definition: formal definitions, theorems, key terms with explanations
- list: numbered or bulleted items, steps, examples
- prose: regular paragraphs, explanations, notes

Return ONLY valid JSON with no markdown fences:
{
  "regions": [
    {
      "box_2d": [number, number, number, number],
      "region_type": "string",
      "label": "string",
      "raw_text": "string"
    }
  ]
}`;

/**
 * Fast Unified Ingest: Region Detection + Card Generation in a single AI pass (2-3x speedup)
 */
export const unifiedIngestionPrompt = `You are an expert study assistant analyzing a photograph of student handwritten notes.

Your task in ONE unified pass:
1. Identify ALL distinct content regions on this page with their bounding boxes (0–1000 scale as [ymin, xmin, ymax, xmax]).
2. For each detected region, create exactly ONE corresponding type-aware flashcard.

Region types:
- equation: mathematical formulas, derivations, symbolic expressions
- diagram: graphs, figures, charts, sketches, illustrations
- definition: formal definitions, theorems, key terms with explanations
- list: numbered or bulleted items, steps, examples
- prose: regular paragraphs, explanations, notes

Card types matching the region:
- "qa" → for definitions, facts, prose concepts (front question, back answer)
- "derivation_steps" → for mathematical proofs, derivations (include "steps" array)
- "labeled_diagram" → for diagrams, graphs, charts (include "labels" array of {part, description})
- "timeline" → for sequences, ordered processes (include "steps" array)

Return ONLY valid JSON with no markdown fences:
{
  "regions": [
    {
      "id": "region_0",
      "box_2d": [100, 50, 400, 950],
      "region_type": "equation",
      "label": "Short description",
      "raw_text": "Text or description"
    }
  ],
  "cards": [
    {
      "id": "card_0",
      "source_region_id": "region_0",
      "card_type": "qa",
      "front": "Clear question testing understanding",
      "back": "Concise complete answer",
      "steps": ["Step 1"],
      "labels": [{"part": "Name", "description": "Detail"}]
    }
  ]
}`;

/**
 * Call 2: Flashcard Generation
 * Generates type-aware flashcards from the detected regions.
 *
 * @param {import("../../src/types/index.js").Region[]} regions
 * @returns {string}
 */
export function flashcardGenerationPrompt(regions) {
  return `You are an encouraging, subject-aware tutor generating study flashcards.

Detected note regions:
${JSON.stringify(regions, null, 2)}

For each region, create exactly ONE flashcard. Choose card_type based on content:
- "qa" → for definitions, facts, concepts — simple question and answer
- "derivation_steps" → for proofs, mathematical derivations — include step-by-step breakdown
- "labeled_diagram" → for diagrams, graphs, figures — include labeled parts
- "timeline" → for processes, sequences, historical events — ordered steps

Rules:
- source_region_id must match the region's id exactly
- front: a clear question or prompt that tests understanding
- back: a concise but complete answer
- steps: ONLY for derivation_steps or timeline cards
- labels: ONLY for labeled_diagram cards, each with {part, description}

Return ONLY valid JSON with no markdown fences:
{
  "cards": [
    {
      "source_region_id": "string",
      "card_type": "string",
      "front": "string",
      "back": "string",
      "steps": ["string"],
      "labels": [{"part": "string", "description": "string"}]
    }
  ]
}`;
}

/**
 * Call 3: Grounded Remediation
 * Explains a wrong answer using ONLY what's visible in the student's own cropped notes.
 *
 * @param {string} wrongAnswer
 * @param {string} correctAnswer
 * @param {import("../../src/types/index.js").Region} regionContext
 * @param {import("../../src/types/index.js").CardType} cardType
 * @returns {string}
 */
export function remediationPrompt(wrongAnswer, correctAnswer, regionContext, cardType) {
  return `You are an encouraging tutor helping a student who answered a flashcard incorrectly.

Region context (from their notes):
${JSON.stringify(regionContext, null, 2)}

Card type: ${cardType}
Correct answer: ${correctAnswer}
Student's wrong answer: ${wrongAnswer}

The attached image is a CROP of the student's own handwritten notes for this specific region.

Your task:
1. Identify EXACTLY WHERE in their notes the correct answer is explained
2. Explain WHY their answer was wrong using ONLY what is visible in their own material
3. Be concise (2–3 sentences max) and encouraging, not condescending
4. Suggest 1–2 specific hints that reference visible content in the crop

CRITICAL: Reference the student's actual notes. Do NOT use generic textbook knowledge.

Return ONLY valid JSON with no markdown fences:
{
  "explanation": "string",
  "hints": ["string"],
  "referencesSource": true
}`;
}
