/**
 * Encoding helpers: Base64, percent-encoding, URL parsing, HTML entities.
 */

/**
 * Encode bytes as standard Base64.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Decode Base64 or Base64URL (padding optional, whitespace ignored) into bytes.
 * @param {string} input
 * @returns {Uint8Array}
 */
export function base64ToBytes(input) {
  const normalized = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  if (!/^[A-Za-z0-9+/]*$/.test(normalized) || normalized.length % 4 === 1) {
    throw new Error('Input is not valid Base64.');
  }
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/**
 * Encode text as Base64 (UTF-8).
 * @param {string} text
 * @param {{urlSafe?: boolean, padding?: boolean}} [options]
 */
export function textToBase64(text, { urlSafe = false, padding = true } = {}) {
  let out = bytesToBase64(new TextEncoder().encode(text));
  if (urlSafe) out = out.replace(/\+/g, '-').replace(/\//g, '_');
  if (!padding) out = out.replace(/=+$/, '');
  return out;
}

/**
 * Decode Base64 into UTF-8 text.
 * @param {string} input
 */
export function base64ToText(input) {
  const bytes = base64ToBytes(input);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('The decoded data is not UTF-8 text. Use the file option to save it instead.');
  }
}

/**
 * Percent-encode text.
 * @param {string} text
 * @param {'component'|'full'} [mode] `component` encodes everything reserved; `full` keeps URL structure.
 */
export function percentEncode(text, mode = 'component') {
  return mode === 'full' ? encodeURI(text) : encodeURIComponent(text);
}

/**
 * Decode percent-encoded text.
 * @param {string} text
 * @param {{plusAsSpace?: boolean}} [options]
 */
export function percentDecode(text, { plusAsSpace = false } = {}) {
  try {
    return decodeURIComponent(plusAsSpace ? text.replace(/\+/g, ' ') : text);
  } catch {
    throw new Error('Input contains an invalid percent-encoded sequence.');
  }
}

/**
 * Break a URL into its components.
 * @param {string} input
 */
export function parseUrl(input) {
  let url;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error('Enter a complete URL, including the scheme (for example https://example.com).');
  }
  return {
    href: url.href,
    origin: url.origin,
    protocol: url.protocol,
    username: url.username,
    password: url.password,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    params: [...url.searchParams.entries()],
  };
}

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  copy: '©',
  reg: '®',
  hellip: '…',
  mdash: '—',
  ndash: '–',
};

/** Escape the five characters that are significant in HTML. */
export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Decode named and numeric HTML entities. */
export function unescapeHtml(text) {
  return text.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (match, dec, hex, name) => {
    if (name) return NAMED_ENTITIES[name.toLowerCase()] ?? match;
    const code = dec ? Number.parseInt(dec, 10) : Number.parseInt(hex, 16);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}
