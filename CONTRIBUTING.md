# Contributing

Thank you for helping improve Web Utilities. This guide explains how to set up the project and what we look for in a change.

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug** using the bug report template. Include your browser, version, and steps to reproduce.
- **Suggest a tool or improvement** using the feature request template. Explain the task people are trying to complete.
- **Send a pull request** for a fix, a new tool, a test, or documentation.

For a larger change, open an issue first so we can agree on the approach before you invest time.

## Set up

```bash
git clone https://github.com/YOUR-USERNAME/web-utilities.git
cd web-utilities
npm install
npm start      # http://localhost:8080
```

Node.js 20.19 or later is required for tooling. The app itself has no build step: edit a file and refresh the page.

## Principles

1. **Private by default.** Tools process data locally. Do not add network requests, analytics, or remote resources.
2. **Simple and dependable.** Prefer the browser platform over libraries. Keep tools focused on one job.
3. **Accessible.** Keyboard users and screen reader users are first-class.
4. **Readable code.** Clear names and small functions beat cleverness.

The full list of engineering rules is in [AGENTS.md](AGENTS.md). It applies to human contributors too.

## Making a change

1. Create a branch from `main`: `git checkout -b feature/short-description`.
2. Make your change. Put testable logic in `js/lib/` and add tests in `tests/`.
3. Run `npm run check`. It runs ESLint, Prettier, the vendor check, and the tests.
4. Try the change in a browser, in light and dark themes, at desktop and phone widths. Confirm the console is clean.
5. Update `README.md` and `CHANGELOG.md` if behavior visible to users changed.
6. Open a pull request and fill in the template.

### Adding a tool

Follow [docs/ADDING_A_TOOL.md](docs/ADDING_A_TOOL.md). New tools should:

- solve a common task that is not already covered,
- work entirely client-side,
- have unit tests for their logic,
- include clear empty states and error messages.

### Adding a dependency

Avoid it where you can. If a library is truly needed, it must be MIT, Apache-2.0, BSD, or similarly permissive. Pin an exact version in `devDependencies`, register the files in `scripts/sync-vendor.mjs`, run `npm run vendor:sync`, and add attribution to `THIRD_PARTY_NOTICES.md`. Explain the choice in the pull request.

## Commit messages

Use short, imperative subjects, for example `Add UUID v7 generator` or `Fix PDF page order in merge`. Explain why in the body when it is not obvious. Conventional Commit prefixes are welcome but not required.

## Code style

Prettier and ESLint are the source of truth. Run `npm run format` to fix formatting. Use sentence case and plain language for interface text.

## Review

A maintainer will review your pull request. We may ask for changes. Small, focused pull requests are reviewed fastest.

## Licensing

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
