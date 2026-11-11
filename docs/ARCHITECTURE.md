# Architecture

Web Utilities is a static single-page application written with ES modules. There is no build step: the files in this repository are the files the browser runs.

## Goals

- **Private.** User data stays on the device. Nothing is uploaded and nothing is tracked.
- **Dependable.** Few moving parts, pinned third-party code, and tested logic.
- **Fast to start.** Tool code and heavy libraries load only when needed.
- **Easy to extend.** Adding a tool means adding one module and one registry entry.

## Runtime flow

```text
index.html
  └─ js/main.js            router, sidebar, search, theme, mobile menu
       ├─ js/registry.js   tool metadata (title, category, icon, keywords, load())
       └─ on route change:
            tool.load()  →  js/tools/<id>.js  →  mount(root)  →  optional cleanup()
```

1. `main.js` reads `location.hash` (`#/qr-code`). An unknown or empty hash shows the home page.
2. The sidebar and home grid render from `registry.js`, so navigation and search never load tool code.
3. Opening a tool dynamically imports its module, calls `mount(root)`, and stores the returned cleanup function. Navigating away runs that cleanup first.
4. `mount` may be `async`. The router ignores results that arrive after the user has already navigated elsewhere.

## Modules

| Path             | Responsibility                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `js/main.js`     | Routing, navigation, search, theme toggle, mobile drawer, service worker registration.       |
| `js/registry.js` | The list of tools and categories. Single source of truth for navigation and search.          |
| `js/ui.js`       | DOM creation (`h`), form controls, tabs, drop zone, file list, toast, clipboard, downloads.  |
| `js/icons.js`    | SVG icon set created through the DOM API.                                                    |
| `js/media.js`    | Image decoding, canvas encoding (PNG, JPEG, WebP, BMP, ICO), PDF rendering and PDF assembly. |
| `js/results.js`  | Reusable result list with previews, downloads, and "Download all" ZIP.                       |
| `js/lib/*`       | Pure functions. No DOM. All unit tested in Node.                                             |
| `js/tools/*`     | One module per tool. Thin: builds UI, calls `lib`, shows results.                            |

### Why `js/lib` is separate

Logic that does not need a browser (parsing, conversion tables, encoders, diffing, page ranges, QR SVG generation, ZIP writing) lives in `js/lib/` and is tested with `node --test`. This keeps the tools small and the behavior verifiable without a headless browser.

## Third-party code

Three libraries are committed under `vendor/`, plus one font under `assets/fonts/`:

| Library          | Used for                            | Loaded                                     |
| ---------------- | ----------------------------------- | ------------------------------------------ |
| qrcode-generator | Computing the QR module matrix      | Classic script on first use of the QR tool |
| pdf-lib          | Creating, merging, and editing PDFs | Classic script on first use                |
| PDF.js           | Rendering PDF pages to canvases     | ES module and web worker on first use      |

Versions are pinned in `package.json`. `npm run vendor:sync` copies files from `node_modules`, and `npm run vendor:check` (run in CI) fails if the committed copies differ. This keeps provenance auditable without a bundler.

## Images and PDFs

The file converter normalizes every input to canvases:

```text
image file ──decodeImage──▶ canvas ─┐
PDF file ───renderPdfPages─▶ canvas ─┼─▶ encodeCanvas ─▶ PNG / JPEG / WebP / BMP / ICO
                                     └─▶ PdfBuilder  ─▶ PDF (one per file, or combined)
```

- **Decoding** uses `createImageBitmap` with an `<img>` fallback (also used for SVG).
- **Encoding** uses `canvas.toBlob` for PNG, JPEG, and WebP. BMP and ICO are written by small encoders in `js/lib/`. Formats the browser cannot encode (usually AVIF) are detected at startup and hidden.
- **Downscaling** halves the image step by step, which keeps edges cleaner than one large reduction.
- **PDF output** embeds JPEG (or PNG when lossless is chosen) and sizes each page to the image or to A4/Letter.
- **PDF input** is rendered by PDF.js at the chosen DPI. Pages are processed one at a time to limit memory.

## Security model

- `index.html` sets a Content Security Policy: `default-src 'self'`, no inline scripts, no inline styles, `object-src 'none'`, and `connect-src 'self' blob: data:`. Third-party hosts are never contacted.
- Dynamic content is inserted as text. ESLint rejects `innerHTML`, `outerHTML`, and `insertAdjacentHTML`.
- Style changes from JavaScript use the CSSOM (`element.style.x`), which the policy permits.
- Randomness comes from `crypto.getRandomValues` using rejection sampling to avoid modulo bias.

## Theming

`css/tokens.css` defines colors, radii, and shadows as CSS variables. Dark values are declared twice: once under `:root[data-theme="dark"]` for an explicit choice and once inside `@media (prefers-color-scheme: dark)` for the system setting. `js/theme-init.js` applies a saved choice before first paint to prevent a flash.

The visual language comes from the logo: a navy ink outline, sky-blue fills with a flat offset shadow, rounded geometry, and sparing use of sun yellow and blush pink.

## Offline support

`sw.js` precaches the app shell and then uses stale-while-revalidate for same-origin GET requests, so tool code and vendored libraries are cached the first time they are used. Bump `VERSION` in `sw.js` when the precache list changes.

## Testing strategy

- **Unit tests** (`tests/lib.test.js`) cover pure logic with fixed vectors (for example SHA-256 of `abc`, WCAG contrast ratios, CRC-32).
- **Structure tests** (`tests/registry.test.js`) validate the registry, check that every tool exports `mount`, and assert the Content Security Policy is present.
- **Manual browser checks** cover the UI. See the checklist in [CONTRIBUTING.md](../CONTRIBUTING.md).

## Known limitations

- Regular expressions run in a Web Worker (`js/workers/regex-worker.js`) and are stopped after 1.5 seconds, so catastrophic backtracking cannot freeze the page.
- Very large images are limited by the browser's maximum canvas size.
- Password-protected PDFs are not supported.
- PDF-to-image and PDF-to-PDF conversion rasterize pages, so text is no longer selectable in the output.
