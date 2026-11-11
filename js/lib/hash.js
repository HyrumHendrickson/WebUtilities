/**
 * Cryptographic digests via SubtleCrypto.
 */

export const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

/** @param {Uint8Array|ArrayBuffer} bytes */
export function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute a digest and return it as lowercase hex.
 * @param {string} algorithm One of HASH_ALGORITHMS.
 * @param {Uint8Array|ArrayBuffer} data
 */
export async function digestHex(algorithm, data) {
  const digest = await globalThis.crypto.subtle.digest(algorithm, data);
  return bytesToHex(digest);
}
