/**
 * Small formatting and filename helpers shared across tools.
 * Pure functions only: no DOM access.
 */

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/**
 * Format a byte count using decimal (SI) units.
 * @param {number} bytes
 * @param {number} [digits]
 * @returns {string}
 */
export function formatBytes(bytes, digits = 1) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1000) return `${Math.round(bytes)} B`;
  const exponent = Math.min(Math.floor(Math.log10(bytes) / 3), UNITS.length - 1);
  const value = bytes / 1000 ** exponent;
  return `${value.toFixed(digits)} ${UNITS[exponent]}`;
}

/**
 * Clamp a number into an inclusive range.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Remove the final extension from a filename.
 * @param {string} name
 * @returns {string}
 */
export function stripExtension(name) {
  const index = name.lastIndexOf('.');
  return index > 0 ? name.slice(0, index) : name;
}

/**
 * Make a string safe to use as a download filename.
 * @param {string} name
 * @param {string} [fallback]
 * @returns {string}
 */
export function sanitizeFilename(name, fallback = 'file') {
  // eslint-disable-next-line no-control-regex
  const cleaned = name.replace(/[\u0000-\u001f<>:"/\\|?*]+/g, '_').trim();
  return cleaned.replace(/^\.+/, '') || fallback;
}

/**
 * Format a number for display without scientific notation noise.
 * @param {number} value
 * @param {number} [significant]
 * @returns {string}
 */
export function formatNumber(value, significant = 10) {
  if (!Number.isFinite(value)) return String(value);
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e15 || abs < 1e-9) return value.toExponential(6);
  return new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: significant,
    useGrouping: abs >= 10000,
  }).format(value);
}

/**
 * Return `name`, or a numbered variant if it is already in `taken`. The chosen name is added to `taken`.
 * @param {string} name
 * @param {Set<string>} taken
 * @returns {string}
 */
export function uniqueName(name, taken) {
  if (!taken.has(name)) {
    taken.add(name);
    return name;
  }
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let counter = 2;
  while (taken.has(`${base}-${counter}${ext}`)) counter++;
  const result = `${base}-${counter}${ext}`;
  taken.add(result);
  return result;
}
