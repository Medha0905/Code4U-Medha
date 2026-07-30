/**
 * AI Menu Photo Extraction — step 2: structuring.
 * Turns raw OCR text lines into { name, price } suggestions using price
 * detection. Deliberately does NOT try to guess category, prep time, stock,
 * or a photo — those are vendor-entered per item in the review step, since
 * OCR has no way to know real kitchen prep times or stock counts, and
 * heuristically guessing "category headings" from noisy scanned text
 * (logos/watermarks) produced false positives in practice.
 * This is a human-in-the-loop tool: the vendor reviews and edits every
 * suggested row before anything is actually saved to the menu.
 */

const PRICE_PATTERNS = [
  /(?:₹|rs\.?|inr)\s?(\d{1,4}(?:\.\d{1,2})?)/i, // ₹80, Rs 80, Rs.80, INR 80
  /(\d{1,4}(?:\.\d{1,2})?)\s*(?:₹|rs\.?|inr)/i, // 80₹, 80 Rs
];

function extractPrice(line) {
  for (const pattern of PRICE_PATTERNS) {
    const match = line.match(pattern);
    if (match) return { price: parseFloat(match[1]), remainder: line.replace(match[0], '').trim() };
  }
  // Bare trailing number (e.g. "Masala Dosa 80") — only if there's real text before it
  const bareMatch = line.match(/^(.{3,}?)\s+(\d{2,4}(?:\.\d{1,2})?)$/);
  if (bareMatch) return { price: parseFloat(bareMatch[2]), remainder: bareMatch[1].trim() };
  return null;
}

function cleanName(text) {
  return text
    .replace(/[|_~•\-]+$/g, '')
    .replace(/^[|_~•\-]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Parses raw OCR text into an array of { name, price } suggestions. */
function parseMenuText(rawText) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const suggestions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const priced = extractPrice(line);
    if (priced && priced.remainder.length >= 2) {
      suggestions.push({ name: cleanName(priced.remainder), price: priced.price });
      continue;
    }

    // Name on this line, price possibly on the very next line (common layout)
    if (!priced && lines[i + 1] && /^\s*(?:₹|rs\.?|inr)?\s?\d{1,4}(?:\.\d{1,2})?\s*$/i.test(lines[i + 1])) {
      const priceOnly = lines[i + 1].match(/\d{1,4}(?:\.\d{1,2})?/);
      if (priceOnly && line.length >= 2) {
        suggestions.push({ name: cleanName(line), price: parseFloat(priceOnly[0]) });
        i += 1; // consume the price-only line
      }
    }
  }

  return suggestions;
}

module.exports = { parseMenuText };
