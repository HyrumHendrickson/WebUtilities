/**
 * Tool registry. Metadata is available immediately for navigation and search;
 * each tool's code is loaded on demand with `load()`.
 *
 * To add a tool, create `js/tools/<id>.js` exporting `mount(root, context)`
 * and add an entry here (see docs/ADDING_A_TOOL.md).
 */

/** @typedef {{id: string, title: string, description: string, category: string, icon: string, keywords: string[], load: () => Promise<{mount: (root: HTMLElement) => (void | (() => void))}>}} Tool */

export const CATEGORIES = [
  { id: 'files', title: 'Images & PDF', blurb: 'Convert, resize, merge, and split files without uploading them.' },
  { id: 'generate', title: 'Generate', blurb: 'Make codes, passwords, identifiers, and placeholder text.' },
  { id: 'text', title: 'Text', blurb: 'Count, reshape, and compare writing.' },
  { id: 'inspect', title: 'Encode & inspect', blurb: 'Decode, hash, format, and test the data you run into online.' },
  { id: 'convert', title: 'Convert', blurb: 'Dates, colors, and units.' },
];

/** @type {Tool[]} */
export const TOOLS = [
  {
    id: 'file-converter',
    title: 'File converter',
    description: 'Convert images and PDFs between PNG, JPEG, WebP, BMP, ICO, and PDF.',
    category: 'files',
    icon: 'convert',
    keywords: [
      'image',
      'png',
      'jpg',
      'jpeg',
      'webp',
      'avif',
      'bmp',
      'ico',
      'pdf',
      'convert',
      'format',
      'heic',
      'gif',
      'svg',
    ],
    load: () => import('./tools/file-converter.js'),
  },
  {
    id: 'image-resizer',
    title: 'Image resizer',
    description: 'Resize and compress images to a target size or quality.',
    category: 'files',
    icon: 'resize',
    keywords: ['image', 'resize', 'compress', 'shrink', 'scale', 'dimensions', 'optimize', 'photo'],
    load: () => import('./tools/image-resizer.js'),
  },
  {
    id: 'pdf-toolkit',
    title: 'PDF toolkit',
    description: 'Merge PDFs, extract pages, and rotate pages.',
    category: 'files',
    icon: 'pdf',
    keywords: ['pdf', 'merge', 'combine', 'split', 'extract', 'rotate', 'pages'],
    load: () => import('./tools/pdf-toolkit.js'),
  },
  {
    id: 'qr-code',
    title: 'QR code generator',
    description: 'Turn a link or any text into a QR code you can download.',
    category: 'generate',
    icon: 'qr',
    keywords: ['qr', 'barcode', 'url', 'link', 'code', 'scan'],
    load: () => import('./tools/qr-code.js'),
  },
  {
    id: 'password-generator',
    title: 'Password generator',
    description: 'Create strong random passwords with your own rules.',
    category: 'generate',
    icon: 'password',
    keywords: ['password', 'random', 'secure', 'security', 'passphrase', 'generate'],
    load: () => import('./tools/password-generator.js'),
  },
  {
    id: 'uuid-generator',
    title: 'UUID generator',
    description: 'Generate random (v4) or time-ordered (v7) UUIDs in bulk.',
    category: 'generate',
    icon: 'uuid',
    keywords: ['uuid', 'guid', 'identifier', 'unique', 'id', 'random'],
    load: () => import('./tools/uuid-generator.js'),
  },
  {
    id: 'lorem-ipsum',
    title: 'Lorem ipsum',
    description: 'Placeholder text by the word, sentence, or paragraph.',
    category: 'generate',
    icon: 'lorem',
    keywords: ['lorem', 'ipsum', 'placeholder', 'dummy', 'filler', 'text'],
    load: () => import('./tools/lorem-ipsum.js'),
  },
  {
    id: 'word-counter',
    title: 'Word counter',
    description: 'Words, characters, sentences, reading time, and top keywords.',
    category: 'text',
    icon: 'words',
    keywords: ['word', 'count', 'characters', 'reading time', 'length', 'sentences'],
    load: () => import('./tools/word-counter.js'),
  },
  {
    id: 'case-converter',
    title: 'Case converter',
    description: 'Switch between upper, lower, title, camel, snake, and kebab case.',
    category: 'text',
    icon: 'case',
    keywords: ['case', 'upper', 'lower', 'title', 'camel', 'snake', 'kebab', 'pascal', 'slug'],
    load: () => import('./tools/case-converter.js'),
  },
  {
    id: 'line-tools',
    title: 'Line tools',
    description: 'Sort, deduplicate, reverse, trim, and number lines.',
    category: 'text',
    icon: 'lines',
    keywords: ['sort', 'dedupe', 'duplicate', 'lines', 'reverse', 'trim', 'list', 'unique'],
    load: () => import('./tools/line-tools.js'),
  },
  {
    id: 'text-diff',
    title: 'Text diff',
    description: 'Compare two blocks of text and see what changed.',
    category: 'text',
    icon: 'diff',
    keywords: ['diff', 'compare', 'difference', 'changes', 'merge'],
    load: () => import('./tools/text-diff.js'),
  },
  {
    id: 'base64',
    title: 'Base64',
    description: 'Encode and decode text or files as Base64.',
    category: 'inspect',
    icon: 'code',
    keywords: ['base64', 'encode', 'decode', 'binary', 'data uri'],
    load: () => import('./tools/base64.js'),
  },
  {
    id: 'url-tools',
    title: 'URL tools',
    description: 'Percent-encode text, parse links, and escape HTML.',
    category: 'inspect',
    icon: 'link',
    keywords: ['url', 'uri', 'encode', 'decode', 'percent', 'query', 'parse', 'html', 'entities', 'escape'],
    load: () => import('./tools/url-tools.js'),
  },
  {
    id: 'hash-generator',
    title: 'Hash generator',
    description: 'SHA-1, SHA-256, SHA-384, and SHA-512 for text or files.',
    category: 'inspect',
    icon: 'hash',
    keywords: ['hash', 'sha', 'sha256', 'checksum', 'digest', 'verify', 'integrity'],
    load: () => import('./tools/hash-generator.js'),
  },
  {
    id: 'jwt-decoder',
    title: 'JWT decoder',
    description: 'Read the header and claims inside a JSON Web Token.',
    category: 'inspect',
    icon: 'token',
    keywords: ['jwt', 'token', 'json web token', 'bearer', 'claims', 'auth'],
    load: () => import('./tools/jwt-decoder.js'),
  },
  {
    id: 'json-formatter',
    title: 'JSON formatter',
    description: 'Validate, pretty-print, minify, and sort JSON.',
    category: 'inspect',
    icon: 'json',
    keywords: ['json', 'format', 'validate', 'pretty', 'minify', 'lint', 'beautify'],
    load: () => import('./tools/json-formatter.js'),
  },
  {
    id: 'regex-tester',
    title: 'Regex tester',
    description: 'Try regular expressions and see every match and group.',
    category: 'inspect',
    icon: 'regex',
    keywords: ['regex', 'regexp', 'regular expression', 'pattern', 'match', 'test'],
    load: () => import('./tools/regex-tester.js'),
  },
  {
    id: 'browser-info',
    title: 'Browser info',
    description: 'See what your browser reports about your screen, language, and connection.',
    category: 'inspect',
    icon: 'browser',
    keywords: ['browser', 'user agent', 'screen', 'resolution', 'timezone', 'language', 'device', 'viewport'],
    load: () => import('./tools/browser-info.js'),
  },
  {
    id: 'timestamp-converter',
    title: 'Timestamp converter',
    description: 'Convert between Unix timestamps and readable dates.',
    category: 'convert',
    icon: 'clock',
    keywords: ['unix', 'epoch', 'timestamp', 'date', 'time', 'iso', 'utc', 'timezone'],
    load: () => import('./tools/timestamp-converter.js'),
  },
  {
    id: 'color-converter',
    title: 'Color converter',
    description: 'Convert HEX, RGB, and HSL and check contrast for accessibility.',
    category: 'convert',
    icon: 'color',
    keywords: ['color', 'colour', 'hex', 'rgb', 'hsl', 'contrast', 'wcag', 'accessibility', 'picker'],
    load: () => import('./tools/color-converter.js'),
  },
  {
    id: 'unit-converter',
    title: 'Unit converter',
    description: 'Length, mass, volume, area, speed, time, storage, and temperature.',
    category: 'convert',
    icon: 'units',
    keywords: [
      'unit',
      'convert',
      'length',
      'weight',
      'mass',
      'volume',
      'temperature',
      'speed',
      'metric',
      'imperial',
      'bytes',
    ],
    load: () => import('./tools/unit-converter.js'),
  },
];

const byId = new Map(TOOLS.map((tool) => [tool.id, tool]));

/** @param {string} id */
export const getTool = (id) => byId.get(id);

/**
 * Filter tools by a free-text query across title, description, and keywords.
 * @param {string} query
 * @returns {Tool[]}
 */
export function searchTools(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return TOOLS;
  return TOOLS.filter((tool) => {
    const haystack = `${tool.title} ${tool.description} ${tool.keywords.join(' ')}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
