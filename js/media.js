/**
 * Browser-only image and PDF helpers: decoding, rasterizing, encoding, and PDF assembly.
 * Heavy libraries are loaded on first use.
 */

import { encodeBmp } from './lib/bmp.js';
import { encodeIco } from './lib/ico.js';
import { clamp } from './lib/format.js';
import { loadScript } from './ui.js';

const asset = (path) => new URL(`../${path}`, import.meta.url).href;

/* ------------------------------------------------------------------ */
/* Library loaders                                                     */
/* ------------------------------------------------------------------ */

let pdfjsPromise;

/** Load PDF.js (rendering). */
export function loadPdfJs() {
  pdfjsPromise ??= import(asset('vendor/pdfjs/pdf.min.mjs')).then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = asset('vendor/pdfjs/pdf.worker.min.mjs');
    return lib;
  });
  return pdfjsPromise;
}

/** Load pdf-lib (creation and editing). Returns the `PDFLib` namespace. */
export async function loadPdfLib() {
  await loadScript(asset('vendor/pdf-lib/pdf-lib.min.js'));
  return globalThis.PDFLib;
}

/* ------------------------------------------------------------------ */
/* Format table                                                        */
/* ------------------------------------------------------------------ */

export const OUTPUT_FORMATS = {
  png: { label: 'PNG', mime: 'image/png', ext: 'png', lossy: false, opaque: false },
  jpeg: { label: 'JPEG', mime: 'image/jpeg', ext: 'jpg', lossy: true, opaque: true },
  webp: { label: 'WebP', mime: 'image/webp', ext: 'webp', lossy: true, opaque: false },
  avif: { label: 'AVIF', mime: 'image/avif', ext: 'avif', lossy: true, opaque: false },
  bmp: { label: 'BMP', mime: 'image/bmp', ext: 'bmp', lossy: false, opaque: true },
  ico: { label: 'ICO (icon)', mime: 'image/x-icon', ext: 'ico', lossy: false, opaque: false },
  pdf: { label: 'PDF', mime: 'application/pdf', ext: 'pdf', lossy: false, opaque: true },
};

let encoderSupport;

/**
 * Detect which optional canvas encoders this browser provides (WebP and AVIF are not universal).
 * @returns {Promise<Record<string, boolean>>}
 */
export function detectEncoders() {
  encoderSupport ??= (async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const check = (mime) => new Promise((resolve) => canvas.toBlob((blob) => resolve(blob?.type === mime), mime));
    return { webp: await check(OUTPUT_FORMATS.webp.mime), avif: await check(OUTPUT_FORMATS.avif.mime) };
  })();
  return encoderSupport;
}

/**
 * Output formats the current browser can actually produce.
 * @returns {Promise<[string, string][]>} [key, label] pairs.
 */
export async function availableOutputFormats() {
  const support = await detectEncoders();
  return Object.entries(OUTPUT_FORMATS)
    .filter(([key]) => support[key] ?? true)
    .map(([key, spec]) => [key, spec.label]);
}

/** @param {File} file */
export const isPdf = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

/* ------------------------------------------------------------------ */
/* Decoding                                                            */
/* ------------------------------------------------------------------ */

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({
        source: image,
        width: image.naturalWidth || 1024,
        height: image.naturalHeight || 1024,
        close: () => URL.revokeObjectURL(url),
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name} could not be read as an image. This browser may not support the format.`));
    };
    image.src = url;
  });
}

/**
 * Decode an image file into a drawable source.
 * @param {File} file
 * @returns {Promise<{source: CanvasImageSource, width: number, height: number, close: () => void}>}
 */
export async function decodeImage(file) {
  const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
  if (!isSvg && 'createImageBitmap' in globalThis) {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      /* Fall through to the element-based decoder. */
    }
  }
  return loadImageElement(file);
}

/**
 * Render each page of a PDF to a canvas.
 * @param {File} file
 * @param {{dpi?: number, onPage?: (page: number, total: number) => void}} [options]
 * @returns {AsyncGenerator<{canvas: HTMLCanvasElement, pageNumber: number, total: number}>}
 */
export async function* renderPdfPages(file, { dpi = 150 } = {}) {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data, isEvalSupported: false });
  let pdf;
  try {
    pdf = await task.promise;
  } catch (error) {
    await task.destroy().catch(() => {});
    if (error?.name === 'PasswordException') throw new Error(`${file.name} is password protected.`, { cause: error });
    throw new Error(`${file.name} could not be read as a PDF.`, { cause: error });
  }
  try {
    const scale = dpi / 72;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, canvas, viewport }).promise;
      canvas.pointsPerPixel = 72 / dpi;
      page.cleanup();
      yield { canvas, pageNumber, total: pdf.numPages };
    }
  } finally {
    await task.destroy().catch(() => {});
  }
}

/* ------------------------------------------------------------------ */
/* Canvas utilities                                                    */
/* ------------------------------------------------------------------ */

/** Create a canvas of the given size, or throw a readable error if the browser refuses. */
export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext('2d');
  if (!context || canvas.width !== Math.round(width) || canvas.height !== Math.round(height)) {
    throw new Error('This image is too large for your browser to process.');
  }
  return canvas;
}

/**
 * Draw a decoded image to a canvas, optionally resizing with stepwise downscaling for better quality.
 * @param {{source: CanvasImageSource, width: number, height: number}} image
 * @param {number} [targetWidth]
 * @param {number} [targetHeight]
 */
export function drawToCanvas(image, targetWidth = image.width, targetHeight = image.height) {
  let current = { source: image.source, width: image.width, height: image.height };
  const goalW = Math.max(1, Math.round(targetWidth));
  const goalH = Math.max(1, Math.round(targetHeight));
  let canvas;
  do {
    const nextW = Math.max(goalW, Math.ceil(current.width / 2));
    const nextH = Math.max(goalH, Math.ceil(current.height / 2));
    const finalStep = nextW === goalW && nextH === goalH;
    const w = finalStep || goalW >= current.width ? goalW : nextW;
    const h = finalStep || goalH >= current.height ? goalH : nextH;
    canvas = createCanvas(w, h);
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(current.source, 0, 0, w, h);
    current = { source: canvas, width: w, height: h };
  } while (current.width !== goalW || current.height !== goalH);
  return canvas;
}

/** Copy a canvas onto a solid background color. */
export function flatten(canvas, background = '#ffffff') {
  const out = createCanvas(canvas.width, canvas.height);
  const context = out.getContext('2d');
  context.fillStyle = background;
  context.fillRect(0, 0, out.width, out.height);
  context.drawImage(canvas, 0, 0);
  out.pointsPerPixel = canvas.pointsPerPixel;
  return out;
}

/** Promise wrapper around canvas.toBlob that rejects with a readable error. */
export function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The browser could not encode this image.'))),
      mime,
      quality,
    );
  });
}

const ICO_SIZE_SETS = {
  standard: [16, 32, 48, 64, 128, 256],
  favicon: [16, 32, 48],
  large: [256],
};

export const ICO_SIZE_OPTIONS = [
  ['standard', 'Standard (16 to 256 px)'],
  ['favicon', 'Favicon (16, 32, 48 px)'],
  ['large', 'Single 256 px'],
];

/**
 * Encode a canvas in the requested raster format.
 * @param {HTMLCanvasElement} canvas
 * @param {'png'|'jpeg'|'webp'|'avif'|'bmp'|'ico'} format
 * @param {{quality?: number, background?: string, icoSizes?: keyof typeof ICO_SIZE_SETS}} [options] Quality is 0 to 1.
 * @returns {Promise<Blob>}
 */
export async function encodeCanvas(
  canvas,
  format,
  { quality = 0.9, background = '#ffffff', icoSizes = 'standard' } = {},
) {
  const spec = OUTPUT_FORMATS[format];
  const q = clamp(quality, 0.01, 1);

  if (format === 'bmp') {
    const flat = flatten(canvas, background);
    const data = flat.getContext('2d').getImageData(0, 0, flat.width, flat.height);
    return new Blob([encodeBmp(data)], { type: spec.mime });
  }

  if (format === 'ico') {
    const images = [];
    for (const size of ICO_SIZE_SETS[icoSizes]) {
      const square = createCanvas(size, size);
      const scale = Math.min(size / canvas.width, size / canvas.height);
      const w = canvas.width * scale;
      const h = canvas.height * scale;
      const context = square.getContext('2d');
      context.imageSmoothingQuality = 'high';
      context.drawImage(canvas, (size - w) / 2, (size - h) / 2, w, h);
      const png = new Uint8Array(await (await canvasToBlob(square, 'image/png')).arrayBuffer());
      images.push({ width: size, height: size, png });
    }
    return new Blob([encodeIco(images)], { type: spec.mime });
  }

  const source = spec.opaque ? flatten(canvas, background) : canvas;
  const blob = await canvasToBlob(source, spec.mime, spec.lossy ? q : undefined);
  if (blob.type !== spec.mime)
    throw new Error(`This browser cannot create ${spec.label} files. Try PNG, JPEG, or WebP instead.`);
  return blob;
}

/* ------------------------------------------------------------------ */
/* PDF assembly                                                        */
/* ------------------------------------------------------------------ */

export const PAGE_SIZES = {
  fit: { label: 'Match image size' },
  a4: { label: 'A4', width: 595.28, height: 841.89 },
  letter: { label: 'US Letter', width: 612, height: 792 },
};

/**
 * Incrementally build a PDF from canvases.
 * @param {{pageSize?: keyof typeof PAGE_SIZES, margin?: number}} [options] Margin is in points (1/72 inch) and applies to fixed page sizes.
 */
export async function createPdfBuilder({ pageSize = 'fit', margin = 24 } = {}) {
  const { PDFDocument } = await loadPdfLib();
  const doc = await PDFDocument.create();
  doc.setProducer('Web Utilities');
  doc.setCreator('Web Utilities');

  return {
    get pageCount() {
      return doc.getPageCount();
    },
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {{lossless?: boolean, quality?: number, background?: string}} [options]
     */
    async addCanvas(canvas, { lossless = false, quality = 0.9, background = '#ffffff' } = {}) {
      const blob = lossless
        ? await canvasToBlob(canvas, 'image/png')
        : await canvasToBlob(flatten(canvas, background), 'image/jpeg', clamp(quality, 0.01, 1));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const image = lossless ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

      const pointsPerPixel = canvas.pointsPerPixel ?? 0.75;
      const naturalW = canvas.width * pointsPerPixel;
      const naturalH = canvas.height * pointsPerPixel;

      if (pageSize === 'fit') {
        doc.addPage([naturalW, naturalH]).drawImage(image, { x: 0, y: 0, width: naturalW, height: naturalH });
        return;
      }
      const { width, height } = PAGE_SIZES[pageSize];
      const landscape = naturalW > naturalH;
      const pageW = landscape ? height : width;
      const pageH = landscape ? width : height;
      const scale = Math.min((pageW - margin * 2) / naturalW, (pageH - margin * 2) / naturalH, Infinity);
      const drawW = naturalW * scale;
      const drawH = naturalH * scale;
      doc
        .addPage([pageW, pageH])
        .drawImage(image, { x: (pageW - drawW) / 2, y: (pageH - drawH) / 2, width: drawW, height: drawH });
    },
    /** @returns {Promise<Blob>} */
    async toBlob() {
      return new Blob([await doc.save()], { type: 'application/pdf' });
    },
  };
}
