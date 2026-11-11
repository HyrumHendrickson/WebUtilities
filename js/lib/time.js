/**
 * Timestamp parsing and formatting helpers.
 */

/**
 * Parse a Unix timestamp (seconds or milliseconds) or a date string.
 * Numeric values with absolute magnitude below 1e11 are treated as seconds.
 * @param {string} input
 * @returns {Date}
 */
export function parseTimestamp(input) {
  const value = input.trim();
  if (!value) throw new Error('Enter a timestamp or date.');
  let date;
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const n = Number(value);
    date = new Date(Math.abs(n) < 1e11 ? n * 1000 : n);
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) {
    throw new Error('Unrecognized date. Use a Unix timestamp or a format like 2026-03-14T09:26:53Z.');
  }
  return date;
}

/**
 * Describe the distance between two dates in words.
 * @param {Date} date
 * @param {Date} [now]
 */
export function relativeTime(date, now = new Date()) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const steps = [
    ['year', 31_557_600],
    ['month', 2_629_800],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(seconds, 'second');
}

/**
 * Produce every common representation of a date.
 * @param {Date} date
 * @param {string} [timeZone] IANA zone for the "local" line; defaults to the browser's zone.
 */
export function describeDate(date, timeZone) {
  const zone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const local = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: zone,
  }).format(date);
  return {
    unixSeconds: String(Math.floor(date.getTime() / 1000)),
    unixMilliseconds: String(date.getTime()),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local,
    zone,
  };
}
