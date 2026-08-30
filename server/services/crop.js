import sharp from "sharp";

/**
 * Crop a region from an image buffer using normalized 0–1000 box coordinates.
 *
 * @param {Buffer} imageBuffer - Raw image buffer (JPEG/PNG)
 * @param {import("../../src/types/index.js").Box2D} box - Normalized bounding box (0–1000)
 * @param {number} imgWidth - Full image width in pixels
 * @param {number} imgHeight - Full image height in pixels
 * @returns {Promise<Buffer>} - Cropped image buffer (JPEG)
 */
export async function cropRegion(imageBuffer, box, imgWidth, imgHeight) {
  const x = Math.round((box.xmin / 1000) * imgWidth);
  const y = Math.round((box.ymin / 1000) * imgHeight);
  const width = Math.round(((box.xmax - box.xmin) / 1000) * imgWidth);
  const height = Math.round(((box.ymax - box.ymin) / 1000) * imgHeight);

  // Clamp to image bounds to avoid sharp errors on edge-region boxes
  const safeX = Math.max(0, Math.min(x, imgWidth - 1));
  const safeY = Math.max(0, Math.min(y, imgHeight - 1));
  const safeWidth = Math.max(1, Math.min(width, imgWidth - safeX));
  const safeHeight = Math.max(1, Math.min(height, imgHeight - safeY));

  return sharp(imageBuffer)
    .extract({ left: safeX, top: safeY, width: safeWidth, height: safeHeight })
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Get image dimensions from a buffer.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ width: number, height: number }>}
 */
export async function getImageDimensions(imageBuffer) {
  const meta = await sharp(imageBuffer).metadata();
  return { width: meta.width, height: meta.height };
}
