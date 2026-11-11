/**
 * Build an ICO container from PNG-encoded images (supported by all modern browsers and Windows Vista+).
 * @param {{width: number, height: number, png: Uint8Array}[]} images Each side must be 1 to 256 pixels.
 * @returns {Uint8Array}
 */
export function encodeIco(images) {
  if (images.length === 0) throw new Error('At least one image is required.');
  const headerSize = 6 + images.length * 16;
  const total = headerSize + images.reduce((sum, image) => sum + image.png.length, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);

  let offset = headerSize;
  images.forEach((image, index) => {
    if (image.width > 256 || image.height > 256) throw new RangeError('ICO images can be at most 256 by 256 pixels.');
    const entry = 6 + index * 16;
    out[entry] = image.width === 256 ? 0 : image.width;
    out[entry + 1] = image.height === 256 ? 0 : image.height;
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, image.png.length, true);
    view.setUint32(entry + 12, offset, true);
    out.set(image.png, offset);
    offset += image.png.length;
  });
  return out;
}
