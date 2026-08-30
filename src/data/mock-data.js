/** @import { Region, Flashcard, RemediationResult } from "../types" */

// ============================================================
// MOCK DATA GENERATORS
// Used by api-client.js when MOCK_MODE = true.
// Content is intentionally meaningful (quadratic formula topic)
// so Branch B can build realistic UIs against real-looking data.
// ============================================================

/**
 * @returns {{ regions: Region[] }}
 */
export function generateMockRegions() {
  return {
    regions: [
      {
        id: "region_0",
        box_2d: { ymin: 50, xmin: 50, ymax: 300, xmax: 950 },
        region_type: "equation",
        label: "Quadratic Formula Derivation",
        raw_text: "ax² + bx + c = 0 → x = (-b ± √(b²-4ac)) / 2a",
      },
      {
        id: "region_1",
        box_2d: { ymin: 350, xmin: 50, ymax: 700, xmax: 500 },
        region_type: "diagram",
        label: "Parabola Graph",
        raw_text:
          "Diagram showing upward parabola with vertex, axis of symmetry, and roots labeled",
      },
      {
        id: "region_2",
        box_2d: { ymin: 350, xmin: 550, ymax: 700, xmax: 950 },
        region_type: "definition",
        label: "Discriminant Definition",
        raw_text: "Discriminant (D) = b² - 4ac. Determines nature of roots.",
      },
      {
        id: "region_3",
        box_2d: { ymin: 720, xmin: 50, ymax: 950, xmax: 950 },
        region_type: "list",
        label: "Cases for Discriminant",
        raw_text:
          "D > 0: two distinct real roots\nD = 0: one repeated real root\nD < 0: no real roots (complex)",
      },
    ],
  };
}

/**
 * @returns {{ cards: Flashcard[] }}
 */
export function generateMockCards() {
  return {
    cards: [
      {
        id: "card_0",
        source_region_id: "region_0",
        card_type: "derivation_steps",
        front: "Derive the quadratic formula from ax² + bx + c = 0",
        back: "Complete the square to isolate x, yielding x = (-b ± √(b²-4ac)) / 2a",
        steps: [
          "Divide all terms by a: x² + (b/a)x + c/a = 0",
          "Move the constant: x² + (b/a)x = -c/a",
          "Add (b/2a)² to both sides to complete the square",
          "Factor the left side: (x + b/2a)² = (b²-4ac) / 4a²",
          "Take the square root of both sides",
          "Solve for x: x = (-b ± √(b²-4ac)) / 2a",
        ],
      },
      {
        id: "card_1",
        source_region_id: "region_1",
        card_type: "labeled_diagram",
        front: "Label the key features of this parabola",
        back: "Vertex, Axis of Symmetry, Roots (x-intercepts), Y-intercept",
        labels: [
          {
            part: "Vertex",
            description: "The turning point (h, k) — the maximum or minimum of the parabola",
          },
          {
            part: "Axis of Symmetry",
            description: "Vertical line x = h that divides the parabola into mirror halves",
          },
          {
            part: "Roots",
            description: "x-intercepts where the parabola crosses the x-axis (y = 0)",
          },
          {
            part: "Y-intercept",
            description: "Where the parabola crosses the y-axis (x = 0), always at (0, c)",
          },
        ],
      },
      {
        id: "card_2",
        source_region_id: "region_2",
        card_type: "qa",
        front: "What does the discriminant (D = b² - 4ac) tell us about the roots?",
        back: "D > 0: two distinct real roots. D = 0: one repeated real root. D < 0: no real roots (complex conjugates).",
      },
      {
        id: "card_3",
        source_region_id: "region_3",
        card_type: "timeline",
        front: "What are the three cases for the discriminant and their meanings?",
        back: "D > 0 → two roots, D = 0 → one root, D < 0 → no real roots",
        steps: [
          "D > 0: parabola crosses x-axis at two distinct points",
          "D = 0: parabola just touches x-axis at exactly one point (tangent)",
          "D < 0: parabola lies entirely above or below the x-axis",
        ],
      },
    ],
  };
}

/**
 * @returns {RemediationResult}
 */
export function generateMockRemediation() {
  return {
    explanation:
      "Looking at your notes, you wrote the discriminant as b² - 4ac. When D < 0, the square root of a negative number is not real, so there are no real roots — the parabola never crosses the x-axis. See your diagram: if the vertex is above the x-axis and the parabola opens upward, there are no x-intercepts.",
    hints: [
      "Check the sign of D in your notes — is it positive, zero, or negative?",
      "Look at your parabola diagram: does it cross the x-axis?",
    ],
    referencesSource: true,
  };
}
