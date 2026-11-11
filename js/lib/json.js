/**
 * JSON formatting and validation helpers.
 */

/**
 * Convert a character offset to 1-based line and column.
 * @param {string} text
 * @param {number} position
 */
export function positionToLineColumn(text, position) {
  const before = text.slice(0, Math.max(0, position));
  const lines = before.split('\n');
  return { line: lines.length, column: lines.at(-1).length + 1 };
}

/**
 * Extract a friendly error from a JSON.parse failure across browser engines.
 * @param {Error} error
 * @param {string} text
 */
export function describeJsonError(error, text) {
  const message = String(error.message).replace(/\s+in JSON at position \d+(?:\s*\(line \d+ column \d+\))?/i, '');
  const original = String(error.message);
  const lineMatch = original.match(/line (\d+) column (\d+)/i);
  if (lineMatch) return { message, line: Number(lineMatch[1]), column: Number(lineMatch[2]) };
  const posMatch = original.match(/position (\d+)/i);
  if (posMatch) return { message, ...positionToLineColumn(text, Number(posMatch[1])) };
  return { message, line: null, column: null };
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortKeysDeep(value[k])]),
    );
  }
  return value;
}

/**
 * Parse and re-serialize JSON.
 * @param {string} text
 * @param {{indent?: number|'tab'|0, sortKeys?: boolean}} [options] An indent of 0 minifies.
 * @returns {{ok: true, output: string} | {ok: false, error: {message: string, line: number|null, column: number|null}}}
 */
export function formatJson(text, { indent = 2, sortKeys = false } = {}) {
  try {
    let value = JSON.parse(text);
    if (sortKeys) value = sortKeysDeep(value);
    const space = indent === 'tab' ? '\t' : indent;
    return { ok: true, output: JSON.stringify(value, null, space) };
  } catch (error) {
    return { ok: false, error: describeJsonError(error, text) };
  }
}
