import assert from "assert";
import { normalizedToPixel, pixelToNormalized, normalizeBox } from "../src/utils/coordinates.js";
import { cropRegion, cropBase64Image, getImageDimensions } from "./services/crop.js";
import { parseGeminiJson } from "./services/gemini.js";
import sharp from "sharp";

async function runTests() {
  console.log("🚀 Running Branch A Test Verification Suite...\n");

  // 1. Test Coordinate Utility (A3)
  console.log("Testing A3: Coordinate Utility...");
  const boxObj = { ymin: 50, xmin: 50, ymax: 300, xmax: 950 };
  const pixelBox = normalizedToPixel(boxObj, 1000, 1000);
  assert.strictEqual(pixelBox.x, 50);
  assert.strictEqual(pixelBox.y, 50);
  assert.strictEqual(pixelBox.width, 900);
  assert.strictEqual(pixelBox.height, 250);

  // Array format [ymin, xmin, ymax, xmax]
  const boxArr = [50, 50, 300, 950];
  const pixelBoxArr = normalizedToPixel(boxArr, 1000, 1000);
  assert.strictEqual(pixelBoxArr.x, 50);
  assert.strictEqual(pixelBoxArr.y, 50);
  assert.strictEqual(pixelBoxArr.width, 900);
  assert.strictEqual(pixelBoxArr.height, 250);

  // Reverse conversion
  const normBox = pixelToNormalized(pixelBox, 1000, 1000);
  assert.strictEqual(normBox.xmin, 50);
  assert.strictEqual(normBox.ymin, 50);
  assert.strictEqual(normBox.xmax, 950);
  assert.strictEqual(normBox.ymax, 300);
  console.log("  ✓ normalizedToPixel & pixelToNormalized verified.\n");

  // 2. Test Image Cropping Service (A7)
  console.log("Testing A7: Sharp Image Cropping Service...");
  // Create a 1000x1000 solid image
  const testImgBuffer = await sharp({
    create: {
      width: 1000,
      height: 1000,
      channels: 4,
      background: { r: 50, g: 100, b: 150, alpha: 1 },
    },
  })
    .jpeg()
    .toBuffer();

  const croppedBuf = await cropRegion(testImgBuffer, boxObj, 1000, 1000);
  const croppedMeta = await getImageDimensions(croppedBuf);
  assert.strictEqual(croppedMeta.width, 900);
  assert.strictEqual(croppedMeta.height, 250);

  // Base64 crop test
  const base64In = testImgBuffer.toString("base64");
  const croppedBase64 = await cropBase64Image(base64In, boxObj);
  assert(croppedBase64.length > 0);
  console.log("  ✓ Sharp image cropping deterministic output verified.\n");

  // 3. Test parseGeminiJson (A2)
  console.log("Testing A2: Gemini JSON cleaner and parser...");
  const rawMarkdownJson = '```json\n{"success": true, "regions": [{"id": "r1"}]}\n```';
  const parsed = parseGeminiJson(rawMarkdownJson);
  assert.strictEqual(parsed.success, true);
  assert.strictEqual(parsed.regions[0].id, "r1");
  console.log("  ✓ parseGeminiJson stripped markdown fences successfully.\n");

  console.log("🎉 All Branch A verification checks passed successfully!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
