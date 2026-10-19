const {expect,_electron:electron}=require('@playwright/test');
const fs=require('node:fs/promises'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {PDFDocument}=require('pdf-lib');
const appDir=path.resolve(__dirname,'..'),root=path.resolve(appDir,'../..'),artifacts=path.join(root,'artifacts');
(async()=>{const profile=await fs.mkdtemp(path.join(artifacts,'tooldeck-card-test-')),packaged=process.argv.includes('--packaged');let app;
  try{const doc=await PDFDocument.create();for(let n=1;n<=3;n++)doc.addPage([600,400]).drawText(`Hello Tooldeck ${n}`,{x:50,y:250,size:35});const fixture=Buffer.from(await doc.save());
    app=await electron.launch(packaged?{executablePath:path.join(artifacts,'tooldeck/win-unpacked/Tooldeck.exe'),args:[`--user-data-dir=${profile}`]}:{executablePath:require('electron'),args:[appDir,`--user-data-dir=${profile}`]});
    const page=await app.firstWindow(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await expect(page.locator('.tool-card')).toHaveCount(79);await expect(page.locator('.categories button')).toHaveCount(7);await page.screenshot({path:path.join(artifacts,'screenshots/tooldeck-cards.png'),fullPage:false});
    async function choose(name){console.log("Checking",name);if(!await page.locator('#catalog-view').isVisible())await page.locator('#back').click();await page.locator('#search').fill(name);await page.getByRole('button',{name,exact:true}).click();}
    async function file(bytes=fixture,name='fixture.pdf',mimeType='application/pdf'){await page.locator('#files').setInputFiles({name,mimeType,buffer:bytes});}
    async function run(){await page.locator('#run').click();await expect(page.locator('#status')).toContainText('Done.',{timeout:120000});}
    async function bytes(){return Buffer.from(await page.locator('#downloads a').first().evaluate(async a=>Array.from(new Uint8Array(await(await fetch(a.href)).arrayBuffer()))));}
    await choose('JSON formatter');await page.locator('#input').fill('{"hello":"Tooldeck"}');await run();expect(await page.locator('#output').inputValue()).toContain('"hello": "Tooldeck"');
    await choose('QR code');await page.locator('#input').fill('Tooldeck');await run();await expect(page.locator('#preview img')).toBeVisible();
    await choose('Split PDF');await file();await page.locator('#pages').fill('3, 1');await run();expect((await PDFDocument.load(await bytes())).getPageCount()).toBe(2);
    await choose('Read PDF');await file();await run();await expect(page.locator('#preview canvas')).toBeVisible();await expect(page.locator('#output')).toHaveValue(/Hello Tooldeck/);
    await choose('Protect PDF');await file();await page.locator('#password').fill('tooldeck-test-password');await run();const encrypted=await bytes();await expect(PDFDocument.load(encrypted)).rejects.toThrow();
    await choose('Unlock PDF');await file(encrypted,'protected.pdf');await page.locator('#password').fill('tooldeck-test-password');await run();expect((await PDFDocument.load(await bytes())).getPageCount()).toBe(3);
    await choose('Compress PDF');await file();await run();expect((await PDFDocument.load(await bytes())).getPageCount()).toBe(3);
    await choose('Redact PDF');await file();await page.locator('#width').fill('300');await page.locator('#height').fill('200');await run();expect((await PDFDocument.load(await bytes())).getPageCount()).toBe(3);
    await choose('PDF to Word');await file();await run();const {default:JSZip}=await import('jszip');const word=await JSZip.loadAsync(await bytes());expect(await word.file('word/document.xml').async('string')).toContain('Hello Tooldeck');
    await choose('PDF to PowerPoint');await file();await run();const ppt=await JSZip.loadAsync(await bytes());expect(Object.keys(ppt.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n))).toHaveLength(3);
    await choose('PDF to Excel');await file();await run();expect((await JSZip.loadAsync(await bytes())).file('xl/workbook.xml')).not.toBeNull();
    await choose('OCR PDF');await file(fixture,'scan.pdf');await run();expect(await page.locator('#output').inputValue()).toMatch(/Hello Tooldeck/);
    const png=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=160;c.height=100;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,160,100);x.fillStyle='black';x.fillRect(40,20,80,60);return c.toDataURL('image/png').split(',')[1];}),'base64');
    await choose('Resize image');await file(png,'test.png','image/png');await page.locator('#width').fill('80');await run();await expect(page.locator('#preview img')).toBeVisible();expect(await page.locator('#preview img').evaluate(img=>img.naturalWidth)).toBe(80);
    await choose('Compress PNG');await file(png,'test.png','image/png');await run();expect((await bytes()).length).toBeLessThanOrEqual(png.length);
    await choose('Image to ICO');await file(png,'test.png','image/png');await run();expect((await bytes()).readUInt16LE(2)).toBe(1);
    await choose('HTML to PDF');await file(Buffer.from('<h1>Hello Tooldeck</h1><p>السلام عليكم</p>'),'test.html','text/html');await run();expect((await PDFDocument.load(await bytes())).getPageCount()).toBeGreaterThan(0);
    await choose('Merge PDF');await page.locator('#files').setInputFiles([{name:'one.pdf',mimeType:'application/pdf',buffer:fixture},{name:'two.pdf',mimeType:'application/pdf',buffer:fixture}]);await run();expect((await PDFDocument.load(await bytes())).getPageCount()).toBe(6);
    await choose('Rotate PDF');await file();await run();expect((await PDFDocument.load(await bytes())).getPage(0).getRotation().angle).toBe(90);
    await choose('Crop PDF');await file();await run();expect((await PDFDocument.load(await bytes())).getPage(0).getCropBox().width).toBe(100);
    await choose('Watermark PDF');await file();await run();expect((await PDFDocument.load(await bytes())).getPageCount()).toBe(3);
    await choose('Page numbers');await file();await run();expect((await PDFDocument.load(await bytes())).getPageCount()).toBe(3);
    await choose('Sign PDF');await file();await run();expect((await PDFDocument.load(await bytes())).getPageCount()).toBe(3);
    await choose('Sign PDF');await file();await page.locator('#mode').selectOption('image');await page.locator('#signature-file').setInputFiles({name:'signature.png',mimeType:'image/png',buffer:png});await run();expect((await PDFDocument.load(await bytes())).getPageCount()).toBe(3);
    const formPdf=await PDFDocument.create(),formPage=formPdf.addPage(),field=formPdf.getForm().createTextField('name');field.setText('Tooldeck');field.addToPage(formPage,{x:20,y:20,width:180,height:25});await choose('Flatten PDF');await file(Buffer.from(await formPdf.save()));await run();expect((await PDFDocument.load(await bytes())).getForm().getFields()).toHaveLength(0);
    await choose('Repair PDF');await file();await run();expect((await PDFDocument.load(await bytes())).getPageCount()).toBe(3);
    await choose('JPG to PDF');await file(png,'scan.png','image/png');await run();expect((await PDFDocument.load(await bytes())).getPageCount()).toBe(1);
    await choose('Scan to PDF');await file(png,'scan.png','image/png');await run();expect((await PDFDocument.load(await bytes())).getPageCount()).toBe(1);
    const wav=Buffer.alloc(16044);wav.write('RIFF');wav.writeUInt32LE(16036,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(16000,40);const sample=path.join(profile,'sample.wav'),audioOut=path.join(profile,'converted.mp3');await fs.writeFile(sample,wav);
    async function nativeInput(input,output){await app.evaluate(({dialog},paths)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[paths.input]});dialog.showSaveDialog=async()=>({canceled:false,filePath:paths.output});},{input,output});}
    await choose('Convert audio');await nativeInput(sample,audioOut);await page.locator('#choose-media').click();await run();await page.getByRole('button',{name:/Save tooldeck-audio-convert/}).click();await expect.poll(async()=>fs.stat(audioOut).then(s=>s.size).catch(()=>0)).toBeGreaterThan(100);
    const ffmpeg=require('ffmpeg-static'),video=path.join(profile,'sample.mp4'),videoOut=path.join(profile,'trimmed.mp4');const generated=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=black:s=160x120:d=2','-c:v','libx264','-pix_fmt','yuv420p',video],{windowsHide:true,timeout:20000});expect(generated.status).toBe(0);
    await choose('Trim video');await nativeInput(video,videoOut);await page.locator('#choose-media').click();await page.locator('#duration').fill('1');await run();await page.getByRole('button',{name:/Save tooldeck-video-trim/}).click();await expect.poll(async()=>fs.stat(videoOut).then(s=>s.size).catch(()=>0)).toBeGreaterThan(100);
    expect(await page.evaluate(()=>typeof window.require)).toBe('undefined');expect(errors).toEqual([]);console.log('79 cards, JSON, QR, PDF rendering/splitting/encryption/decryption/compression/redaction, Office exports, offline OCR, PNG/ICO processing and real audio/video conversion passed.');
  }finally{if(app)await app.close();if(!profile.startsWith(artifacts+path.sep))throw Error('Unsafe cleanup');await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
})().catch(error=>{console.error(error);process.exitCode=1;});
