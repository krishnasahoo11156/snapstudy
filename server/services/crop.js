import sharp from "sharp";

/**
 * Standardize any box format (array or object) to a Box2D object.
 * @param {import("../../src/types/index.js").Box2D | [number, number, number, number]} box
 * @returns {import("../../src/types/index.js").Box2D}
 */
export function normalizeBox(box) {
  if (Array.isArray(box)) {
    return {
      ymin: Number(box[0]) || 0,
      xmin: Number(box[1]) || 0,
      ymax: Number(box[2]) || 1000,
      xmax: Number(box[3]) || 1000,
    };
  }
  return {
    ymin: Number(box?.ymin) || 0,
    xmin: Number(box?.xmin) || 0,
    ymax: Number(box?.ymax) || 1000,
    xmax: Number(box?.xmax) || 1000,
  };
}

/**
 * Crop a region from an image buffer using normalized 0–1000 box coordinates.
 *
 * @param {Buffer} imageBuffer - Raw image buffer (JPEG/PNG)
 * @param {import("../../src/types/index.js").Box2D | [number, number, number, number]} rawBox - Normalized bounding box (0–1000)
 * @param {number} imgWidth - Full image width in pixels
 * @param {number} imgHeight - Full image height in pixels
 * @returns {Promise<Buffer>} - Cropped image buffer (JPEG)
 */
export async function cropRegion(imageBuffer, rawBox, imgWidth, imgHeight) {
  const box = normalizeBox(rawBox);
  const x = Math.round((box.xmin / 1000) * imgWidth);
  const y = Math.round((box.ymin / 1000) * imgHeight);
  const width = Math.round(((box.xmax - box.xmin) / 1000) * imgWidth);
  const height = Math.round(((box.ymax - box.ymin) / 1000) * imgHeight);

  // Clamp to image bounds to avoid sharp errors on edge-region boxes
  const safeX = Math.max(0, Math.min(x, imgWidth - 1));
  const safeY = Math.max(0, Math.min(y, imgHeight - 1));
  const safeWidth = Math.max(10, Math.min(Math.max(width, 10), imgWidth - safeX));
  const safeHeight = Math.max(10, Math.min(Math.max(height, 10), imgHeight - safeY));

  return sharp(imageBuffer)
    .extract({ left: safeX, top: safeY, width: safeWidth, height: safeHeight })
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Crop an image directly from base64 string and return base64 string.
 * @param {string} base64Str - Data URL or plain base64
 * @param {import("../../src/types/index.js").Box2D} box
 * @returns {Promise<string>} - Base64 encoded cropped JPEG (without data uri prefix)
 */
export async function cropBase64Image(base64Str, box) {
  const rawBase64 = base64Str.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(rawBase64, "base64");
  const dimensions = await getImageDimensions(buffer);
  const croppedBuffer = await cropRegion(buffer, box, dimensions.width, dimensions.height);
  return croppedBuffer.toString("base64");
}

/**
 * Get image dimensions from a buffer.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ width: number, height: number }>}
 */
export async function getImageDimensions(imageBuffer) {
  const meta = await sharp(imageBuffer).metadata();
  return { width: meta.width || 1000, height: meta.height || 1000 };
}

