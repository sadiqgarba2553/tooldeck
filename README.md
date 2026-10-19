# Tooldeck

A separate Windows application with 79 local tools, grouped into PDF, Image, Video, Audio, Conversion and Utilities. The home screen uses searchable black-and-white tool cards. The original website is separate.

From this directory, run `npm ci`, `npm run setup:native`, `npm run build`, then `npm run desktop`. `npm run dist:win` writes a Windows x64 installer under the workspace's ignored `artifacts/tooldeck/` directory. Native setup downloads official QPDF 12.4.2 and verifies its SHA-256. FFmpeg is installed by the pinned dependency. PDF rendering fonts, the OCR runtime and English language data are bundled for offline use.

`npm test` checks the core utilities and exercises all 18 media operations with actual FFmpeg output decoding. `npm run test:desktop` tests the source desktop build; `node scripts/smoke-desktop.cjs --packaged` tests the packaged application with disposable profiles and generated fixtures.

PDF and image inputs are limited to 100 MB per file and 200 MB total, PDFs to 2,000 pages, and images to 50 megapixels. Media inputs are limited to 2 GB each and 4 GB total; output is limited to 2 GB. Native media processing runs in separate, cancellable processes. Heavy synchronous document operations finish their current step before cancellation can take effect.

PDF protection uses AES-256 via QPDF; unlocking requires the existing document password. Repair attempts structural recovery and cannot reconstruct missing content. Redaction permanently removes the selected area by rasterizing pages, which also removes selectable text, forms and links. Crop PDF only changes the visible page area. Visible signatures do not create certificate-backed digital signatures. Page copying and modifying signed PDFs may discard forms, bookmarks or signatures.

Office conversions provide practical basic exports, with their limits shown before processing. DOCX/HTML to PDF export text; spreadsheet conversion exports cell values; PPTX conversion exports slide text and embedded images. PDF to Word extracts selectable text, PDF to Excel groups positioned text, and PDF to PowerPoint renders each page as an image. OCR recognizes English offline. Archive PDF creates a flattened copy and does not certify PDF/A compliance. Background removal targets a selected solid color, rather than using an AI segmentation model.

Input documents never execute scripts, and external networking is blocked in the desktop app. The renderer is sandboxed, with a narrow IPC bridge for bundled native tools and user-selected media. Native output is saved only through the user's save dialog. Original source files and existing user profiles are preserved.

See [THIRD_PARTY.md](THIRD_PARTY.md) for bundled engines and notices. The previous 57-page web implementation remains in `archive/tooldeck-original/` as a reference.
