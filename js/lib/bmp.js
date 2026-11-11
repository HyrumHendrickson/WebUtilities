/**
 * Encode RGBA pixel data as a 24-bit BMP. Transparent pixels must be flattened
 * onto a background before calling this function.
 * @param {{width: number, height: number, data: Uint8ClampedArray|Uint8Array}} image
 * @returns {Uint8Array}
 */
export function encodeBmp({ width, height, data }) {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelBytes = rowSize * height;
  const out = new Uint8Array(54 + pixelBytes);
  const view = new DataView(out.buffer);
  out[0] = 0x42;
  out[1] = 0x4d;
  view.setUint32(2, out.length, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelBytes, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);

  for (let y = 0; y < height; y++) {
    let target = 54 + (height - 1 - y) * rowSize;
    for (let x = 0; x < width; x++) {
      const source = (y * width + x) * 4;
      out[target++] = data[source + 2];
      out[target++] = data[source + 1];
      out[target++] = data[source];
    }
  }
  return out;
}
