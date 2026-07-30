const { createWorker } = require('tesseract.js');

/**
 * AI Menu Photo Extraction — step 1: OCR.
 * Runs Tesseract.js (open-source OCR, runs locally, no external API key or
 * per-call cost) against the uploaded menu photo and returns raw text lines.
 * Step 2 (parsing into name/price/category) happens in menuExtractionService.js.
 */
async function extractTextFromImage(imagePath) {
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(imagePath);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

module.exports = { extractTextFromImage };
