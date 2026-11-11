# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Regex tester evaluates patterns in a Web Worker with a 1.5 second limit.

## [1.0.0] - 2026-11-11

### Added

- Images & PDF: file converter (PNG, JPEG, WebP, BMP, ICO, PDF in and out), image resizer, PDF toolkit (merge, extract, rotate).
- Generate: QR codes (links, text, Wi-Fi) with PNG and SVG export, password generator, UUID generator (v4, v7), lorem ipsum.
- Text: word counter, case converter, line tools, text diff.
- Encode & inspect: Base64, URL tools, hash generator, JWT decoder, JSON formatter, regex tester, browser info.
- Convert: timestamp, color (with WCAG contrast), and unit converters.
- Light and dark themes, search, keyboard shortcut (`/`), responsive layout.
- Offline support through a service worker and an installable web app manifest.
- Strict Content Security Policy; no network requests to other origins.
- Unit tests, linting, formatting, and continuous integration.

[Unreleased]: https://github.com/YOUR-USERNAME/web-utilities/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/YOUR-USERNAME/web-utilities/releases/tag/v1.0.0
