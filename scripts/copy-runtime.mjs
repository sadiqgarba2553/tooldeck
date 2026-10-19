import {cp,mkdir,readdir,copyFile,writeFile} from 'node:fs/promises';
import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),modules=path.join(root,'node_modules'),runtime=path.join(root,'dist/runtime');
await mkdir(runtime,{recursive:true});await cp(path.join(root,'assets/fonts'),path.join(runtime,'fonts'),{recursive:true});
for(const [from,to] of [['pdfjs-dist/standard_fonts','pdf-fonts'],['pdfjs-dist/cmaps','cmaps'],['pdfjs-dist/wasm','pdf-wasm'],['tesseract.js/dist/worker.min.js','ocr/worker.min.js'],['@tesseract.js-data/eng/4.0.0/eng.traineddata.gz','ocr/data/eng.traineddata.gz']]){const target=path.join(runtime,to);await mkdir(path.dirname(target),{recursive:true});await cp(path.join(modules,from),target,{recursive:true});}
await mkdir(path.join(runtime,'ocr/core'),{recursive:true});for(const name of await readdir(path.join(modules,'tesseract.js-core')))if(/lstm\.(wasm|wasm.js)$/.test(name))await copyFile(path.join(modules,'tesseract.js-core',name),path.join(runtime,'ocr/core',name));
const notices=path.join(runtime,'licenses');await mkdir(notices,{recursive:true});
for(const name of ['@pdf-lib/fontkit','pdf-lib','pdfjs-dist','tesseract.js','tesseract.js-core','@tesseract.js-data/eng','qrcode','docx','pptxgenjs','exceljs','jszip','marked','diff','terser','upng-js','ffmpeg-static'])for(const filename of ['LICENSE','LICENSE.txt','LICENSE.md','LICENSE.MIT','LICENSE.APACHE2'])try{await copyFile(path.join(modules,name,filename),path.join(notices,name.replaceAll('/','-')+'-'+filename));}catch(error){if(error.code!=='ENOENT')throw error;}
await cp(path.join(modules,'ffmpeg-static/ffmpeg.exe.LICENSE'),path.join(notices,'FFmpeg-GPL-3.0.txt'));await cp(path.join(modules,'ffmpeg-static/ffmpeg.exe.README'),path.join(notices,'FFmpeg-build-and-source.txt'));
console.log('Bundled PDF fonts, OCR engine, English language data and third-party notices for offline use.');

await copyFile(path.join(modules,'pdfjs-dist/LICENSE'),path.join(notices,'QPDF-Apache-2.0.txt'));await writeFile(path.join(notices,'QPDF-NOTICE.txt'),'QPDF 12.4.2. Copyright the QPDF contributors. Apache-2.0. Source and distribution: https://github.com/qpdf/qpdf/releases/tag/v12.4.2\n');
