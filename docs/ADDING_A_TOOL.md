# Adding a tool

A tool is one module plus one registry entry. This guide walks through a complete example, a "Slug generator".

## 1. Put the logic in `js/lib/`

Pure functions go in `js/lib/` so they can be tested in Node. If a suitable file already exists (for text helpers, `js/lib/text.js`), add to it.

```js
// js/lib/text.js
/**
 * Convert text to a URL-friendly slug.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  /* ... */
}
```

Add tests in `tests/lib.test.js`:

```js
test('slugify', () => {
  assert.equal(slugify('  Crème Brûlée & Co.  '), 'creme-brulee-co');
});
```

## 2. Create the tool module

Create `js/tools/<id>.js`. The file name must equal the tool id. Export `mount(root)`; it may be `async`, and it may return a cleanup function.

```js
// js/tools/slug-generator.js
import { slugify } from '../lib/text.js';
import { field, h, outputField, textarea } from '../ui.js';

export function mount(root) {
  const source = textarea({ rows: 4, placeholder: 'Type a title', 'aria-label': 'Title' });
  const out = outputField('Slug', { single: true });

  source.addEventListener('input', () => out.set(slugify(source.value)));

  root.append(
    h(
      'div',
      { class: 'stack' },
      h('section', { class: 'panel' }, field('Title', source)),
      h('section', { class: 'panel' }, out.el),
    ),
  );
}
```

Guidelines:

- Build DOM with `h()` or `textContent`. Never assign `innerHTML`.
- Use the helpers in `js/ui.js` for controls so labels, focus, and styling stay consistent.
- Show status and errors with `statusLine()` so screen readers announce them.
- Provide an empty state and a clear error message for invalid input.
- If you create object URLs, timers, or global listeners, release them in the cleanup function you return. `createCleanup()` and `createResults()` help.
- For file input, use `dropzone()`. For results with downloads, use `createResults()`.
- Heavy libraries must load lazily. Use `loadScript()` for classic scripts or dynamic `import()`.

## 3. Register the tool

Add an entry to `TOOLS` in `js/registry.js`:

```js
{
  id: 'slug-generator',
  title: 'Slug generator',
  description: 'Turn titles into clean, URL-friendly slugs.',
  category: 'text',
  icon: 'link',
  keywords: ['slug', 'url', 'permalink', 'seo'],
  load: () => import('./tools/slug-generator.js'),
},
```

- `id` is lowercase with hyphens and becomes the route (`#/slug-generator`).
- `category` must be one of the ids in `CATEGORIES`.
- `icon` must exist in `js/icons.js`. Add a new icon there if needed (24 by 24 grid, stroke only).
- `keywords` feed search. Include synonyms and file types people might type.
- `description` is one short sentence in plain language, shown on the home page.

`tests/registry.test.js` fails if the id does not match a file, `mount` is not exported, or the icon or category does not exist.

## 4. Check your work

```bash
npm run check
npm start
```

In the browser, verify:

- the tool opens from the sidebar, the home grid, and search,
- it works with the keyboard alone,
- light and dark themes look correct,
- a phone-width viewport is usable,
- the console shows no errors or CSP violations.

## 5. Document it

Add the tool to the table in `README.md` and a line under **Unreleased** in `CHANGELOG.md`.
