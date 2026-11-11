# Third-party notices

Web Utilities includes the following third-party software and assets, committed under `vendor/` and `assets/fonts/`. Each retains its own license.

| Component                                                             | Version | License     | Location                   |
| --------------------------------------------------------------------- | ------- | ----------- | -------------------------- |
| [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) | 2.0.4   | MIT         | `vendor/qrcode-generator/` |
| [pdf-lib](https://github.com/Hopding/pdf-lib)                         | 1.17.1  | MIT         | `vendor/pdf-lib/`          |
| [PDF.js](https://github.com/mozilla/pdf.js)                           | 6.5.438 | Apache-2.0  | `vendor/pdfjs/`            |
| [Nunito](https://github.com/googlefonts/nunito) (Fontsource build)    | 5.3.0   | SIL OFL 1.1 | `assets/fonts/`            |

## qrcode-generator

Copyright (c) 2009 Kazuhiko Arase. Licensed under the MIT license (see the header of `vendor/qrcode-generator/qrcode.js`).

The word "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.

## pdf-lib

Copyright (c) 2019 Andrew Dillon. Licensed under the MIT license. The full text is in `vendor/pdf-lib/LICENSE.md`.

## PDF.js

Copyright Mozilla Foundation and contributors. Licensed under the Apache License, Version 2.0. The full text is in `vendor/pdfjs/LICENSE`.

## Nunito

Copyright 2014 The Nunito Project Authors. Licensed under the SIL Open Font License, Version 1.1. The full text is in `assets/fonts/NUNITO-OFL.txt`.

## Updating

Versions are pinned in `package.json`. Run `npm run vendor:sync` after changing them, then update the table above.
