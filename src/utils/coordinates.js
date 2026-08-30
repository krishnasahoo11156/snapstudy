/** @import { Box2D, PixelBox } from "../types" */

/**
 * Convert a Gemini-normalized bounding box (0–1000 scale) to pixel coordinates
 * for a given image rendered at a specific pixel size.
 *
 * @param {Box2D} box - Normalized box from Gemini (0–1000 per axis)
 * @param {number} imgWidth - Rendered image width in pixels
 * @param {number} imgHeight - Rendered image height in pixels
 * @returns {PixelBox}
 *
 * @example
 * // 1000×1000 image, box {ymin:50, xmin:50, ymax:300, xmax:950}
 * // → { x:50, y:50, width:900, height:250 }
 * normalizedToPixel({ ymin:50, xmin:50, ymax:300, xmax:950 }, 1000, 1000)
 */
export function normalizedToPixel(box, imgWidth, imgHeight) {
  return {
    x: Math.round((box.xmin / 1000) * imgWidth),
    y: Math.round((box.ymin / 1000) * imgHeight),
    width: Math.round(((box.xmax - box.xmin) / 1000) * imgWidth),
    height: Math.round(((box.ymax - box.ymin) / 1000) * imgHeight),
  };
}

/**
 * Convert pixel coordinates back to normalized 0–1000 scale.
 * Useful for re-encoding crops for the Gemini API.
 *
 * @param {PixelBox} pixelBox
 * @param {number} imgWidth
 * @param {number} imgHeight
 * @returns {Box2D}
 */
export function pixelToNormalized(pixelBox, imgWidth, imgHeight) {
  return {
    xmin: Math.round((pixelBox.x / imgWidth) * 1000),
    ymin: Math.round((pixelBox.y / imgHeight) * 1000),
    xmax: Math.round(((pixelBox.x + pixelBox.width) / imgWidth) * 1000),
    ymax: Math.round(((pixelBox.y + pixelBox.height) / imgHeight) * 1000),
  };
}
