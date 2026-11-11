/**
 * Password generation using the Web Crypto random source.
 */

export const CHARSETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/~',
};

const AMBIGUOUS = /[O0oIl1|]/g;

/**
 * Uniform random integer in [0, max) using rejection sampling.
 * @param {number} max Exclusive upper bound (1 to 2^32).
 * @param {Crypto} [cryptoSource]
 */
export function secureRandomInt(max, cryptoSource = globalThis.crypto) {
  if (!Number.isInteger(max) || max < 1 || max > 2 ** 32)
    throw new RangeError('max must be an integer between 1 and 2^32');
  const limit = 2 ** 32 - (2 ** 32 % max);
  const buffer = new Uint32Array(1);
  do {
    cryptoSource.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

/**
 * Generate a password containing at least one character from each selected set.
 * @param {{length?: number, lower?: boolean, upper?: boolean, digits?: boolean, symbols?: boolean, excludeAmbiguous?: boolean}} [options]
 * @returns {string}
 */
export function generatePassword({
  length = 20,
  lower = true,
  upper = true,
  digits = true,
  symbols = true,
  excludeAmbiguous = false,
} = {}) {
  const selected = Object.entries({ lower, upper, digits, symbols })
    .filter(([, on]) => on)
    .map(([name]) => (excludeAmbiguous ? CHARSETS[name].replace(AMBIGUOUS, '') : CHARSETS[name]));
  if (selected.length === 0) throw new Error('Select at least one character type.');
  if (length < selected.length) throw new RangeError('Length is too short for the selected character types.');

  const pool = selected.join('');
  const chars = selected.map((set) => set[secureRandomInt(set.length)]);
  while (chars.length < length) chars.push(pool[secureRandomInt(pool.length)]);

  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * Estimate entropy in bits assuming each character is drawn uniformly from the character classes present.
 * This is an upper bound for random passwords and meaningless for human-chosen ones.
 * @param {string} password
 */
export function estimateEntropy(password) {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^a-zA-Z\d]/.test(password)) pool += CHARSETS.symbols.length;
  return pool === 0 ? 0 : [...password].length * Math.log2(pool);
}

/** Map entropy bits to a short label. */
export function strengthLabel(bits) {
  if (bits < 40) return 'Weak';
  if (bits < 64) return 'Fair';
  if (bits < 100) return 'Strong';
  return 'Very strong';
}
