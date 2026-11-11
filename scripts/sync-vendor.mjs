#!/usr/bin/env node
/**
 * Copy third-party browser assets from node_modules into vendor/ and assets/fonts/.
 *
 * The app has no build step, so the libraries it needs at runtime are committed.
 * Versions are pinned in package.json; run this after changing them.
 *
 *   npm run vendor:sync    copy the files
 *   npm run vendor:check   fail if the committed copies differ from node_modules
 */
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const check = process.argv.includes('--check');

const FILES = [
  ['qrcode-generator/dist/qrcode.js', 'vendor/qrcode-generator/qrcode.js'],
  ['pdf-lib/dist/pdf-lib.min.js', 'vendor/pdf-lib/pdf-lib.min.js'],
  ['pdf-lib/LICENSE.md', 'vendor/pdf-lib/LICENSE.md'],
  ['pdfjs-dist/build/pdf.min.mjs', 'vendor/pdfjs/pdf.min.mjs'],
  ['pdfjs-dist/build/pdf.worker.min.mjs', 'vendor/pdfjs/pdf.worker.min.mjs'],
  ['pdfjs-dist/LICENSE', 'vendor/pdfjs/LICENSE'],
  ['@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2', 'assets/fonts/nunito-latin-wght-normal.woff2'],
  ['@fontsource-variable/nunito/LICENSE', 'assets/fonts/NUNITO-OFL.txt'],
];

let drifted = 0;
for (const [from, to] of FILES) {
  const source = join(root, 'node_modules', from);
  const target = join(root, to);
  if (check) {
    const [a, b] = await Promise.all([readFile(source), readFile(target).catch(() => null)]);
    if (!b || !a.equals(b)) {
      console.error(`Out of date: ${to}`);
      drifted++;
    }
  } else {
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
    console.log(`Copied ${to}`);
  }
}

if (check) {
  if (drifted) {
    console.error('\nRun "npm run vendor:sync" and commit the result.');
    process.exit(1);
  }
  console.log('Vendored files match package.json.');
}
