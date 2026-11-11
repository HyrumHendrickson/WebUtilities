/**
 * Inline icon set. Each icon is a list of SVG path commands drawn on a 24x24 grid
 * with a 1.75px rounded stroke. Icons are created with the DOM API so that no
 * markup strings are ever parsed.
 */

const PATHS = {
  qr: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h3v3h-3z', 'M20 14v.01', 'M14 20h.01', 'M17 20h3v-3'],
  convert: ['M4 8h14', 'M14 4l4 4-4 4', 'M20 16H6', 'M10 12l-4 4 4 4'],
  resize: ['M4 14v6h6', 'M20 10V4h-6', 'M4 20l7-7', 'M20 4l-7 7'],
  pdf: ['M6 3h8l5 5v13H6z', 'M14 3v5h5', 'M9 13h6', 'M9 17h6'],
  password: ['M5 11h14v10H5z', 'M8 11V7a4 4 0 0 1 8 0v4', 'M12 15v2'],
  uuid: ['M5 9h14', 'M5 15h14', 'M10 4L8 20', 'M16 4l-2 16'],
  lorem: ['M4 6h16', 'M4 10h16', 'M4 14h10', 'M4 18h13'],
  words: ['M3 18l5-12 5 12', 'M5 14h6', 'M15 18l3-7 3 7', 'M16 16h4'],
  case: ['M5 6h11', 'M10.5 6v12', 'M16 12h5', 'M18.5 12v6'],
  lines: ['M4 6h10', 'M4 12h7', 'M4 18h4', 'M17 5v14', 'M14 16l3 3 3-3'],
  diff: ['M3 4h8v16H3z', 'M13 4h8v16h-8z', 'M5.5 9h3', 'M15.5 9h3', 'M17 13v4', 'M15 15h4'],
  code: ['M8 7l-5 5 5 5', 'M16 7l5 5-5 5', 'M13.5 5l-3 14'],
  link: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'],
  hash: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M9 12l2 2 4-4'],
  token: ['M3 12l9-9h8v8l-9 9z', 'M15.5 8.5h.01'],
  json: [
    'M9 4c-2 0-3 1-3 3v2c0 1.5-1 3-3 3 2 0 3 1.5 3 3v2c0 2 1 3 3 3',
    'M15 4c2 0 3 1 3 3v2c0 1.5 1 3 3 3-2 0-3 1.5-3 3v2c0 2-1 3-3 3',
  ],
  regex: ['M12 4v9', 'M7.6 6.5l8.8 5', 'M16.4 6.5l-8.8 5', 'M7 19h.01'],
  browser: ['M3 4h18v12H3z', 'M8 20h8', 'M12 16v4'],
  clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5l3 2'],
  color: ['M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z'],
  units: ['M3 15L15 3l6 6L9 21z', 'M8 8l2 2', 'M11 5l2 2', 'M5 11l2 2'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20 20l-4.2-4.2'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  sun: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    'M12 2v2',
    'M12 20v2',
    'M4.9 4.9l1.4 1.4',
    'M17.7 17.7l1.4 1.4',
    'M2 12h2',
    'M20 12h2',
    'M4.9 19.1l1.4-1.4',
    'M17.7 6.3l1.4-1.4',
  ],
  moon: ['M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z'],
  system: ['M3 5h18v11H3z', 'M8 20h8', 'M12 16v4'],
  download: ['M12 4v11', 'M7 11l5 5 5-5', 'M5 20h14'],
  upload: ['M12 16V5', 'M7 9l5-5 5 5', 'M5 20h14'],
  copy: ['M9 9h11v11H9z', 'M5 15V4h11'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13', 'M10 11v6', 'M14 11v6'],
  refresh: ['M20 11a8 8 0 0 0-14.5-3', 'M4 4v4h4', 'M4 13a8 8 0 0 0 14.5 3', 'M20 20v-4h-4'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  x: ['M6 6l12 12', 'M18 6L6 18'],
  plus: ['M12 5v14', 'M5 12h14'],
  arrowUp: ['M12 19V5', 'M6 11l6-6 6 6'],
  arrowDown: ['M12 5v14', 'M6 13l6 6 6-6'],
  alert: ['M12 3l10 18H2z', 'M12 10v5', 'M12 18h.01'],
  lock: ['M5 11h14v10H5z', 'M8 11V7a4 4 0 0 1 8 0v4'],
  file: ['M6 3h8l5 5v13H6z', 'M14 3v5h5'],
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
};

/** Names of all available icons. */
export const ICON_NAMES = Object.keys(PATHS);

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Create an icon element.
 * @param {keyof typeof PATHS} name
 * @param {{size?: number, label?: string}} [options] Provide `label` for icons that convey meaning on their own.
 * @returns {SVGSVGElement}
 */
export function icon(name, { size = 20, label } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.classList.add('icon');
  if (label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
  } else {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
  }
  for (const d of PATHS[name] ?? PATHS.file) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}
