# AGENTS.md

Guidance for AI coding agents (and humans) working in this repository.

## What this project is

Web Utilities is a static, client-side collection of small tools (QR codes, image and PDF conversion, text and developer utilities). It is plain HTML, CSS, and JavaScript using ES modules. There is **no framework, no bundler, and no server**. All processing happens in the browser, and user data must never leave the device.

## Commands

```bash
npm install        # install dev tooling and pinned vendor sources
npm start          # serve at http://localhost:8080 (zero-dependency server)
npm test           # unit tests (node:test) in tests/
npm run lint       # ESLint
npm run format     # Prettier (write)
npm run check      # lint + format check + vendor check + tests; run before finishing
```

Run `npm run check` before declaring work complete. CI runs the same command.

## Layout

- `index.html`: shell, Content Security Policy, mount points (`#sidebar`, `#main`, `#search`).
- `js/main.js`: hash router (`#/tool-id`), sidebar, search, theme, mobile menu.
- `js/registry.js`: **single source of truth for tools.** Metadata plus a lazy `load()` per tool.
- `js/tools/<id>.js`: one module per tool; exports `mount(root)`.
- `js/lib/*.js`: **pure logic**, no DOM access, covered by tests. Put anything testable here.
- `js/ui.js`: DOM helpers (`h`, `field`, `select`, `tabs`, `dropzone`, `outputField`, `toast`, ...).
- `js/media.js`: image decoding and encoding, PDF rendering and assembly.
- `js/results.js`: shared "results with downloads and ZIP" component.
- `css/`: `tokens.css` (variables, themes), `base.css` (shell, nav, home), `components.css`.
- `vendor/`: committed third-party browser builds. Do not hand-edit.
- `tests/`: `lib.test.js` (logic), `registry.test.js` (structure and CSP).

## Rules that must hold

1. **Privacy.** Never add network requests, analytics, telemetry, CDNs, or remote fonts. The CSP in `index.html` (`default-src 'self'`) enforces this; do not loosen it.
2. **No HTML injection.** Never assign `innerHTML`, `outerHTML`, or call `insertAdjacentHTML`. Build DOM with `h()`, `textContent`, or text nodes. ESLint enforces this.
3. **CSP-compatible styling.** No inline `<script>`, no `style="..."` attributes in markup, and no `setAttribute('style', ...)`. Setting `element.style.property` from JavaScript is allowed. Put static styles in CSS files.
4. **No build step.** Source files are served as written. Do not introduce TypeScript, JSX, bundlers, or transpilers.
5. **Dependencies.** Prefer the platform. A new runtime library needs a clear justification: add it to `devDependencies` with an exact version, register it in `scripts/sync-vendor.mjs`, run `npm run vendor:sync`, and add its license to `THIRD_PARTY_NOTICES.md`. Never load libraries from a CDN.
6. **Pure logic goes in `js/lib/` with tests.** Tool modules should be thin: build the UI, call lib functions, render results.
7. **Clean up.** If a tool creates object URLs, listeners on `window`/`document`, or timers, return a cleanup function from `mount()`. Use `createCleanup()` or `createResults()` (which has `destroy()`).
8. **Accessibility is a requirement.** Every control has a label, keyboard operation works, focus is visible, status changes use `statusLine()` or `aria-live`, and color is never the only signal. Respect `prefers-reduced-motion`.
9. **Both themes.** Use CSS variables from `tokens.css`. Check light and dark.
10. **Errors are for users.** Catch failures and explain what happened and what to do next. Errors do not apologize and are never vague.

## Adding or changing a tool

See [docs/ADDING_A_TOOL.md](docs/ADDING_A_TOOL.md). In short: add logic to `js/lib/` with tests, create `js/tools/<id>.js` exporting `mount(root)`, register it in `js/registry.js`, and `tests/registry.test.js` will validate the entry (id matches filename, icon and category exist, `mount` is exported).

## Code style

- ES2023+, ES modules, `const` by default, strict equality (`== null` is allowed).
- Prettier formats everything (120 columns, single quotes). Do not fight it; run `npm run format`.
- JSDoc on exported functions in `js/lib/`.
- Copy: sentence case, plain verbs, active voice. Button labels say what happens ("Download", "Merge PDFs"). Do not use ALL CAPS labels.
- Keep functions small and files focused. Avoid clever abstractions; this codebase favors readable, direct code.

## Testing

- Unit tests use `node:test` and `node:assert/strict`. Add tests next to the behavior you change in `tests/lib.test.js` (or a new `tests/<name>.test.js`; the glob is `tests/*.test.js`).
- Tests must be deterministic. Inject randomness (see `generateLorem`'s `random` option) instead of mocking globals.
- UI behavior is verified manually in a browser. Before finishing UI work, load the affected tool in light and dark themes at desktop and mobile widths, exercise it, and confirm the browser console has no errors or CSP violations.

## Things to avoid

- Editing files under `vendor/` or `package-lock.json` by hand.
- Using `localStorage` for anything except the theme preference (always wrapped in `try`/`catch`).
- Adding features that need a backend, accounts, or API keys.
- Large unrelated refactors in a feature change.

## Pull request checklist

- [ ] `npm run check` passes.
- [ ] New logic has tests.
- [ ] Works in light and dark themes and on a narrow viewport.
- [ ] No console errors or CSP violations.
- [ ] `README.md` and `CHANGELOG.md` updated when user-visible behavior changes.
