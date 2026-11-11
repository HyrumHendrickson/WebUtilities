import { base64ToText } from './encoding.js';

/**
 * Decode a JSON Web Token without verifying its signature.
 * @param {string} token
 * @returns {{header: object, payload: object, signature: string}}
 */
export function decodeJwt(token) {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('A JWT has three parts separated by dots.');
  }
  const parse = (part, label) => {
    try {
      return JSON.parse(base64ToText(part));
    } catch {
      throw new Error(`The ${label} is not valid Base64URL-encoded JSON.`);
    }
  };
  return { header: parse(parts[0], 'header'), payload: parse(parts[1], 'payload'), signature: parts[2] };
}
