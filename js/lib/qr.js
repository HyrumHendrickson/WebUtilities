/**
 * QR code helpers that do not depend on the DOM or on the QR encoder itself.
 */

/**
 * Render a boolean module matrix as a compact SVG document.
 * @param {boolean[][]} matrix Square matrix where `true` is a dark module.
 * @param {{margin?: number, size?: number, foreground?: string, background?: string | null}} [options]
 *   `margin` is the quiet zone in modules; `size` is the rendered width and height in pixels.
 *   A `null` background leaves the image transparent.
 * @returns {string}
 */
export function matrixToSvg(matrix, { margin = 4, size = 320, foreground = '#000000', background = '#ffffff' } = {}) {
  const count = matrix.length;
  const total = count + margin * 2;
  let path = '';
  for (let y = 0; y < count; y++) {
    let x = 0;
    while (x < count) {
      if (!matrix[y][x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < count && matrix[y][x]) x++;
      path += `M${start + margin} ${y + margin}h${x - start}v1h-${x - start}z`;
    }
  }
  const backdrop = background ? `<rect width="${total}" height="${total}" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" shape-rendering="crispEdges">${backdrop}<path d="${path}" fill="${foreground}"/></svg>`;
}

/**
 * Escape a value for the Wi-Fi QR payload format.
 * @param {string} value
 */
const escapeWifi = (value) => value.replace(/([\\;,:"])/g, '\\$1');

/**
 * Build the payload that phones recognize as a Wi-Fi network.
 * @param {{ssid: string, password?: string, security?: 'WPA'|'WEP'|'nopass', hidden?: boolean}} network
 */
export function wifiPayload({ ssid, password = '', security = 'WPA', hidden = false }) {
  if (!ssid) throw new Error('Enter the network name.');
  const parts = [`T:${security}`, `S:${escapeWifi(ssid)}`];
  if (security !== 'nopass') parts.push(`P:${escapeWifi(password)}`);
  if (hidden) parts.push('H:true');
  return `WIFI:${parts.join(';')};;`;
}

/**
 * Detect text that looks like a web address missing its scheme.
 * @param {string} text
 */
export function looksLikeBareDomain(text) {
  return /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#]\S*)?$/i.test(text.trim());
}
