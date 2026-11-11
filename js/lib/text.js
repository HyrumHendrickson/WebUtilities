/**
 * Text analysis and transformation helpers.
 */

const WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;

/**
 * Compute basic statistics for a block of text.
 * @param {string} text
 */
export function countText(text) {
  const words = text.match(WORD_PATTERN)?.length ?? 0;
  const sentences = (text.match(/[^.!?]+[.!?]*/g) ?? []).filter((s) => /[\p{L}\p{N}]/u.test(s)).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
  return {
    characters: [...text].length,
    charactersNoSpaces: [...text.replace(/\s/g, '')].length,
    words,
    sentences,
    paragraphs,
    lines: text === '' ? 0 : text.split(/\r?\n/).length,
    readingMinutes: words / 238,
    speakingMinutes: words / 150,
  };
}

/**
 * Most frequent words in a text, ignoring very short words and common stop words.
 * @param {string} text
 * @param {number} [limit]
 * @returns {{word: string, count: number}[]}
 */
export function keywordFrequency(text, limit = 8) {
  const stop = new Set(
    'the and for are but not you all any can had her was one our out has his how its may new now old see two who did get let put say she too use that with have this will your from they know want been good much some time very when come here just like long make many more only over such take than them well were what'.split(
      ' ',
    ),
  );
  const counts = new Map();
  for (const raw of text.toLowerCase().match(WORD_PATTERN) ?? []) {
    if (raw.length < 3 || stop.has(raw)) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

/** Split text into lowercase-able words, respecting camelCase boundaries. */
export function splitWords(text) {
  return text.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2').match(/[\p{L}\p{N}]+/gu) ?? [];
}

const SMALL_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'in',
  'nor',
  'of',
  'on',
  'or',
  'the',
  'to',
]);

const capitalize = (word) => (word ? word[0].toUpperCase() + word.slice(1) : word);

export const CASE_MODES = [
  ['upper', 'UPPER CASE'],
  ['lower', 'lower case'],
  ['title', 'Title Case'],
  ['sentence', 'Sentence case'],
  ['camel', 'camelCase'],
  ['pascal', 'PascalCase'],
  ['snake', 'snake_case'],
  ['kebab', 'kebab-case'],
  ['constant', 'CONSTANT_CASE'],
];

/**
 * Convert text to the requested case style.
 * @param {string} text
 * @param {string} mode One of the keys in CASE_MODES.
 * @returns {string}
 */
export function convertCase(text, mode) {
  switch (mode) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title': {
      const parts = text.toLowerCase().split(/(\s+)/);
      const wordIndexes = parts.map((p, i) => (/\S/.test(p) ? i : -1)).filter((i) => i >= 0);
      const first = wordIndexes[0];
      const last = wordIndexes.at(-1);
      return parts
        .map((part, i) =>
          /\S/.test(part) && (i === first || i === last || !SMALL_WORDS.has(part)) ? capitalize(part) : part,
        )
        .join('');
    }
    case 'sentence':
      return text.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, lead, letter) => lead + letter.toUpperCase());
    case 'camel':
      return splitWords(text)
        .map((w, i) => (i === 0 ? w.toLowerCase() : capitalize(w.toLowerCase())))
        .join('');
    case 'pascal':
      return splitWords(text)
        .map((w) => capitalize(w.toLowerCase()))
        .join('');
    case 'snake':
      return splitWords(text).join('_').toLowerCase();
    case 'kebab':
      return splitWords(text).join('-').toLowerCase();
    case 'constant':
      return splitWords(text).join('_').toUpperCase();
    default:
      throw new RangeError(`Unknown case mode: ${mode}`);
  }
}

/**
 * Convert text to a URL-friendly slug.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  return text
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const LINE_OPERATIONS = [
  ['sort-asc', 'Sort A to Z'],
  ['sort-desc', 'Sort Z to A'],
  ['sort-length', 'Sort by length'],
  ['reverse', 'Reverse order'],
  ['dedupe', 'Remove duplicates'],
  ['remove-empty', 'Remove empty lines'],
  ['trim', 'Trim whitespace'],
  ['number', 'Number lines'],
];

/**
 * Apply a line-based operation to text.
 * @param {string} text
 * @param {string} operation One of the keys in LINE_OPERATIONS.
 * @param {{ignoreCase?: boolean}} [options]
 * @returns {string}
 */
export function applyLineOperation(text, operation, { ignoreCase = false } = {}) {
  const lines = text.split(/\r?\n/);
  const key = (line) => (ignoreCase ? line.toLowerCase() : line);
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: ignoreCase ? 'accent' : 'variant' });
  switch (operation) {
    case 'sort-asc':
      return [...lines].sort(collator.compare).join('\n');
    case 'sort-desc':
      return [...lines].sort((a, b) => collator.compare(b, a)).join('\n');
    case 'sort-length':
      return [...lines].sort((a, b) => a.length - b.length || collator.compare(a, b)).join('\n');
    case 'reverse':
      return [...lines].reverse().join('\n');
    case 'dedupe': {
      const seen = new Set();
      return lines
        .filter((line) => {
          const k = key(line);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        })
        .join('\n');
    }
    case 'remove-empty':
      return lines.filter((line) => line.trim() !== '').join('\n');
    case 'trim':
      return lines.map((line) => line.trim()).join('\n');
    case 'number': {
      const width = String(lines.length).length;
      return lines.map((line, i) => `${String(i + 1).padStart(width, ' ')}. ${line}`).join('\n');
    }
    default:
      throw new RangeError(`Unknown line operation: ${operation}`);
  }
}

const LOREM_WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nunc pulvinar sapien ligula pharetra nibh vestibulum ante primis faucibus orci luctus ultrices posuere cubilia curae'.split(
    ' ',
  );

const CLASSIC_OPENING = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';

/**
 * Generate placeholder text.
 * @param {{unit?: 'words'|'sentences'|'paragraphs', count?: number, classicStart?: boolean, random?: () => number}} [options]
 * @returns {string}
 */
export function generateLorem({ unit = 'paragraphs', count = 3, classicStart = true, random = Math.random } = {}) {
  const pick = () => LOREM_WORDS[Math.floor(random() * LOREM_WORDS.length)];
  const range = (min, max) => min + Math.floor(random() * (max - min + 1));

  const sentence = (opening) => {
    const length = range(8, 16);
    const words = opening ? opening.toLowerCase().split(' ') : [];
    while (words.length < length) words.push(pick());
    let comma = range(3, Math.max(4, length - 3));
    const out = words.map((w, i) => {
      const suffix = i === comma && i < words.length - 1 && !opening?.includes(',') ? ',' : '';
      comma = suffix ? -1 : comma;
      return w + suffix;
    });
    const text = out.join(' ');
    return `${text[0].toUpperCase()}${text.slice(1)}.`;
  };

  const sentences = (n, openingFirst) =>
    Array.from({ length: n }, (_, i) => (i === 0 && openingFirst ? `${CLASSIC_OPENING}.` : sentence()));

  if (unit === 'words') {
    const words = classicStart ? CLASSIC_OPENING.toLowerCase().replace(',', '').split(' ') : [];
    while (words.length < count) words.push(pick());
    return words.slice(0, count).join(' ');
  }
  if (unit === 'sentences') return sentences(count, classicStart).join(' ');
  return Array.from({ length: count }, (_, i) => sentences(range(4, 7), classicStart && i === 0).join(' ')).join(
    '\n\n',
  );
}

/**
 * Line-level diff using a longest-common-subsequence table.
 * @param {string} before
 * @param {string} after
 * @returns {{type: 'equal'|'add'|'remove', value: string}[]}
 */
export function diffLines(before, after) {
  const a = before === '' ? [] : before.split(/\r?\n/);
  const b = after === '' ? [] : after.split(/\r?\n/);

  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  const n = midA.length;
  const m = midB.length;
  if ((n + 1) * (m + 1) > 4_000_000) {
    throw new RangeError('The texts differ too much to compare in the browser. Try shorter inputs.');
  }

  const width = m + 1;
  const table = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * width + j] =
        midA[i] === midB[j]
          ? table[(i + 1) * width + j + 1] + 1
          : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
    }
  }

  const result = a.slice(0, start).map((value) => ({ type: 'equal', value }));
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (midA[i] === midB[j]) {
      result.push({ type: 'equal', value: midA[i] });
      i++;
      j++;
    } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
      result.push({ type: 'remove', value: midA[i++] });
    } else {
      result.push({ type: 'add', value: midB[j++] });
    }
  }
  while (i < n) result.push({ type: 'remove', value: midA[i++] });
  while (j < m) result.push({ type: 'add', value: midB[j++] });
  for (const value of a.slice(endA)) result.push({ type: 'equal', value });
  return result;
}
