import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { CATEGORIES, TOOLS, getTool, searchTools } from '../js/registry.js';
import { ICON_NAMES } from '../js/icons.js';

const root = new URL('../', import.meta.url);

test('tool ids are unique, URL-safe, and match their module file', async () => {
  const ids = TOOLS.map((tool) => tool.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    await access(fileURLToPath(new URL(`js/tools/${id}.js`, root)));
  }
});

test('every tool module exports mount()', async () => {
  for (const tool of TOOLS) {
    const source = await readFile(new URL(`js/tools/${tool.id}.js`, root), 'utf8');
    assert.match(source, /export (async )?function mount\(/, `${tool.id} must export mount()`);
  }
});

test('every tool has complete metadata that references real categories and icons', () => {
  const categories = new Set(CATEGORIES.map((category) => category.id));
  for (const tool of TOOLS) {
    assert.ok(tool.title && tool.description, `${tool.id} needs a title and description`);
    assert.ok(categories.has(tool.category), `${tool.id} has unknown category ${tool.category}`);
    assert.ok(ICON_NAMES.includes(tool.icon), `${tool.id} uses unknown icon ${tool.icon}`);
    assert.ok(tool.keywords.length > 0, `${tool.id} needs search keywords`);
    assert.equal(typeof tool.load, 'function');
  }
});

test('every category contains at least one tool', () => {
  for (const category of CATEGORIES) {
    assert.ok(
      TOOLS.some((tool) => tool.category === category.id),
      `${category.id} is empty`,
    );
  }
});

test('search matches titles, keywords, and ignores case', () => {
  assert.equal(searchTools('').length, TOOLS.length);
  assert.ok(searchTools('QR').some((tool) => tool.id === 'qr-code'));
  assert.ok(searchTools('jpg').some((tool) => tool.id === 'file-converter'));
  assert.ok(searchTools('sha256').some((tool) => tool.id === 'hash-generator'));
  assert.equal(searchTools('zzzz-no-match').length, 0);
  assert.equal(getTool('qr-code')?.title, 'QR code generator');
  assert.equal(getTool('nope'), undefined);
});

test('index.html has a restrictive content security policy and no inline scripts', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /script-src 'self'/);
  assert.match(html, /object-src 'none'/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
});
