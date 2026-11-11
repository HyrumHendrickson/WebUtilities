/**
 * Parse a page selection such as "1-3, 5, 8-" into zero-based page indexes.
 * @param {string} input
 * @param {number} pageCount Total pages in the document.
 * @returns {number[]}
 */
export function parsePageRanges(input, pageCount) {
  const text = input.trim();
  if (!text) throw new Error('Enter the pages to keep, for example 1-3, 5.');
  const pages = [];
  const check = (page) => {
    if (!Number.isInteger(page) || page < 1 || page > pageCount) {
      throw new RangeError(
        `Page ${page} is out of range. This document has ${pageCount} page${pageCount === 1 ? '' : 's'}.`,
      );
    }
    return page;
  };
  for (const part of text.split(',')) {
    const token = part.trim();
    if (!token) continue;
    const match = token.match(/^(\d+)\s*(?:(-)\s*(\d*))?$/);
    if (!match) throw new Error(`"${token}" is not a valid page or range.`);
    const start = check(Number(match[1]));
    const end = match[2] ? (match[3] === '' ? pageCount : check(Number(match[3]))) : start;
    if (end < start) throw new RangeError(`Range "${token}" runs backwards.`);
    for (let p = start; p <= end; p++) pages.push(p - 1);
  }
  if (pages.length === 0) throw new Error('No pages selected.');
  return pages;
}
