// ============================================
// SHARED CONTRACTS — DO NOT MODIFY WITHOUT SYNC
// JavaScript uses JSDoc for shared data-shape documentation.
// Both Branch A and Branch B MUST import from this file.
// NEVER redefine these shapes elsewhere.
// ============================================

/**
 * @typedef {"equation"|"diagram"|"definition"|"list"|"prose"} RegionType
 * @typedef {"qa"|"derivation_steps"|"labeled_diagram"|"timeline"} CardType
 *
 * @typedef {Object} Box2D
 * @property {number} ymin - 0–1000 normalized
 * @property {number} xmin - 0–1000 normalized
 * @property {number} ymax - 0–1000 normalized
 * @property {number} xmax - 0–1000 normalized
 *
 * @typedef {Object} Region
 * @property {string} id
 * @property {Box2D} box_2d
 * @property {RegionType} region_type
 * @property {string} label
 * @property {string} raw_text
 *
 * @typedef {Object} Flashcard
 * @property {string} id
 * @property {string} source_region_id
 * @property {CardType} card_type
 * @property {string} front
 * @property {string} back
 * @property {string[]} [steps]           - Only for derivation_steps
 * @property {DiagramLabel[]} [labels]    - Only for labeled_diagram
 *
 * @typedef {Object} DiagramLabel
 * @property {string} part
 * @property {string} description
 *
 * @typedef {Object} PhotoRecord
 * @property {string} id
 * @property {string} uid
 * @property {string} originalPhotoUrl
 * @property {string} originalPhotoPath
 * @property {Date} createdAt
 * @property {Region[]} regions
 * @property {Flashcard[]} cards
 *
 * @typedef {Object} QuizSession
 * @property {string} id
 * @property {string} photoId
 * @property {string} uid
 * @property {Date} startedAt
 * @property {Date} [completedAt]
 * @property {QuizResponse[]} responses
 *
 * @typedef {Object} QuizResponse
 * @property {string} cardId
 * @property {boolean} correct
 * @property {string} userAnswer
 * @property {number} timeSpentMs
 *
 * @typedef {Object} RemediationPayload
 * @property {string} cropImageBase64
 * @property {string} wrongAnswer
 * @property {string} correctAnswer
 * @property {Region} regionContext
 * @property {CardType} cardType
 *
 * @typedef {Object} RemediationResult
 * @property {string} explanation
 * @property {string[]} hints
 * @property {boolean} referencesSource
 *
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {*} [data]
 * @property {string} [error]
 *
 * @typedef {Object} DetectRegionsResponse
 * @property {Region[]} regions
 *
 * @typedef {Object} GenerateCardsResponse
 * @property {Flashcard[]} cards
 *
 * @typedef {Object} PixelBox
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

// These JSDoc typedefs are documentation-only; JavaScript does not require
// runtime interfaces or type declarations.
export {};
