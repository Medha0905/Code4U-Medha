/**
 * AI Menu Photo Extraction — step 2: structuring.
 * Turns raw OCR text lines into { name, price, category } suggestions using
 * pattern rules (price detection, all-caps section headers as categories).
 * This is intentionally a human-in-the-loop tool: the vendor reviews and
 * edits every suggested row before anything is actually saved to the menu,
 * since OCR + heuristics on real-world menu photos will never be perfect.
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

function isLikelyCategoryHeading(line) {
  const clean = line.trim();
  if (clean.length < 3 || clean.length > 30) return false;
  if (/\d/.test(clean)) return false; // headings rarely contain numbers
  const letters = clean.replace(/[^a-zA-Z]/g, '');
  return letters.length > 0 && clean === clean.toUpperCase();
}

function cleanName(text) {
  return text
    .replace(/[|_~•\-]+$/g, '')
    .replace(/^[|_~•\-]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Parses raw OCR text into an array of suggested menu items. */
function parseMenuText(rawText) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const suggestions = [];
  let currentCategory = 'Menu';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isLikelyCategoryHeading(line)) {
      currentCategory = line
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      continue;
    }

    const priced = extractPrice(line);
    if (priced && priced.remainder.length >= 2) {
      suggestions.push({
        name: cleanName(priced.remainder),
        price: priced.price,
        category: currentCategory,
      });
      continue;
    }

    // Name on this line, price possibly on the very next line (common layout)
    if (!priced && lines[i + 1] && /^\s*(?:₹|rs\.?|inr)?\s?\d{1,4}(?:\.\d{1,2})?\s*$/i.test(lines[i + 1])) {
      const priceOnly = lines[i + 1].match(/\d{1,4}(?:\.\d{1,2})?/);
      if (priceOnly && line.length >= 2 && !isLikelyCategoryHeading(line)) {
        suggestions.push({
          name: cleanName(line),
          price: parseFloat(priceOnly[0]),
          category: currentCategory,
        });
        i += 1; // consume the price-only line
      }
    }
  }

  return suggestions;
}

module.exports = { parseMenuText };
