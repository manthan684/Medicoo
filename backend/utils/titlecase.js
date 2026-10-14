// "sharma medical" -> "Sharma Medical", "main market, sonipat" -> "Main Market, Sonipat"
// only the first letter of each word changes; the other letters stay as typed
exports.titleCase = (text) => {
  if (typeof text !== "string") return text;
  return text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(^|[\s\-\/(])(\p{L})/gu, (m, before, letter) => before + letter.toUpperCase());
};