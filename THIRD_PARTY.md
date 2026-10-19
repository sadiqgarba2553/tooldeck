# Third-party components

Tooldeck runs the following bundled engines locally. Their licenses and notices are included in `resources/app.asar/dist/runtime/licenses/` (or the unpacked `dist/runtime/licenses/`).

- QPDF 12.4.2: Apache-2.0. Official Windows runtime, source and license: https://github.com/qpdf/qpdf/releases/tag/v12.4.2 . The build setup verifies the official archive SHA-256. QPDF is invoked as a separate process.
- FFmpeg 6.1.1 essentials, Gyan build distributed by `ffmpeg-static` 5.3.0: GPL-3.0. Invoked as a separate process. The complete upstream build configuration and source reference are included in `FFmpeg-build-and-source.txt`; license in `FFmpeg-GPL-3.0.txt`. FFmpeg source revision: https://github.com/FFmpeg/FFmpeg/commit/e38092ef93 . Build distributor and dependency/source information: https://www.gyan.dev/ffmpeg/builds/ . Static binary distribution: https://github.com/eugeneware/ffmpeg-static/releases/tag/b6.1.1 .
- PDF.js: Apache-2.0; pdf-lib and its fontkit fork: MIT. Noto Sans Arabic: SIL Open Font License, with font and license bundled in `runtime/fonts/`.
- Tesseract.js and its WebAssembly core: Apache-2.0. English trained data is bundled; OCR does not download a model at runtime.
- JSZip, DOCX, PptxGenJS, ExcelJS, UPNG, QRCode, Marked, Diff and Terser: see the bundled notices and their pinned package metadata in `package-lock.json`.

The Windows installer and managed app archive include these components. Tooldeck source and release build manifests are maintained in the BlueCloud repository. These notices do not replace the upstream licenses.
