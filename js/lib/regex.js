/**
 * Regular-expression evaluation helper for the tester tool.
 */

/**
 * Run a regular expression and collect its matches.
 * @param {string} pattern
 * @param {string} flags
 * @param {string} text
 * @param {number} [limit] Maximum matches to return.
 * @returns {{matches: {text: string, index: number, groups: (string|undefined)[], named: Record<string, string>|null}[], truncated: boolean}}
 */
export function runRegex(pattern, flags, text, limit = 1000) {
  const safeFlags = [...new Set(flags)].join('').replace(/[^gimsuyv]/g, '');
  const regex = new RegExp(pattern, safeFlags.includes('g') ? safeFlags : `${safeFlags}g`);
  const matches = [];
  let truncated = false;
  for (const match of text.matchAll(regex)) {
    if (matches.length >= limit) {
      truncated = true;
      break;
    }
    matches.push({
      text: match[0],
      index: match.index,
      groups: match.slice(1),
      named: match.groups ? { ...match.groups } : null,
    });
  }
  return { matches, truncated };
}
