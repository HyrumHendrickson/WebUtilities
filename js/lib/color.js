/**
 * Color parsing, conversion, and contrast helpers.
 */

const clampByte = (n) => Math.min(255, Math.max(0, Math.round(n)));

/**
 * Parse a CSS color string (hex, rgb[a], hsl[a]).
 * @param {string} input
 * @returns {{r: number, g: number, b: number, a: number}}
 */
export function parseColor(input) {
  const value = input.trim().toLowerCase();

  const hex = value.match(/^#?([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/);
  if (hex) {
    let digits = hex[1];
    if (digits.length <= 4) digits = [...digits].map((d) => d + d).join('');
    const n = (i) => Number.parseInt(digits.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: digits.length === 8 ? n(6) / 255 : 1 };
  }

  const fn = value.match(/^(rgba?|hsla?)\(\s*([^)]+)\)$/);
  if (fn) {
    const parts = fn[2].split(/[\s,/]+/).filter(Boolean);
    const alpha =
      parts[3] === undefined
        ? 1
        : parts[3].endsWith('%')
          ? Number.parseFloat(parts[3]) / 100
          : Number.parseFloat(parts[3]);
    if (parts.length >= 3 && Number.isFinite(alpha)) {
      if (fn[1].startsWith('rgb')) {
        const channel = (p) => (p.endsWith('%') ? (Number.parseFloat(p) / 100) * 255 : Number.parseFloat(p));
        const [r, g, b] = parts.slice(0, 3).map(channel);
        if ([r, g, b].every(Number.isFinite))
          return { r: clampByte(r), g: clampByte(g), b: clampByte(b), a: Math.min(1, Math.max(0, alpha)) };
      } else {
        const h = Number.parseFloat(parts[0]);
        const s = Number.parseFloat(parts[1]);
        const l = Number.parseFloat(parts[2]);
        if ([h, s, l].every(Number.isFinite)) return { ...hslToRgb(h, s, l), a: Math.min(1, Math.max(0, alpha)) };
      }
    }
  }
  throw new Error('Unrecognized color. Try a value like #3f9ccb, rgb(63 156 203), or hsl(201 58% 51%).');
}

/** @returns {{h: number, s: number, l: number}} Hue in degrees, saturation and lightness in percent. */
export function rgbToHsl({ r, g, b }) {
  const [rn, gn, bn] = [r, g, b].map((v) => v / 255);
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 };
}

/** @returns {{r: number, g: number, b: number}} */
export function hslToRgb(h, s, l) {
  const sn = Math.min(100, Math.max(0, s)) / 100;
  const ln = Math.min(100, Math.max(0, l)) / 100;
  const hue = ((h % 360) + 360) % 360;
  const k = (n) => (n + hue / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: clampByte(f(0) * 255), g: clampByte(f(8) * 255), b: clampByte(f(4) * 255) };
}

const hex2 = (n) => clampByte(n).toString(16).padStart(2, '0');

export function toHex({ r, g, b, a = 1 }) {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ''}`;
}

export function toRgbString({ r, g, b, a = 1 }) {
  return a < 1 ? `rgb(${r} ${g} ${b} / ${Number(a.toFixed(3))})` : `rgb(${r} ${g} ${b})`;
}

export function toHslString(color) {
  const { h, s, l } = rgbToHsl(color);
  const a = color.a ?? 1;
  const base = `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
  return a < 1 ? `hsl(${base} / ${Number(a.toFixed(3))})` : `hsl(${base})`;
}

/** WCAG relative luminance. */
export function relativeLuminance({ r, g, b }) {
  const [rl, gl, bl] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** WCAG contrast ratio between two opaque colors (1 to 21). */
export function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG 2.x conformance for a contrast ratio. */
export function wcagLevels(ratio) {
  return {
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}
