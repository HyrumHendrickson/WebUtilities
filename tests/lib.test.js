import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatBytes, stripExtension, sanitizeFilename, formatNumber, clamp } from '../js/lib/format.js';
import {
  countText,
  convertCase,
  slugify,
  applyLineOperation,
  generateLorem,
  diffLines,
  keywordFrequency,
} from '../js/lib/text.js';
import {
  textToBase64,
  base64ToText,
  base64ToBytes,
  percentEncode,
  percentDecode,
  parseUrl,
  escapeHtml,
  unescapeHtml,
} from '../js/lib/encoding.js';
import { formatJson, positionToLineColumn } from '../js/lib/json.js';
import { decodeJwt } from '../js/lib/jwt.js';
import { parseColor, toHex, toRgbString, toHslString, contrastRatio, wcagLevels } from '../js/lib/color.js';
import { parseTimestamp, relativeTime, describeDate } from '../js/lib/time.js';
import { generatePassword, estimateEntropy, strengthLabel, secureRandomInt } from '../js/lib/password.js';
import { uuidV4, uuidV7, isUuid } from '../js/lib/uuid.js';
import { digestHex } from '../js/lib/hash.js';
import { convertUnit } from '../js/lib/units.js';
import { parsePageRanges } from '../js/lib/pages.js';
import { runRegex } from '../js/lib/regex.js';
import { crc32, createZip } from '../js/lib/zip.js';
import { encodeBmp } from '../js/lib/bmp.js';
import { encodeIco } from '../js/lib/ico.js';

test('format helpers', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(999), '999 B');
  assert.equal(formatBytes(1500), '1.5 KB');
  assert.equal(formatBytes(2_500_000), '2.5 MB');
  assert.equal(stripExtension('photo.final.png'), 'photo.final');
  assert.equal(stripExtension('.gitignore'), '.gitignore');
  assert.equal(sanitizeFilename('a/b:c?.txt'), 'a_b_c_.txt');
  assert.equal(sanitizeFilename('...'), 'file');
  assert.equal(formatNumber(0.1 + 0.2), '0.3');
  assert.equal(clamp(12, 0, 10), 10);
});

test('countText', () => {
  const stats = countText('Hello world. This is a test!\n\nSecond paragraph?');
  assert.equal(stats.words, 8);
  assert.equal(stats.sentences, 3);
  assert.equal(stats.paragraphs, 2);
  assert.equal(stats.lines, 3);
  assert.equal(countText('').words, 0);
  assert.equal(countText('a b').charactersNoSpaces, 2);
});

test('keywordFrequency ignores stop words', () => {
  const top = keywordFrequency('apple banana apple the the the cherry apple banana');
  assert.deepEqual(top[0], { word: 'apple', count: 3 });
  assert.ok(!top.some((entry) => entry.word === 'the'));
});

test('convertCase', () => {
  assert.equal(convertCase('hello big world', 'upper'), 'HELLO BIG WORLD');
  assert.equal(convertCase('the lord of the rings', 'title'), 'The Lord of the Rings');
  assert.equal(convertCase('HELLO. how are you? fine', 'sentence'), 'Hello. How are you? Fine');
  assert.equal(convertCase('hello big world', 'camel'), 'helloBigWorld');
  assert.equal(convertCase('hello big world', 'pascal'), 'HelloBigWorld');
  assert.equal(convertCase('helloBigWorld', 'snake'), 'hello_big_world');
  assert.equal(convertCase('Hello Big World', 'kebab'), 'hello-big-world');
  assert.equal(convertCase('hello big world', 'constant'), 'HELLO_BIG_WORLD');
  assert.throws(() => convertCase('x', 'nope'), RangeError);
});

test('slugify', () => {
  assert.equal(slugify('  Crème Brûlée & Co.  '), 'creme-brulee-co');
});

test('applyLineOperation', () => {
  assert.equal(applyLineOperation('b\na\nc', 'sort-asc'), 'a\nb\nc');
  assert.equal(applyLineOperation('a2\na10\na1', 'sort-asc'), 'a1\na2\na10');
  assert.equal(applyLineOperation('b\na\nc', 'sort-desc'), 'c\nb\na');
  assert.equal(applyLineOperation('a\nB\na\nb', 'dedupe'), 'a\nB\nb');
  assert.equal(applyLineOperation('a\nB\na\nb', 'dedupe', { ignoreCase: true }), 'a\nB');
  assert.equal(applyLineOperation('a\n\n  \nb', 'remove-empty'), 'a\nb');
  assert.equal(applyLineOperation(' a \nb ', 'trim'), 'a\nb');
  assert.equal(applyLineOperation('x\ny', 'reverse'), 'y\nx');
  assert.equal(applyLineOperation('x\ny', 'number'), '1. x\n2. y');
});

test('generateLorem is deterministic with an injected RNG', () => {
  let seed = 1;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const words = generateLorem({ unit: 'words', count: 5, random });
  assert.equal(words, 'lorem ipsum dolor sit amet');
  const sentences = generateLorem({ unit: 'sentences', count: 2, random });
  assert.match(sentences, /^Lorem ipsum dolor sit amet, consectetur adipiscing elit\. [A-Z]/);
  assert.equal(generateLorem({ unit: 'paragraphs', count: 3 }).split('\n\n').length, 3);
});

test('diffLines', () => {
  const diff = diffLines('a\nb\nc', 'a\nx\nc\nd');
  assert.deepEqual(
    diff.map((d) => `${d.type[0]}:${d.value}`),
    ['e:a', 'r:b', 'a:x', 'e:c', 'a:d'],
  );
  assert.deepEqual(diffLines('', 'a'), [{ type: 'add', value: 'a' }]);
  assert.deepEqual(diffLines('same', 'same'), [{ type: 'equal', value: 'same' }]);
});

test('base64 round trips UTF-8 and URL-safe variants', () => {
  assert.equal(textToBase64('hello'), 'aGVsbG8=');
  assert.equal(base64ToText('aGVsbG8='), 'hello');
  assert.equal(base64ToText(textToBase64('héllo ✓ 🙂')), 'héllo ✓ 🙂');
  assert.equal(textToBase64('??>>', { urlSafe: true, padding: false }), 'Pz8-Pg');
  assert.equal(base64ToText('Pz8-Pg'), '??>>');
  assert.deepEqual([...base64ToBytes('AAEC')], [0, 1, 2]);
  assert.throws(() => base64ToBytes('!!!'), /valid Base64/);
  assert.throws(() => base64ToText('/w=='), /UTF-8/);
});

test('percent encoding and URL parsing', () => {
  assert.equal(percentEncode('a b&c=d/é'), 'a%20b%26c%3Dd%2F%C3%A9');
  assert.equal(percentEncode('https://x.y/a b', 'full'), 'https://x.y/a%20b');
  assert.equal(percentDecode('a%20b'), 'a b');
  assert.equal(percentDecode('a+b', { plusAsSpace: true }), 'a b');
  assert.throws(() => percentDecode('%E0%A4%A'), /invalid/);
  const parsed = parseUrl('https://user:pw@example.com:8080/a/b?x=1&y=two#top');
  assert.equal(parsed.hostname, 'example.com');
  assert.equal(parsed.port, '8080');
  assert.deepEqual(parsed.params, [
    ['x', '1'],
    ['y', 'two'],
  ]);
  assert.equal(parsed.hash, '#top');
  assert.throws(() => parseUrl('example.com'), /complete URL/);
});

test('HTML entities', () => {
  assert.equal(
    escapeHtml(`<a href="x">Tom & 'Jerry'</a>`),
    '&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;',
  );
  assert.equal(unescapeHtml('&lt;b&gt; &amp; &#65; &#x42; &copy; &unknown;'), '<b> & A B © &unknown;');
});

test('formatJson', () => {
  assert.deepEqual(formatJson('{"b":1,"a":[1,2]}', { indent: 2, sortKeys: true }), {
    ok: true,
    output: '{\n  "a": [\n    1,\n    2\n  ],\n  "b": 1\n}',
  });
  assert.deepEqual(formatJson('{ "a" : 1 }', { indent: 0 }), { ok: true, output: '{"a":1}' });
  const bad = formatJson('{\n  "a": 1,\n}');
  assert.equal(bad.ok, false);
  assert.ok(bad.error.message.length > 0);
  assert.deepEqual(positionToLineColumn('ab\ncd', 4), { line: 2, column: 2 });
});

test('decodeJwt', () => {
  const token = `${textToBase64('{"alg":"HS256","typ":"JWT"}', { urlSafe: true, padding: false })}.${textToBase64('{"sub":"123","exp":1700000000}', { urlSafe: true, padding: false })}.sig`;
  const { header, payload, signature } = decodeJwt(token);
  assert.equal(header.alg, 'HS256');
  assert.equal(payload.sub, '123');
  assert.equal(signature, 'sig');
  assert.throws(() => decodeJwt('a.b'), /three parts/);
  assert.throws(() => decodeJwt('a.b.c'), /not valid/);
});

test('color parsing and conversion', () => {
  assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(parseColor('3f9ccb'), { r: 63, g: 156, b: 203, a: 1 });
  assert.equal(parseColor('#00000080').a.toFixed(2), '0.50');
  assert.deepEqual(parseColor('rgb(10, 20, 30)'), { r: 10, g: 20, b: 30, a: 1 });
  assert.deepEqual(parseColor('rgb(10 20 30 / 50%)'), { r: 10, g: 20, b: 30, a: 0.5 });
  assert.deepEqual(parseColor('hsl(0 100% 50%)'), { r: 255, g: 0, b: 0, a: 1 });
  assert.equal(toHex({ r: 63, g: 156, b: 203 }), '#3f9ccb');
  assert.equal(toRgbString({ r: 1, g: 2, b: 3 }), 'rgb(1 2 3)');
  assert.equal(toHslString({ r: 255, g: 0, b: 0 }), 'hsl(0 100% 50%)');
  assert.throws(() => parseColor('blurple'), /Unrecognized/);
});

test('contrast ratio matches WCAG reference values', () => {
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 255, g: 255, b: 255 };
  assert.equal(contrastRatio(black, white).toFixed(2), '21.00');
  assert.equal(contrastRatio(white, white).toFixed(2), '1.00');
  assert.equal(contrastRatio({ r: 119, g: 119, b: 119 }, white).toFixed(2), '4.48');
  assert.deepEqual(wcagLevels(4.5), { aaNormal: true, aaLarge: true, aaaNormal: false, aaaLarge: true });
});

test('timestamps', () => {
  assert.equal(parseTimestamp('0').getTime(), 0);
  assert.equal(parseTimestamp('1700000000').toISOString(), '2023-11-14T22:13:20.000Z');
  assert.equal(parseTimestamp('1700000000000').toISOString(), '2023-11-14T22:13:20.000Z');
  assert.equal(parseTimestamp('2023-11-14T22:13:20Z').getTime(), 1_700_000_000_000);
  assert.throws(() => parseTimestamp('banana'), /Unrecognized/);
  assert.throws(() => parseTimestamp(' '), /Enter/);
  const now = new Date('2026-01-01T00:00:00Z');
  assert.equal(relativeTime(new Date('2026-01-03T00:00:00Z'), now), 'in 2 days');
  assert.equal(relativeTime(new Date('2025-12-31T23:00:00Z'), now), '1 hour ago');
  const described = describeDate(new Date(1_700_000_000_000), 'UTC');
  assert.equal(described.unixSeconds, '1700000000');
  assert.equal(described.iso, '2023-11-14T22:13:20.000Z');
  assert.match(described.local, /November 14, 2023/);
});

test('password generation', () => {
  const pw = generatePassword({ length: 24 });
  assert.equal(pw.length, 24);
  assert.match(pw, /[a-z]/);
  assert.match(pw, /[A-Z]/);
  assert.match(pw, /\d/);
  assert.match(pw, /[^a-zA-Z\d]/);
  assert.match(generatePassword({ length: 40, upper: false, symbols: false, digits: false }), /^[a-z]{40}$/);
  assert.doesNotMatch(generatePassword({ length: 200, excludeAmbiguous: true }), /[O0oIl1|]/);
  assert.throws(() => generatePassword({ lower: false, upper: false, digits: false, symbols: false }), /at least one/);
  assert.throws(() => generatePassword({ length: 2 }), RangeError);
  assert.ok(estimateEntropy('abcdefgh') > 37 && estimateEntropy('abcdefgh') < 38);
  assert.equal(strengthLabel(30), 'Weak');
  assert.equal(strengthLabel(120), 'Very strong');
  for (let i = 0; i < 200; i++) assert.ok(secureRandomInt(7) < 7);
});

test('uuid', () => {
  assert.ok(isUuid(uuidV4()));
  assert.equal(uuidV4()[14], '4');
  const v7 = uuidV7(1_700_000_000_000);
  assert.ok(isUuid(v7));
  assert.equal(v7[14], '7');
  assert.equal(v7.replace(/-/g, '').slice(0, 12), (1_700_000_000_000).toString(16).padStart(12, '0'));
  assert.ok(!isUuid('not-a-uuid'));
});

test('hashing matches published test vectors', async () => {
  const data = new TextEncoder().encode('abc');
  assert.equal(await digestHex('SHA-1', data), 'a9993e364706816aba3e25717850c26c9cd0d89d');
  assert.equal(await digestHex('SHA-256', data), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('unit conversion', () => {
  assert.ok(Math.abs(convertUnit('length', 'mi', 'km', 1) - 1.609344) < 1e-12);
  assert.ok(Math.abs(convertUnit('mass', 'lb', 'kg', 1) - 0.45359237) < 1e-12);
  assert.ok(Math.abs(convertUnit('temperature', 'C', 'F', 100) - 212) < 1e-9);
  assert.ok(Math.abs(convertUnit('temperature', 'F', 'C', -40) + 40) < 1e-9);
  assert.ok(Math.abs(convertUnit('temperature', 'K', 'C', 0) + 273.15) < 1e-9);
  assert.equal(convertUnit('data', 'GiB', 'MiB', 1), 1024);
  assert.equal(convertUnit('data', 'B', 'bit', 1), 8);
  assert.ok(Math.abs(convertUnit('volume', 'gal', 'qt', 1) - 4) < 1e-12);
  assert.throws(() => convertUnit('length', 'm', 'zz', 1), RangeError);
});

test('parsePageRanges', () => {
  assert.deepEqual(parsePageRanges('1-3, 5', 10), [0, 1, 2, 4]);
  assert.deepEqual(parsePageRanges('8-', 10), [7, 8, 9]);
  assert.deepEqual(parsePageRanges(' 2 ', 3), [1]);
  assert.throws(() => parsePageRanges('11', 10), /out of range/);
  assert.throws(() => parsePageRanges('5-2', 10), /backwards/);
  assert.throws(() => parsePageRanges('a', 10), /not a valid/);
  assert.throws(() => parsePageRanges('', 10), /Enter/);
});

test('runRegex', () => {
  const { matches } = runRegex('(?<word>\\w)(\\d)', 'g', 'a1 b2');
  assert.equal(matches.length, 2);
  assert.equal(matches[1].index, 3);
  assert.deepEqual(matches[0].named, { word: 'a' });
  assert.deepEqual(matches[0].groups, ['a', '1']);
  assert.equal(runRegex('x*', '', 'ab').matches.length, 3);
  assert.equal(runRegex('a', 'g', 'a'.repeat(50), 10).truncated, true);
  assert.throws(() => runRegex('(', '', ''), SyntaxError);
});

test('crc32 and zip structure', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  const zip = createZip([
    { name: 'a.txt', data: new TextEncoder().encode('hello') },
    { name: 'b.txt', data: new Uint8Array(0) },
  ]);
  const view = new DataView(zip.buffer);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  assert.equal(view.getUint32(zip.length - 22, true), 0x06054b50);
  assert.equal(view.getUint16(zip.length - 22 + 10, true), 2);
});

test('encodeBmp lays out pixels bottom-up in BGR order', () => {
  const rgba = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 10, 20, 30, 255]);
  const bmp = encodeBmp({ width: 2, height: 2, data: rgba });
  const view = new DataView(bmp.buffer);
  assert.equal(String.fromCharCode(bmp[0], bmp[1]), 'BM');
  assert.equal(view.getUint32(2, true), bmp.length);
  assert.equal(view.getInt32(18, true), 2);
  assert.equal(bmp.length, 54 + 8 * 2);
  assert.deepEqual([...bmp.slice(54, 57)], [255, 0, 0]); // bottom-left pixel (blue source row 2 col 1 => r0 g0 b255)
});

test('encodeIco writes a valid directory', () => {
  const png = new Uint8Array([1, 2, 3, 4]);
  const ico = encodeIco([
    { width: 256, height: 256, png },
    { width: 32, height: 32, png },
  ]);
  const view = new DataView(ico.buffer);
  assert.equal(view.getUint16(2, true), 1);
  assert.equal(view.getUint16(4, true), 2);
  assert.equal(ico[6], 0);
  assert.equal(ico[22], 32);
  assert.equal(view.getUint32(6 + 12, true), 38);
  assert.throws(() => encodeIco([{ width: 300, height: 300, png }]), RangeError);
});

import { matrixToSvg, wifiPayload, looksLikeBareDomain } from '../js/lib/qr.js';

test('matrixToSvg merges horizontal runs and applies the quiet zone', () => {
  const svg = matrixToSvg(
    [
      [true, true, false],
      [false, true, true],
      [true, false, false],
    ],
    { margin: 1, size: 100, foreground: '#112233', background: '#ffffff' },
  );
  assert.match(svg, /viewBox="0 0 5 5"/);
  assert.match(svg, /M1 1h2v1h-2z/);
  assert.match(svg, /M2 2h2v1h-2z/);
  assert.match(svg, /M1 3h1v1h-1z/);
  assert.match(svg, /fill="#112233"/);
  assert.doesNotMatch(matrixToSvg([[true]], { background: null }), /<rect/);
});

test('wifiPayload escapes special characters', () => {
  assert.equal(wifiPayload({ ssid: 'Home', password: 'pass' }), 'WIFI:T:WPA;S:Home;P:pass;;');
  assert.equal(
    wifiPayload({ ssid: 'A;B', password: 'x:y,z\\', hidden: true }),
    'WIFI:T:WPA;S:A\\;B;P:x\\:y\\,z\\\\;H:true;;',
  );
  assert.equal(wifiPayload({ ssid: 'Open', security: 'nopass' }), 'WIFI:T:nopass;S:Open;;');
  assert.throws(() => wifiPayload({ ssid: '' }), /network name/);
});

test('looksLikeBareDomain', () => {
  assert.equal(looksLikeBareDomain('example.com'), true);
  assert.equal(looksLikeBareDomain('www.example.com/path?q=1'), true);
  assert.equal(looksLikeBareDomain('https://example.com'), false);
  assert.equal(looksLikeBareDomain('hello world'), false);
});

import { uniqueName } from '../js/lib/format.js';

test('uniqueName appends a counter on collision', () => {
  const taken = new Set();
  assert.equal(uniqueName('a.png', taken), 'a.png');
  assert.equal(uniqueName('a.png', taken), 'a-2.png');
  assert.equal(uniqueName('a.png', taken), 'a-3.png');
  assert.equal(uniqueName('noext', taken), 'noext');
  assert.equal(uniqueName('noext', taken), 'noext-2');
});
