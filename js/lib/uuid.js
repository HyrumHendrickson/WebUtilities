/**
 * UUID generation (RFC 9562 versions 4 and 7).
 */

const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

function format(bytes) {
  const h = hex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Random (version 4) UUID. */
export function uuidV4(cryptoSource = globalThis.crypto) {
  const bytes = cryptoSource.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return format(bytes);
}

/**
 * Time-ordered (version 7) UUID: 48-bit Unix millisecond timestamp followed by random bits.
 * @param {number} [now] Milliseconds since the Unix epoch.
 */
export function uuidV7(now = Date.now(), cryptoSource = globalThis.crypto) {
  const bytes = cryptoSource.getRandomValues(new Uint8Array(16));
  let ms = BigInt(Math.floor(now));
  for (let i = 5; i >= 0; i--) {
    bytes[i] = Number(ms & 0xffn);
    ms >>= 8n;
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return format(bytes);
}

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

/** Check whether a string is a canonical UUID. */
export function isUuid(value) {
  return /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(value) || value === NIL_UUID;
}
